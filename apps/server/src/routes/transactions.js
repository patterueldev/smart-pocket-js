const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const transactionService = require('../services/transaction.service');

/**
 * GET /api/v1/transactions
 * List transactions with filters
 */
router.get('/', asyncHandler(async (req, res) => {
  const {
    limit = 50,
    offset = 0,
    startDate,
    endDate,
    payeeId,
  } = req.query;

  const filters = {
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    startDate,
    endDate,
    payeeId,
  };

  const result = await transactionService.getTransactions(filters);

  res.json(result);
}));

/**
 * GET /api/v1/transactions/:id
 * Get transaction by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const transaction = await transactionService.getTransactionById(id);

  if (!transaction) {
    return res.status(404).json({
      error: 'not_found',
      message: 'Transaction not found',
    });
  }

  res.json(transaction);
}));

/**
 * POST /api/v1/transactions
 * Create new transaction
 */
router.post('/', asyncHandler(async (req, res) => {
  const { date, payeeId, accountId, items, ocrMetadata } = req.body;

  // Validation
  if (!date || !payeeId || !accountId || !items || !Array.isArray(items)) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'Missing required fields: date, payeeId, accountId, items',
    });
  }

  if (items.length === 0) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'At least one item is required',
    });
  }

  // Validate each item
  for (const item of items) {
    if (!item.codeName || !item.readableName || !item.price || !item.quantity) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Each item must have: codeName, readableName, price, quantity',
      });
    }

    // Validate price object
    if (typeof item.price !== 'object' || !item.price.amount || !item.price.currency) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Price must be an object with amount and currency',
        details: {
          expected: { amount: 'string', currency: 'string' },
        },
      });
    }
  }

  const transaction = await transactionService.createTransaction({
    date,
    payeeId,
    accountId,
    items,
    ocrMetadata,
  });

  res.status(201).json(transaction);
}));

/**
 * PUT /api/v1/transactions/:id
 * Update transaction
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date, payeeId, accountId, items, ocrMetadata } = req.body;

  const transaction = await transactionService.updateTransaction(id, {
    date,
    payeeId,
    accountId,
    items,
    ocrMetadata,
  });

  if (!transaction) {
    return res.status(404).json({
      error: 'not_found',
      message: 'Transaction not found',
    });
  }

  res.json(transaction);
}));

/**
 * DELETE /api/v1/transactions/:id
 * Delete transaction
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deleted = await transactionService.deleteTransaction(id);

  if (!deleted) {
    return res.status(404).json({
      error: 'not_found',
      message: 'Transaction not found',
    });
  }

  res.status(204).send();
}));

module.exports = router;
