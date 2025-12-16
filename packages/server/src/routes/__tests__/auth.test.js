const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Import middleware first
const { verifyApiKey } = require('../../middleware/auth');

describe('Auth Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mount routes with proper middleware
    app.post('/api/v1/connect', verifyApiKey, (req, res) => {
      const { deviceInfo } = req.body;
      
      if (!deviceInfo || !deviceInfo.deviceId) {
        return res.status(400).json({
          error: 'validation_error',
          message: 'Device info required',
        });
      }
      
      const token = jwt.sign(
        { 
          device: deviceInfo.deviceId,
          platform: deviceInfo.platform,
        },
        process.env.JWT_SECRET,
        { expiresIn: '30d', issuer: 'smart-pocket-server' }
      );
      
      res.json({
        token,
        expiresIn: 2592000,
        serverInfo: {
          version: '0.1.0',
          features: {
            googleSheetsSync: false,
            aiInsights: true,
          },
          currency: 'USD',
        },
      });
    });
    
    const { authenticate } = require('../../middleware/auth');
    app.post('/api/v1/disconnect', authenticate, (req, res) => {
      res.json({
        success: true,
        message: 'Session invalidated',
      });
    });
  });

  describe('POST /api/v1/connect', () => {
    it('should return token with valid API key', async () => {
      const response = await request(app)
        .post('/api/v1/connect')
        .set('X-API-Key', 'test-api-key')
        .send({
          deviceInfo: {
            platform: 'iOS',
            appVersion: '1.0.0',
            deviceId: 'test-device',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('expiresIn');
      expect(response.body).toHaveProperty('serverInfo');
      expect(response.body.serverInfo.version).toBe('0.1.0');

      // Verify token is valid
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
      expect(decoded.device).toBe('test-device');
      expect(decoded.platform).toBe('iOS');
    });

    it('should return 401 with invalid API key', async () => {
      const response = await request(app)
        .post('/api/v1/connect')
        .set('X-API-Key', 'wrong-key')
        .send({
          deviceInfo: {
            platform: 'iOS',
            appVersion: '1.0.0',
            deviceId: 'test-device',
          },
        });

      expect(response.status).toBe(401);
    });

    it('should return 400 with missing device info', async () => {
      const response = await request(app)
        .post('/api/v1/connect')
        .set('X-API-Key', 'test-api-key')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/disconnect', () => {
    it('should successfully disconnect', async () => {
      const token = jwt.sign(
        { device: 'test-device', platform: 'iOS' },
        process.env.JWT_SECRET
      );

      const response = await request(app)
        .post('/api/v1/disconnect')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: 'Session invalidated',
      });
    });

    it('should return 401 without token', async () => {
      const response = await request(app).post('/api/v1/disconnect');

      expect(response.status).toBe(401);
    });
  });
});
