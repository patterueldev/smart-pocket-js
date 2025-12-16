const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const API_KEY = process.env.API_KEY || 'dev_api_key_change_me';

/**
 * Middleware to authenticate requests with bearer token
 */
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Missing or invalid authorization header',
        details: {
          expected: 'Authorization: Bearer <token>'
        }
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'token_expired',
          message: 'Session token has expired',
          details: {
            hint: 'Please reconnect using /api/v1/connect'
          }
        });
      }
      
      return res.status(401).json({
        error: 'invalid_token',
        message: 'Invalid session token'
      });
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    next(error);
  }
}

/**
 * Verify API key for initial connection
 */
function verifyApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'missing_api_key',
      message: 'API key required',
      details: {
        expected: 'X-API-Key header'
      }
    });
  }
  
  if (apiKey !== API_KEY) {
    return res.status(401).json({
      error: 'invalid_api_key',
      message: 'Invalid API key'
    });
  }
  
  next();
}

/**
 * Generate bearer token
 */
function generateToken(payload) {
  const expiresIn = 30 * 24 * 60 * 60; // 30 days in seconds
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn,
    issuer: 'smart-pocket-server',
  });
}

module.exports = {
  authenticate,
  verifyApiKey,
  generateToken,
};
