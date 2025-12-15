const express = require('express');
const router = express.Router();
const { verifyApiKey, generateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * POST /api/v1/connect
 * Exchange API key for bearer token
 */
router.post('/', verifyApiKey, asyncHandler(async (req, res) => {
  const { deviceInfo } = req.body;
  
  if (!deviceInfo) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'deviceInfo is required',
      details: {
        expected: {
          platform: 'string',
          appVersion: 'string',
          deviceId: 'string'
        }
      }
    });
  }

  // Generate bearer token
  const token = generateToken({
    device: deviceInfo.deviceId,
    platform: deviceInfo.platform,
  });

  // Get server features from environment
  const features = {
    googleSheetsSync: process.env.GOOGLE_SHEETS_ENABLED === 'true',
    aiInsights: process.env.AI_INSIGHTS_ENABLED !== 'false', // Default enabled
  };

  res.json({
    token,
    expiresIn: 30 * 24 * 60 * 60, // 30 days in seconds
    serverInfo: {
      version: '0.1.0',
      features,
      currency: process.env.DEFAULT_CURRENCY || 'USD',
    }
  });
}));

/**
 * POST /api/v1/disconnect
 * Invalidate session (client-side token removal)
 */
router.post('/disconnect', asyncHandler(async (req, res) => {
  // In a stateless JWT setup, we can't truly invalidate tokens
  // The client should remove the token on their end
  // For more security, implement a token blacklist in Redis/database
  
  res.json({
    success: true,
    message: 'Session invalidated'
  });
}));

module.exports = router;
