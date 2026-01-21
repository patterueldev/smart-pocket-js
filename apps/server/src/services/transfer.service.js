const { pool } = require('../config/database');
const { logger } = require('../utils/logger');
const actualBudgetService = require('./actual-budget.service');
const Dinero = require('dinero.js');

/**
 * Create a new transfer transaction
 */
async function createTransfer(draft) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Calculate total (amount + fee if applicable)
    let total = draft.amount;
    if (draft.hasFee && draft.fee) {
      const amountDinero = Dinero({
        amount: Math.round(parseFloat(draft.amount.amount) * 100),
        currency: draft.amount.currency.toUpperCase(),
      });
      const feeDinero = Dinero({
        amount: Math.round(parseFloat(draft.fee.amount) * 100),
        currency: draft.fee.currency.toUpperCase(),
      });
      const totalDinero = amountDinero.add(feeDinero);
      total = {
        amount: (totalDinero.getAmount() / 100).toFixed(2),
        currency: draft.amount.currency,
      };
    }
    
    // Insert transfer transaction
    const insertQuery = `
      INSERT INTO transactions (
        transaction_type,
        transfer_type,
        date,
        from_account_id,
        to_account_id,
        transfer_fee,
        payee_id,
        total,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      'transfer',
      draft.transferType,
      draft.date,
      draft.fromAccountId,
      draft.toAccountId,
      draft.hasFee && draft.fee ? JSON.stringify(draft.fee) : null,
      draft.atmPayeeId || null,
      JSON.stringify(total),
      draft.notes || null,
    ];
    
    const result = await client.query(insertQuery, values);
    const transfer = result.rows[0];
    
    // Sync to Actual Budget
    const actualBudgetId = await syncToActualBudget(draft, total);
    
    // Update with Actual Budget ID
    if (actualBudgetId) {
      await client.query(
        'UPDATE transactions SET actual_budget_id = $1 WHERE id = $2',
        [actualBudgetId, transfer.id]
      );
      transfer.actual_budget_id = actualBudgetId;
    }
    
    await client.query('COMMIT');
    
    logger.info('Transfer created', { 
      transferId: transfer.id,
      type: draft.transferType,
      actualBudgetId,
    });
    
    return formatTransfer(transfer);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Failed to create transfer', { error: error.message, draft });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Sync transfer to Actual Budget
 */
async function syncToActualBudget(draft, total) {
  try {
    if (!draft.hasFee || !draft.fee) {
      // Simple transfer: single transaction
      const payeeName = draft.atmPayeeId 
        ? await getPayeeName(draft.atmPayeeId)
        : null;
      
      const notes = payeeName 
        ? `ATM/Source: ${payeeName}${draft.notes ? ' | ' + draft.notes : ''}`
        : draft.notes;
      
      return await actualBudgetService.createTransferTransaction({
        date: draft.date,
        fromAccountId: draft.fromAccountId,
        toAccountId: draft.toAccountId,
        amount: draft.amount.amount,
        notes,
      });
    } else {
      // Transfer with fee: create split transaction
      return await createSplitTransferTransaction(draft, total);
    }
  } catch (error) {
    logger.error('Failed to sync transfer to Actual Budget', { 
      error: error.message,
      draft,
    });
    // Don't throw - allow transfer to be created even if AB sync fails
    return null;
  }
}

/**
 * Create split transaction for transfer with fee
 */
async function createSplitTransferTransaction(draft, total) {
  // Get payee name for display
  const payeeName = draft.atmPayeeId 
    ? await getPayeeName(draft.atmPayeeId)
    : 'Transfer Fee';
  
  // Create parent transaction with splits
  const subtransactions = [
    {
      // Transfer amount to destination account
      payeeId: draft.toAccountId, // Destination account as payee
      categoryId: null, // Transfer category (null = transfer)
      amount: draft.amount.amount,
      notes: 'Transfer',
    },
    {
      // Fee transaction
      payeeId: draft.atmPayeeId,
      categoryId: await getBankFeeCategoryId(),
      amount: draft.fee.amount,
      notes: 'Transfer/Withdraw Fee',
    },
  ];
  
  return await actualBudgetService.createSplitTransaction({
    date: draft.date,
    accountId: draft.fromAccountId,
    payeeId: draft.atmPayeeId,
    amount: total.amount,
    notes: draft.notes,
    subtransactions,
  });
}

/**
 * Get transfers with filters
 */
async function getTransfers(filters = {}) {
  try {
    const { limit = 50, offset = 0, startDate, endDate } = filters;
    
    let query = `
      SELECT 
        t.*,
        fa.name as from_account_name,
        ta.name as to_account_name,
        p.name as atm_payee_name
      FROM transactions t
      LEFT JOIN accounts fa ON t.from_account_id = fa.id
      LEFT JOIN accounts ta ON t.to_account_id = ta.id
      LEFT JOIN payees p ON t.payee_id = p.id
      WHERE t.transaction_type = 'transfer'
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (startDate) {
      query += ` AND t.date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }
    
    if (endDate) {
      query += ` AND t.date <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }
    
    query += ` ORDER BY t.date DESC, t.created_at DESC`;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    return {
      transfers: result.rows.map(formatTransfer),
      total: result.rowCount,
      limit,
      offset,
    };
  } catch (error) {
    logger.error('Failed to get transfers', { error: error.message });
    throw error;
  }
}

/**
 * Get transfer by ID
 */
async function getTransferById(id) {
  try {
    const query = `
      SELECT 
        t.*,
        fa.name as from_account_name,
        ta.name as to_account_name,
        p.name as atm_payee_name
      FROM transactions t
      LEFT JOIN accounts fa ON t.from_account_id = fa.id
      LEFT JOIN accounts ta ON t.to_account_id = ta.id
      LEFT JOIN payees p ON t.payee_id = p.id
      WHERE t.id = $1 AND t.transaction_type = 'transfer'
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return formatTransfer(result.rows[0]);
  } catch (error) {
    logger.error('Failed to get transfer', { error: error.message, id });
    throw error;
  }
}

/**
 * Format transfer for API response
 */
function formatTransfer(row) {
  return {
    id: row.id,
    date: row.date,
    transferType: row.transfer_type,
    fromAccountId: row.from_account_id,
    fromAccountName: row.from_account_name,
    toAccountId: row.to_account_id,
    toAccountName: row.to_account_name,
    amount: typeof row.total === 'string' ? JSON.parse(row.total) : row.total,
    fee: row.transfer_fee 
      ? (typeof row.transfer_fee === 'string' ? JSON.parse(row.transfer_fee) : row.transfer_fee)
      : null,
    atmPayeeId: row.payee_id,
    atmPayeeName: row.atm_payee_name,
    actualBudgetId: row.actual_budget_id,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get payee name by ID
 */
async function getPayeeName(payeeId) {
  try {
    const result = await pool.query('SELECT name FROM payees WHERE id = $1', [payeeId]);
    return result.rows[0]?.name || 'Unknown';
  } catch (error) {
    logger.error('Failed to get payee name', { error: error.message, payeeId });
    return 'Unknown';
  }
}

/**
 * Get or create Bank Fees category in Actual Budget
 */
async function getBankFeeCategoryId() {
  try {
    // This would need to be implemented in actual-budget.service.js
    // For now, return null (uncategorized)
    return null;
  } catch (error) {
    logger.error('Failed to get bank fee category', { error: error.message });
    return null;
  }
}

module.exports = {
  createTransfer,
  getTransfers,
  getTransferById,
};
