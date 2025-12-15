const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const payeeService = require('../services/payee.service');

/**
 * GET /api/v1/payees
 * List all payees (with optional search)
 */
router.get('/', asyncHandler(async (req, res) => {
  const { search } = req.query;
  
  const payees = await payeeService.getPayees(search);

  res.json({ payees });
}));

/**
 * POST /api/v1/payees
 * Create new payee
 */
router.post('/', asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({
      error: 'validation_error',
      message: 'name is required and must be a string',
    });
  }

  const payee = await payeeService.createPayee(name);

  res.status(201).json(payee);
}));

module.exports = router;
