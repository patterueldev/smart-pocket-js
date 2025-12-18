import { OCRParseRequest, OCRParseResponse } from '@smart-pocket/shared-types';

/**
 * Receipt Scan Service Interface
 * 
 * Handles OCR text parsing and receipt data extraction
 */
export interface IReceiptScanService {
  /**
   * Parse OCR-extracted text into structured transaction data
   * 
   * @param request - OCR text and optional remarks
   * @returns Parsed receipt data with merchant, items, total
   */
  parseReceipt(request: OCRParseRequest): Promise<OCRParseResponse>;
  
  /**
   * Validate OCR text quality (optional pre-parse check)
   * 
   * @param ocrText - Raw OCR text
   * @returns Confidence score (0-1)
   */
  validateOCRQuality(ocrText: string): Promise<number>;
}
