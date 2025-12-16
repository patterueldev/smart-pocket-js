const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Mock the OCR service
jest.mock('../../services/ocr.service');
const ocrService = require('../../services/ocr.service');

// Import middleware
const { authenticate } = require('../../middleware/auth');

describe('OCR Routes', () => {
  let app;
  let token;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Generate valid token
    token = jwt.sign(
      { device: 'test-device', platform: 'test' },
      process.env.JWT_SECRET
    );

    jest.clearAllMocks();
    
    // Mount OCR routes
    app.post('/api/v1/ocr/parse', authenticate, async (req, res) => {
      try {
        const { ocrText, remarks } = req.body;
        
        if (!ocrText) {
          return res.status(400).json({
            error: 'validation_error',
            message: 'ocrText is required',
          });
        }
        
        const result = await ocrService.parseOCRText(ocrText, remarks);
        res.json(result);
      } catch (error) {
        res.status(500).json({
          error: 'internal_server_error',
          message: error.message,
        });
      }
    });
  });

  describe('POST /api/v1/ocr/parse', () => {
    it('should parse OCR text successfully', async () => {
      const mockResult = {
        merchant: 'WALMART',
        date: '2025-12-15',
        total: { amount: '6.48', currency: 'USD' },
        items: [
          {
            codeName: 'MILK',
            readableName: 'MILK',
            price: { amount: '3.99', currency: 'USD' },
            quantity: 1,
          },
        ],
        confidence: 0.85,
      };

      ocrService.parseOCRText.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/v1/ocr/parse')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ocrText: 'WALMART\nMILK 3.99',
          remarks: 'Test receipt',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
      expect(ocrService.parseOCRText).toHaveBeenCalledWith(
        'WALMART\nMILK 3.99',
        'Test receipt'
      );
    });

    it('should return 400 with missing ocrText', async () => {
      const response = await request(app)
        .post('/api/v1/ocr/parse')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'validation_error',
      });
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/v1/ocr/parse')
        .send({ ocrText: 'Some text' });

      expect(response.status).toBe(401);
    });

    it('should handle service errors', async () => {
      ocrService.parseOCRText.mockRejectedValue(new Error('OpenAI error'));

      const response = await request(app)
        .post('/api/v1/ocr/parse')
        .set('Authorization', `Bearer ${token}`)
        .send({ ocrText: 'Some text' });

      expect(response.status).toBe(500);
    });
  });
});
