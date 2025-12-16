/**
 * Example: Get Account Balances from Actual Budget
 * 
 * This example demonstrates how to fetch account balances using ActualQL.
 * Balances are calculated by summing all transactions for each account.
 * 
 * References:
 * - ActualQL Docs: https://actualbudget.org/docs/api/actual-ql/
 * - API Reference: https://actualbudget.org/docs/api/reference
 */

const api = require('@actual-app/api');

/**
 * Get account balances with cleared/uncleared breakdown
 * 
 * Implementation approach:
 * 1. Query all active accounts
 * 2. For each account, query all transactions
 * 3. Sum transactions by cleared status
 * 4. Convert amounts from cents to dollars
 * 
 * @returns {Promise<Array>} Array of account balances
 */
async function getAccountBalances() {
  const { q, runQuery, utils } = api;

  try {
    // Step 1: Get all active accounts (not closed)
    console.log('Fetching accounts...');
    const { data: accounts } = await runQuery(
      q('accounts')
        .select(['id', 'name', 'offbudget', 'closed'])
        .filter({ closed: 0 })  // Only active accounts
    );

    console.log(`Found ${accounts.length} active accounts`);

    // Step 2: For each account, calculate cleared and uncleared balances
    const balances = await Promise.all(
      accounts.map(async (account) => {
        console.log(`  Calculating balance for: ${account.name}`);

        // Get all transactions for this account
        // Use 'inline' split mode to avoid double-counting
        const { data: transactions } = await runQuery(
          q('transactions')
            .filter({ account: account.id })
            .select(['amount', 'cleared'])
            .options({ splits: 'inline' })  // Critical: prevents double-counting splits
        );

        // Sum transactions by cleared status
        let clearedBalance = 0;
        let unclearedBalance = 0;

        transactions.forEach(txn => {
          // Actual Budget uses 1/0 for cleared status
          if (txn.cleared) {
            clearedBalance += txn.amount;
          } else {
            unclearedBalance += txn.amount;
          }
        });

        // Convert from cents to dollars
        // Actual stores amounts as integers: $100.00 = 10000
        const clearedDollars = utils.integerToAmount(clearedBalance);
        const unclearedDollars = utils.integerToAmount(unclearedBalance);

        return {
          accountId: account.id,
          accountName: account.name,
          offBudget: account.offbudget === 1,
          cleared: {
            amount: clearedDollars.toFixed(2),
            currency: 'USD'  // Actual doesn't store currency per account
          },
          uncleared: {
            amount: unclearedDollars.toFixed(2),
            currency: 'USD'
          },
          total: {
            amount: (clearedDollars + unclearedDollars).toFixed(2),
            currency: 'USD'
          }
        };
      })
    );

    return balances;
  } catch (error) {
    console.error('Error fetching account balances:', error);
    throw error;
  }
}

/**
 * Alternative: Get single account balance
 * More efficient when you only need one account
 */
async function getAccountBalance(accountId) {
  const { q, runQuery, utils } = api;

  try {
    // Get account info
    const { data: accounts } = await runQuery(
      q('accounts')
        .select(['id', 'name'])
        .filter({ id: accountId })
    );

    if (accounts.length === 0) {
      throw new Error(`Account not found: ${accountId}`);
    }

    const account = accounts[0];

    // Get transactions
    const { data: transactions } = await runQuery(
      q('transactions')
        .filter({ account: accountId })
        .select(['amount', 'cleared'])
        .options({ splits: 'inline' })
    );

    // Calculate balances
    let clearedBalance = 0;
    let unclearedBalance = 0;

    transactions.forEach(txn => {
      if (txn.cleared) {
        clearedBalance += txn.amount;
      } else {
        unclearedBalance += txn.amount;
      }
    });

    return {
      accountId: account.id,
      accountName: account.name,
      cleared: {
        amount: utils.integerToAmount(clearedBalance).toFixed(2),
        currency: 'USD'
      },
      uncleared: {
        amount: utils.integerToAmount(unclearedBalance).toFixed(2),
        currency: 'USD'
      }
    };
  } catch (error) {
    console.error('Error fetching account balance:', error);
    throw error;
  }
}

/**
 * Example usage
 */
async function main() {
  try {
    // Initialize connection
    console.log('Connecting to Actual Budget...');
    await api.init({
      dataDir: './actual-cache',
      serverURL: process.env.ACTUAL_SERVER_URL || 'http://localhost:5006',
      password: process.env.ACTUAL_PASSWORD,
    });

    // Download budget
    const budgetId = process.env.ACTUAL_BUDGET_ID;
    console.log(`Downloading budget: ${budgetId}`);
    await api.downloadBudget(budgetId);

    // Get all account balances
    console.log('\n=== All Account Balances ===');
    const balances = await getAccountBalances();
    
    balances.forEach(balance => {
      console.log(`\n${balance.accountName}:`);
      console.log(`  Cleared:   $${balance.cleared.amount}`);
      console.log(`  Uncleared: $${balance.uncleared.amount}`);
      console.log(`  Total:     $${balance.total.amount}`);
      console.log(`  Off-Budget: ${balance.offBudget}`);
    });

    // Example: Get single account balance
    if (balances.length > 0) {
      console.log('\n=== Single Account Example ===');
      const singleBalance = await getAccountBalance(balances[0].accountId);
      console.log(JSON.stringify(singleBalance, null, 2));
    }

    // Cleanup
    await api.shutdown();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Export for use in other modules
module.exports = {
  getAccountBalances,
  getAccountBalance,
};

// Run if called directly
if (require.main === module) {
  main();
}
