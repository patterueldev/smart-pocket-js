const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const googleSheetsService = require('../services/google-sheets.service');

// Check if Google Sheets feature is enabled
const googleSheetsEnabled = process.env.GOOGLE_SHEETS_ENABLED === 'true';

router.use((req, res, next) => {
  if (!googleSheetsEnabled) {
    return res.status(404).json({
      error: 'feature_disabled',
      message: 'Google Sheets sync feature is not enabled on this server',
    });
  }
  next();
});

/**
 * GET /api/v1/google-sheets/sync/draft
 * Get pending account balance changes
 */
router.get('/sync/draft', asyncHandler(async (req, res) => {
  const pendingSyncs = await googleSheetsService.getPendingSyncs();

  res.json(pendingSyncs);
}));

/**
 * POST /api/v1/google-sheets/sync
 * Execute Google Sheets sync
 */
router.post('/sync', asyncHandler(async (req, res) => {
  const result = await googleSheetsService.executeSyncres.json(result);
}));

module.exports = router;
