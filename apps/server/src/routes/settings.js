const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const transferSettingsService = require('../services/transfer-settings.service');

/**
 * GET /api/v1/settings/transfer
 * Get transfer settings
 */
router.get('/transfer', asyncHandler(async (req, res) => {
  const settings = await transferSettingsService.getTransferSettings();

  res.json({
    transferSettings: settings,
  });
}));

/**
 * PUT /api/v1/settings/transfer
 * Update transfer settings
 */
router.put('/transfer', asyncHandler(async (req, res) => {
  const { enabledAccountIds, bankAtmPayeeIds } = req.body;

  if (!enabledAccountIds || !Array.isArray(enabledAccountIds)) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'enabledAccountIds must be an array of strings',
    });
  }

  if (!bankAtmPayeeIds || !Array.isArray(bankAtmPayeeIds)) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'bankAtmPayeeIds must be an array of strings',
    });
  }

  const settings = {
    enabledAccountIds,
    bankAtmPayeeIds,
  };

  const updatedSettings = await transferSettingsService.updateTransferSettings(settings);

  res.json({
    transferSettings: updatedSettings,
  });
}));

module.exports = router;
