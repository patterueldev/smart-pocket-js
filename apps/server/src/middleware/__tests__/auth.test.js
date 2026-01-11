const jwt = require('jsonwebtoken');
const {
  authenticate,
  verifyApiKey,
  generateToken,
  getTokenExpirySeconds,
} = require('../auth');

// Mock environment variables
const originalEnv = process.env;

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };

    // Default test values
    process.env.JWT_SECRET = 'test-secret';
    process.env.API_KEY = 'test-api-key';
    process.env.JWT_EXPIRY = '30d';

    req = {
      headers: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getTokenExpirySeconds()', () => {
    it('should parse seconds format (number)', () => {
      process.env.JWT_EXPIRY = '3600';
      expect(getTokenExpirySeconds()).toBe(3600);
    });

    it('should parse seconds with "s" suffix', () => {
      process.env.JWT_EXPIRY = '30s';
      expect(getTokenExpirySeconds()).toBe(30);
    });

    it('should parse minutes with "m" suffix', () => {
      process.env.JWT_EXPIRY = '15m';
      expect(getTokenExpirySeconds()).toBe(15 * 60);
    });

    it('should parse hours with "h" suffix', () => {
      process.env.JWT_EXPIRY = '12h';
      expect(getTokenExpirySeconds()).toBe(12 * 60 * 60);
    });

    it('should parse days with "d" suffix', () => {
      process.env.JWT_EXPIRY = '30d';
      expect(getTokenExpirySeconds()).toBe(30 * 24 * 60 * 60);
    });

    it('should handle numeric values', () => {
      process.env.JWT_EXPIRY = 7200;
      expect(getTokenExpirySeconds()).toBe(7200);
    });

    it('should handle whitespace in format', () => {
      process.env.JWT_EXPIRY = '  30d  ';
      expect(getTokenExpirySeconds()).toBe(30 * 24 * 60 * 60);
    });

    it('should be case-insensitive', () => {
      process.env.JWT_EXPIRY = '30D';
      expect(getTokenExpirySeconds()).toBe(30 * 24 * 60 * 60);
    });

    it('should default to 30 days for invalid format', () => {
      process.env.JWT_EXPIRY = 'invalid';
      expect(getTokenExpirySeconds()).toBe(30 * 24 * 60 * 60);
    });

    it('should default to 30 days if JWT_EXPIRY not set', () => {
      delete process.env.JWT_EXPIRY;
      expect(getTokenExpirySeconds()).toBe(30 * 24 * 60 * 60);
    });
  });

  describe('generateToken()', () => {
    it('should generate valid JWT with configured expiry', () => {
      process.env.JWT_EXPIRY = '1h';
      const payload = { userId: 'test-user' };

      const token = generateToken(payload);

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe('test-user');
      expect(decoded.iss).toBe('smart-pocket-server');
      expect(decoded.exp).toBeDefined();
    });

    it('should use JWT_EXPIRY environment variable', () => {
      process.env.JWT_EXPIRY = '30s';
      const payload = { userId: 'test-user' };

      const token = generateToken(payload);

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const now = Math.floor(Date.now() / 1000);
      const expectedExpiry = now + 30;

      // Allow 1 second tolerance
      expect(Math.abs(decoded.exp - expectedExpiry)).toBeLessThan(2);
    });

    it('should set issuer to smart-pocket-server', () => {
      const payload = { userId: 'test-user' };
      const token = generateToken(payload);

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.iss).toBe('smart-pocket-server');
    });
  });

  describe('authenticate()', () => {
    it('should pass valid token to next middleware', () => {
      const payload = { userId: 'test-user' };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });

      req.headers.authorization = `Bearer ${token}`;

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toMatchObject(payload);
    });

    it('should reject missing authorization header', () => {
      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'unauthorized',
        message: 'Missing or invalid authorization header',
        details: {
          expected: 'Authorization: Bearer <token>',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid bearer format', () => {
      req.headers.authorization = 'InvalidFormat token';

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'unauthorized',
        message: 'Missing or invalid authorization header',
        details: {
          expected: 'Authorization: Bearer <token>',
        },
      });
    });

    it('should reject expired token', () => {
      const payload = { userId: 'test-user' };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '-1h', // Already expired
      });

      req.headers.authorization = `Bearer ${token}`;

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'token_expired',
        message: 'Session token has expired',
        details: {
          hint: 'Please reconnect using /api/v1/connect',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid token', () => {
      req.headers.authorization = 'Bearer invalid-token';

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'invalid_token',
        message: 'Invalid session token',
      });
    });

    it('should reject token signed with wrong secret', () => {
      const payload = { userId: 'test-user' };
      const token = jwt.sign(payload, 'wrong-secret', { expiresIn: '1h' });

      req.headers.authorization = `Bearer ${token}`;

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'invalid_token',
        message: 'Invalid session token',
      });
    });
  });

  describe('verifyApiKey()', () => {
    it('should pass valid API key to next middleware', () => {
      req.headers['x-api-key'] = 'test-api-key';

      verifyApiKey(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should reject missing API key', () => {
      verifyApiKey(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'missing_api_key',
        message: 'API key required',
        details: {
          expected: 'X-API-Key header',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid API key', () => {
      req.headers['x-api-key'] = 'wrong-key';

      verifyApiKey(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'invalid_api_key',
        message: 'Invalid API key',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should be case-sensitive', () => {
      process.env.API_KEY = 'TestKey';
      req.headers['x-api-key'] = 'testkey';

      verifyApiKey(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Integration', () => {
    it('should work with connect -> authenticate flow', () => {
      // Step 1: Verify API key
      req.headers['x-api-key'] = 'test-api-key';
      verifyApiKey(req, res, next);
      expect(next).toHaveBeenCalledWith();

      // Step 2: Generate token
      const payload = { deviceId: 'test-device' };
      const token = generateToken(payload);

      // Step 3: Authenticate with token
      const authReq = { headers: { authorization: `Bearer ${token}` } };
      const authNext = jest.fn();

      authenticate(authReq, res, authNext);
      expect(authNext).toHaveBeenCalledWith();
      expect(authReq.user).toMatchObject(payload);
    });

    it('should enforce token expiry from JWT_EXPIRY', () => {
      // Generate token with very short expiry
      process.env.JWT_EXPIRY = '1s';
      const payload = { userId: 'test-user' };
      const token = generateToken(payload);

      // Wait for token to expire
      return new Promise((resolve) => {
        setTimeout(() => {
          req.headers.authorization = `Bearer ${token}`;
          authenticate(req, res, next);

          expect(res.status).toHaveBeenCalledWith(401);
          expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
              error: 'token_expired',
            })
          );
          resolve();
        }, 1100); // Wait 1.1 seconds
      });
    });
  });

      verifyApiKey(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authenticate', () => {
    it('should pass with valid token', () => {
      const token = jwt.sign({ device: 'test' }, process.env.JWT_SECRET);
      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };
      const res = {};
      const next = jest.fn();

      authenticate(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.device).toBe('test');
      expect(next).toHaveBeenCalledWith();
    });

    it('should return 401 with missing token', () => {
      const req = { headers: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 with invalid token', () => {
      const req = {
        headers: {
          authorization: 'Bearer invalid-token',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
