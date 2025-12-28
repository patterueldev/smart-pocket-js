import { MockReceiptScanService } from '../MockReceiptScanService';
import { OCRParseRequest } from '@smart-pocket/shared-types';

describe('MockReceiptScanService', () => {
  let service: MockReceiptScanService;

  beforeEach(() => {
    service = new MockReceiptScanService();
  });

  describe('parseReceipt', () => {
    it('returns parsed receipt data', async () => {
      const request: OCRParseRequest = {
        ocrText: 'WALMART\nDATE: 12/15/2025\nITEM1 3.99',
        remarks: 'Test receipt',
      };

      const result = await service.parseReceipt(request);

      expect(result).toHaveProperty('merchant');
      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('confidence');
    });

    it('returns merchant name', async () => {
      const request: OCRParseRequest = {
        ocrText: 'WALMART',
        remarks: '',
      };

      const result = await service.parseReceipt(request);
      expect(result.merchant).toBe('Walmart');
    });

    it('returns items array', async () => {
      const request: OCRParseRequest = {
        ocrText: 'WALMART',
        remarks: '',
      };

      const result = await service.parseReceipt(request);
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('returns proper item structure', async () => {
      const request: OCRParseRequest = {
        ocrText: 'WALMART',
        remarks: '',
      };

      const result = await service.parseReceipt(request);
      const item = result.items[0];

      expect(item).toHaveProperty('codeName');
      expect(item).toHaveProperty('readableName');
      expect(item).toHaveProperty('price');
      expect(item).toHaveProperty('quantity');
      expect(item.price).toHaveProperty('amount');
      expect(item.price).toHaveProperty('currency');
    });

    it('returns confidence score between 0 and 1', async () => {
      const request: OCRParseRequest = {
        ocrText: 'WALMART',
        remarks: '',
      };

      const result = await service.parseReceipt(request);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('simulates API delay', async () => {
      const request: OCRParseRequest = {
        ocrText: 'WALMART',
        remarks: '',
      };

      const startTime = Date.now();
      await service.parseReceipt(request);
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(1000);
    });
  });

  describe('validateOCRQuality', () => {
    it('returns quality score', async () => {
      const result = await service.validateOCRQuality('WALMART');
      expect(typeof result).toBe('number');
    });

    it('returns score between 0 and 1', async () => {
      const result = await service.validateOCRQuality('WALMART');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('simulates API delay', async () => {
      const startTime = Date.now();
      await service.validateOCRQuality('WALMART');
      const endTime = Date.now();

      // Allow a small scheduling jitter in CI environments
      expect(endTime - startTime).toBeGreaterThanOrEqual(480);
    });
  });
});
