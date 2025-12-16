// Example: Creating a transaction in Actual Budget
// See: ../README.md for setup instructions

import * as actual from '@actual-app/api';

async function createTransaction(transactionData) {
  // Initialize connection
  await actual.init({
    serverURL: process.env.ACTUAL_SERVER_URL,
    password: process.env.ACTUAL_PASSWORD,
  });

  // Load budget
  await actual.downloadBudget(process.env.ACTUAL_BUDGET_ID);

  // Get or create payee
  let payee = await actual.getPayeeByName(transactionData.payeeName);
  if (!payee) {
    payee = await actual.createPayee({ name: transactionData.payeeName });
  }

  // Create transaction
  // Note: Amounts are in cents, expenses are negative
  const transaction = await actual.createTransaction({
    account: transactionData.accountId,
    date: transactionData.date, // YYYY-MM-DD
    payee: payee.id,
    amount: Math.round(transactionData.amount * -100), // Convert to cents, negative for expense
    notes: transactionData.notes || '',
    cleared: false,
  });

  console.log('Created transaction:', transaction);

  // Cleanup
  await actual.shutdown();

  return transaction;
}

// Example usage
const exampleTransaction = {
  payeeName: 'Walmart',
  accountId: 'your-account-uuid',
  date: '2025-12-15',
  amount: 45.99,
  notes: 'Groceries - imported from Smart Pocket',
};

createTransaction(exampleTransaction)
  .then(tx => console.log('Success!', tx))
  .catch(err => console.error('Error:', err));
