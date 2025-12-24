const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const accountService = require('../services/account.service');

/**
 * GET /api/v1/accounts
 * List all accounts (synced from Actual Budget)
 */
router.get('/', asyncHandler(async (req, res) => {
  const accounts = await accountService.getAccounts();

  res.json({ accounts });
}));

module.exports = router;
