const request = require('supertest');
const express = require('express');
const healthRouter = require('../health');

// Mock the database pool
jest.mock('../../config/database', () => ({
  pool: {
    query: jest.fn().mockResolvedValue({ rows: [{ result: 1 }] }),
  },
}));

describe('Health Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use('/health', healthRouter);
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'ok',
        database: 'connected',
      });
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return 503 when database is down', async () => {
      const { pool } = require('../../config/database');
      pool.query.mockRejectedValueOnce(new Error('Connection failed'));

      const response = await request(app).get('/health');

      expect(response.status).toBe(503);
      expect(response.body).toMatchObject({
        status: 'error',
        database: 'disconnected',
      });
    });
  });
});
