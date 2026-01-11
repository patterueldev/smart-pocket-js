const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const API_KEY = process.env.API_KEY || 'dev_api_key_change_me';
// Configurable JWT expiry; supports seconds number or strings like '30d', '12h', '15m', '60s'
const JWT_EXPIRY = process.env.JWT_EXPIRY || '30d';

/**
 * Convert an expiresIn value to seconds for client response.
 * Accepts number (seconds) or string with suffix d/h/m/s.
 */
function getTokenExpirySeconds() {
  const val = JWT_EXPIRY;
  if (typeof val === 'number') {
    return val;
  }
  if (/^\d+$/.test(String(val))) {
    return parseInt(val, 10);
  }
  const str = String(val).trim();
  const match = str.match(/^(\d+)\s*([dhms])$/i);
  if (match) {
    const amount = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    switch (unit) {
      case 'd':
        return amount * 24 * 60 * 60;
      case 'h':
        return amount * 60 * 60;
      case 'm':
        return amount * 60;
      case 's':
        return amount;
      default:
        return 30 * 24 * 60 * 60;
    }
  }
  // Fallback default: 30 days
  return 30 * 24 * 60 * 60;
}

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
 * Generate bearer token using configured expiry (JWT_EXPIRY)
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
    issuer: 'smart-pocket-server',
  });
}

module.exports = {
  authenticate,
  verifyApiKey,
  generateToken,
  getTokenExpirySeconds,
};
