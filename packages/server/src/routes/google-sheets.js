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
 * POST /api/v1/google-sheets/sync/draft
 * Create sync draft with pending account balance changes
 */
router.post('/sync/draft', asyncHandler(async (req, res) => {
  const actualBudgetConfig = {
    serverURL: process.env.ACTUAL_BUDGET_URL,
    password: process.env.ACTUAL_BUDGET_PASSWORD,
    budgetId: process.env.ACTUAL_BUDGET_SYNC_ID,
    currency: process.env.DEFAULT_CURRENCY || 'USD',
  };

  const draft = await googleSheetsService.getPendingSyncs(actualBudgetConfig);

  res.json({
    draftId: draft.id,
    createdAt: draft.createdAt,
    pendingChanges: draft.pendingChanges,
    summary: draft.summary,
  });
}));

/**
 * POST /api/v1/google-sheets/sync/approve/:draftId
 * Execute Google Sheets sync using saved draft
 */
router.post('/sync/approve/:draftId', asyncHandler(async (req, res) => {
  const { draftId } = req.params;
  
  if (!draftId) {
    return res.status(400).json({
      error: 'missing_draft_id',
      message: 'Draft ID is required',
    });
  }

  try {
    const result = await googleSheetsService.executeSync(draftId);
    res.json(result);
  } catch (error) {
    if (error.code === 'DRAFT_NOT_FOUND') {
      return res.status(404).json({
        error: 'draft_not_found',
        message: 'Draft has expired or does not exist',
        code: 'DRAFT_NOT_FOUND',
      });
    }
    throw error;
  }
}));

module.exports = router;
