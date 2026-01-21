const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const transferService = require('../services/transfer.service');

/**
 * GET /api/v1/transfers
 * List transfers with filters
 */
router.get('/', asyncHandler(async (req, res) => {
  const {
    limit = 50,
    offset = 0,
    startDate,
    endDate,
  } = req.query;

  const filters = {
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    startDate,
    endDate,
  };

  const result = await transferService.getTransfers(filters);

  res.json(result);
}));

/**
 * GET /api/v1/transfers/:id
 * Get transfer by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const transfer = await transferService.getTransferById(id);

  if (!transfer) {
    return res.status(404).json({
      error: 'not_found',
      message: 'Transfer not found',
    });
  }

  res.json(transfer);
}));

/**
 * POST /api/v1/transfers
 * Create new transfer
 */
router.post('/', asyncHandler(async (req, res) => {
  const { 
    date, 
    transferType, 
    fromAccountId, 
    toAccountId, 
    amount, 
    fee,
    hasFee,
    atmPayeeId,
    notes,
  } = req.body;

  // Validation
  if (!date || !transferType || !fromAccountId || !toAccountId || !amount) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'Missing required fields: date, transferType, fromAccountId, toAccountId, amount',
    });
  }

  // Validate transfer type
  if (!['withdraw', 'transfer', 'deposit'].includes(transferType)) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'transferType must be: withdraw, transfer, or deposit',
    });
  }

  // Validate accounts are different
  if (fromAccountId === toAccountId) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'Source and destination accounts must be different',
    });
  }

  // Validate ATM/Payee for withdraw/deposit
  if ((transferType === 'withdraw' || transferType === 'deposit') && !atmPayeeId) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'atmPayeeId is required for withdraw and deposit transactions',
    });
  }

  // Validate amount object
  if (typeof amount !== 'object' || !amount.amount || !amount.currency) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'amount must be an object with amount and currency',
      details: {
        expected: { amount: 'string', currency: 'string' },
      },
    });
  }

  // Validate fee if present
  if (hasFee && fee) {
    if (typeof fee !== 'object' || !fee.amount || !fee.currency) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'fee must be an object with amount and currency',
        details: {
          expected: { amount: 'string', currency: 'string' },
        },
      });
    }
  }

  const transfer = await transferService.createTransfer({
    date,
    transferType,
    fromAccountId,
    toAccountId,
    amount,
    fee,
    hasFee: hasFee || false,
    atmPayeeId,
    notes,
  });

  res.status(201).json(transfer);
}));

module.exports = router;
