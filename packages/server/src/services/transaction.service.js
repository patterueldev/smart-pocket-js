const pool = require('../config/database');
const { logger } = require('../utils/logger');
const payeeService = require('./payee.service');
const accountService = require('./account.service');
const actualBudgetService = require('./actual-budget.service');
const Dinero = require('dinero.js');

/**
 * Get transactions with filters
 */
async function getTransactions(filters) {
  try {
    const { limit, offset, startDate, endDate, payeeId } = filters;
    
    let query = `
      SELECT 
        t.id,
        t.date,
        t.total,
        t.actual_budget_id,
        t.notes,
        t.created_at,
        t.updated_at,
        json_build_object(
          'id', p.id,
          'name', p.name,
          'transactionCount', p.transaction_count
        ) as payee,
        json_build_object(
          'id', a.id,
          'name', a.name,
          'actualBudgetId', a.actual_budget_id
        ) as account
      FROM transactions t
      JOIN payees p ON t.payee_id = p.id
      JOIN accounts a ON t.account_id = a.id
      WHERE 1=1
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

    if (payeeId) {
      query += ` AND t.payee_id = $${paramCount}`;
      params.push(payeeId);
      paramCount++;
    }

    // Count total for pagination
    const countQuery = query.replace(
      'SELECT t.id, t.date, t.total, t.actual_budget_id, t.notes, t.created_at, t.updated_at, json_build_object',
      'SELECT COUNT(*)'
    ).split('FROM')[0] + ' FROM' + query.split('FROM')[1].split('ORDER BY')[0];

    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    // Add ordering and pagination
    query += ` ORDER BY t.date DESC, t.created_at DESC`;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Fetch line items for each transaction
    const transactions = await Promise.all(
      result.rows.map(async (row) => {
        const items = await getLineItemsByTransactionId(row.id);
        return {
          ...row,
          items,
        };
      })
    );

    return {
      transactions,
      total,
      limit,
      offset,
    };
  } catch (error) {
    logger.error('Error fetching transactions', { error: error.message, filters });
    throw error;
  }
}

/**
 * Get transaction by ID
 */
async function getTransactionById(id) {
  try {
    const query = `
      SELECT 
        t.id,
        t.date,
        t.total,
        t.actual_budget_id,
        t.notes,
        t.created_at,
        t.updated_at,
        json_build_object(
          'id', p.id,
          'name', p.name,
          'transactionCount', p.transaction_count
        ) as payee,
        json_build_object(
          'id', a.id,
          'name', a.name,
          'actualBudgetId', a.actual_budget_id
        ) as account
      FROM transactions t
      JOIN payees p ON t.payee_id = p.id
      JOIN accounts a ON t.account_id = a.id
      WHERE t.id = $1
    `;

    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const transaction = result.rows[0];
    transaction.items = await getLineItemsByTransactionId(id);

    return transaction;
  } catch (error) {
    logger.error('Error fetching transaction', { error: error.message, id });
    throw error;
  }
}

/**
 * Create new transaction
 */
async function createTransaction(data) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { date, payeeId, accountId, items, ocrMetadata } = data;

    // Calculate total from items
    const total = calculateTotal(items);

    // Insert transaction
    const transactionQuery = `
      INSERT INTO transactions (date, payee_id, account_id, total)
      VALUES ($1, $2, $3, $4)
      RETURNING id, date, payee_id, account_id, total, created_at, updated_at
    `;

    const transactionResult = await client.query(transactionQuery, [
      date,
      payeeId,
      accountId,
      JSON.stringify(total),
    ]);

    const transactionId = transactionResult.rows[0].id;

    // Insert line items
    for (const item of items) {
      await createLineItem(client, transactionId, item);
    }

    // Insert OCR metadata if provided
    if (ocrMetadata) {
      await createOCRMetadata(client, transactionId, ocrMetadata);
    }

    // Update payee transaction count
    await client.query(
      'UPDATE payees SET transaction_count = transaction_count + 1 WHERE id = $1',
      [payeeId]
    );

    // Sync to Actual Budget
    const actualBudgetId = await actualBudgetService.createTransaction({
      date,
      payeeId,
      accountId,
      amount: total.amount,
      currency: total.currency,
    });

    await client.query(
      'UPDATE transactions SET actual_budget_id = $1 WHERE id = $2',
      [actualBudgetId, transactionId]
    );

    await client.query('COMMIT');

    logger.info('Transaction created', {
      transactionId,
      payeeId,
      total: total.amount,
    });

    // Return full transaction
    return await getTransactionById(transactionId);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error creating transaction', { error: error.message, data });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Update transaction
 */
async function updateTransaction(id, data) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { date, payeeId, accountId, items } = data;

    // Check if transaction exists
    const existing = await getTransactionById(id);
    if (!existing) {
      await client.query('ROLLBACK');
      return null;
    }

    // Calculate new total
    const total = calculateTotal(items);

    // Update transaction
    const updateQuery = `
      UPDATE transactions
      SET date = $1, payee_id = $2, account_id = $3, total = $4, updated_at = NOW()
      WHERE id = $5
    `;

    await client.query(updateQuery, [
      date,
      payeeId,
      accountId,
      JSON.stringify(total),
      id,
    ]);

    // Delete existing line items
    await client.query('DELETE FROM line_items WHERE transaction_id = $1', [id]);

    // Insert new line items
    for (const item of items) {
      await createLineItem(client, id, item);
    }

    // Update Actual Budget
    if (existing.actual_budget_id) {
      await actualBudgetService.updateTransaction(existing.actual_budget_id, {
        date,
        payeeId,
        accountId,
        amount: total.amount,
        currency: total.currency,
      });
    }

    await client.query('COMMIT');

    logger.info('Transaction updated', { transactionId: id });

    return await getTransactionById(id);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error updating transaction', { error: error.message, id, data });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Delete transaction
 */
async function deleteTransaction(id) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const transaction = await getTransactionById(id);
    if (!transaction) {
      await client.query('ROLLBACK');
      return false;
    }

    // Delete from Actual Budget
    if (transaction.actual_budget_id) {
      await actualBudgetService.deleteTransaction(transaction.actual_budget_id);
    }

    // Delete transaction (cascade will delete line items and OCR metadata)
    await client.query('DELETE FROM transactions WHERE id = $1', [id]);

    // Decrement payee transaction count
    await client.query(
      'UPDATE payees SET transaction_count = transaction_count - 1 WHERE id = $1',
      [transaction.payee.id]
    );

    await client.query('COMMIT');

    logger.info('Transaction deleted', { transactionId: id });

    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error deleting transaction', { error: error.message, id });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get line items by transaction ID
 */
async function getLineItemsByTransactionId(transactionId) {
  const query = `
    SELECT 
      id,
      code_name,
      readable_name,
      price,
      quantity,
      store_item_id
    FROM line_items
    WHERE transaction_id = $1
    ORDER BY created_at ASC
  `;

  const result = await pool.query(query, [transactionId]);
  return result.rows;
}

/**
 * Create line item
 */
async function createLineItem(client, transactionId, item) {
  const query = `
    INSERT INTO line_items (
      transaction_id,
      code_name,
      readable_name,
      price,
      quantity,
      store_item_id
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id
  `;

  await client.query(query, [
    transactionId,
    item.codeName,
    item.readableName,
    JSON.stringify(item.price),
    item.quantity,
    item.storeItemId || null,
  ]);
}

/**
 * Create OCR metadata
 */
async function createOCRMetadata(client, transactionId, metadata) {
  const query = `
    INSERT INTO ocr_metadata (
      transaction_id,
      raw_text,
      remarks,
      confidence_score,
      parsing_confidence,
      corrections
    )
    VALUES ($1, $2, $3, $4, $5, $6)
  `;

  await client.query(query, [
    transactionId,
    metadata.rawText || null,
    metadata.remarks || null,
    metadata.confidence || null,
    metadata.parsingConfidence || null,
    metadata.corrections ? JSON.stringify(metadata.corrections) : null,
  ]);
}

/**
 * Calculate total from items using Dinero.js
 */
function calculateTotal(items) {
  if (items.length === 0) {
    return { amount: '0.00', currency: 'USD' };
  }

  // Assume all items have the same currency (validate this in route)
  const currency = items[0].price.currency;

  // Convert items to Dinero objects
  const dineroItems = items.map(item => {
    const cents = Math.round(parseFloat(item.price.amount) * 100);
    return Dinero({ amount: cents, currency }).multiply(item.quantity);
  });

  // Sum all items
  const total = dineroItems.reduce((sum, item) => sum.add(item));

  return {
    amount: total.toUnit().toFixed(2),
    currency: total.getCurrency(),
  };
}

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
