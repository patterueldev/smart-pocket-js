const jwt = require('jsonwebtoken');
const { authenticate, verifyApiKey } = require('../auth');

describe('Auth Middleware', () => {
  describe('verifyApiKey', () => {
    it('should pass with correct API key', () => {
      const req = {
        headers: {
          'x-api-key': 'test-api-key',
        },
      };
      const res = {};
      const next = jest.fn();

      verifyApiKey(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should return 401 with missing API key', () => {
      const req = { headers: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      verifyApiKey(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'missing_api_key',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 with incorrect API key', () => {
      const req = {
        headers: {
          'x-api-key': 'wrong-key',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

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

    it('should return 401 with expired token', () => {
      const token = jwt.sign(
        { device: 'test' },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' } // Already expired
      );
      const req = {
        headers: {
          authorization: `Bearer ${token}`,
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
