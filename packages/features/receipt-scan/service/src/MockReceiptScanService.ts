import { OCRParseRequest, OCRParseResponse } from '@smart-pocket/shared-types';
import { IReceiptScanService } from './IReceiptScanService';

/**
 * Mock implementation of Receipt Scan Service
 * 
 * Returns hard-coded mock data for testing UI without API
 */
export class MockReceiptScanService implements IReceiptScanService {
  async parseReceipt(request: OCRParseRequest): Promise<OCRParseResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Return mock parsed receipt data
    return {
      merchant: 'Walmart',
      date: new Date().toISOString().split('T')[0], // Today's date
      total: {
        amount: '45.67',
        currency: 'USD',
      },
      items: [
        {
          codeName: 'WM-123456',
          readableName: 'Organic Bananas',
          price: {
            amount: '3.99',
            currency: 'USD',
          },
          quantity: 1.5,
        },
        {
          codeName: 'WM-789012',
          readableName: 'Whole Milk 1gal',
          price: {
            amount: '4.29',
            currency: 'USD',
          },
          quantity: 1,
        },
        {
          codeName: 'WM-555333',
          readableName: 'Bread Whole Wheat',
          price: {
            amount: '2.99',
            currency: 'USD',
          },
          quantity: 2,
        },
      ],
      confidence: 0.88,
    };
  }
  
  async validateOCRQuality(ocrText: string): Promise<number> {
    // Simple mock validation based on text length
    if (!ocrText || ocrText.length < 20) {
      return 0.3;
    }
    
    if (ocrText.length < 50) {
      return 0.6;
    }
    
    return 0.85;
  }
}
