// Mock OpenAI BEFORE requiring the service
const mockCreate = jest.fn();
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
});

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Now require the service AFTER mocks are set up
const { parseOCRText } = require('../ocr.service');

describe('OCR Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock response
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              merchant: 'Test Store',
              date: '2025-12-15',
              total: '10.00',
              currency: 'USD',
              items: [],
              confidence: 0.9,
            }),
          },
        },
      ],
    });
  });

  describe('parseOCRText', () => {
    it('should parse receipt text successfully', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              merchant: 'WALMART',
              date: '2025-12-15',
              total: 6.48,
              currency: 'USD',
              items: [
                { codeName: 'MILK', readableName: 'MILK', price: 3.99, quantity: 1 },
                { codeName: 'BREAD', readableName: 'BREAD', price: 2.49, quantity: 1 },
              ],
            }),
          },
        }],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await parseOCRText('WALMART\nMILK 3.99\nBREAD 2.49');

      expect(result).toEqual({
        merchant: 'WALMART',
        date: '2025-12-15',
        total: {
          amount: '6.48',
          currency: 'USD',
        },
        items: [
          {
            codeName: 'MILK',
            readableName: 'MILK',
            price: { amount: '3.99', currency: 'USD' },
            quantity: 1,
          },
          {
            codeName: 'BREAD',
            readableName: 'BREAD',
            price: { amount: '2.49', currency: 'USD' },
            quantity: 1,
          },
        ],
        confidence: 0.85,
      });
    });

    it('should include remarks in the prompt', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              merchant: 'Store',
              date: '2025-12-15',
              total: 10.00,
              items: [],
            }),
          },
        }],
      };

      mockCreate.mockResolvedValue(mockResponse);

      await parseOCRText('Some text', 'Receipt is blurry');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('Receipt is blurry'),
            }),
          ]),
        })
      );
    });

    it('should use configured OpenAI model', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              merchant: 'Store',
              date: '2025-12-15',
              total: 10.00,
              items: [],
            }),
          },
        }],
      };

      mockCreate.mockResolvedValue(mockResponse);

      await parseOCRText('Some text');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: process.env.OPENAI_MODEL,
        })
      );
    });

    it('should handle OpenAI errors', async () => {
      mockCreate.mockRejectedValue(new Error('API Error'));

      await expect(parseOCRText('Some text')).rejects.toThrow('Failed to parse OCR text');
    });

    it('should provide default values for missing fields', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              // Missing merchant, date, total
              items: [],
            }),
          },
        }],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await parseOCRText('Incomplete receipt');

      expect(result.merchant).toBe('Unknown');
      expect(result.date).toMatch(/\d{4}-\d{2}-\d{2}/); // Should be today's date
      expect(result.total).toEqual({
        amount: '0.00',
        currency: 'USD',
      });
    });
  });
});
