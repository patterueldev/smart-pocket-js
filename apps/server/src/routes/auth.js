const express = require('express');
const router = express.Router();
const { verifyApiKey, authenticate, generateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * POST /api/v1/connect
 * Exchange API key for bearer token
 */
router.post('/connect', verifyApiKey, asyncHandler(async (req, res) => {
  const { deviceInfo } = req.body;
  
  console.log('[Connect API] Request received:', {
    hasDeviceInfo: !!deviceInfo,
    deviceInfo,
    headers: {
      'x-api-key': req.headers['x-api-key'] ? '***' : undefined,
      'content-type': req.headers['content-type'],
    },
    body: req.body,
  });
  
  if (!deviceInfo) {
    console.log('[Connect API] Validation failed: deviceInfo missing');
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

  const responseData = {
    token,
    expiresIn: 30 * 24 * 60 * 60, // 30 days in seconds
    serverInfo: {
      version: '0.1.0',
      features,
      currency: process.env.DEFAULT_CURRENCY || 'USD',
    }
  };

  console.log('[Connect API] Sending response:', {
    hasToken: !!responseData.token,
    tokenLength: responseData.token?.length,
    expiresIn: responseData.expiresIn,
    serverInfo: responseData.serverInfo,
  });

  res.json(responseData);
}));

/**
 * POST /api/v1/disconnect
 * Invalidate session (client-side token removal)
 */
router.post('/disconnect', authenticate, asyncHandler(async (req, res) => {
  // In a stateless JWT setup, we can't truly invalidate tokens
  // The client should remove the token on their end
  // For more security, implement a token blacklist in Redis/database
  
  res.json({
    success: true,
    message: 'Session invalidated'
  });
}));

module.exports = router;
