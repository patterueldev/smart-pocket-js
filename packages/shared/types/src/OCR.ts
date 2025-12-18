import { Price } from './Price';

export interface OCRParseRequest {
  ocrText: string;
  remarks?: string;
}

export interface OCRParseResponse {
  merchant: string;
  date: string;
  total: Price;
  items: OCRItem[];
  confidence: number;
}

export interface OCRItem {
  codeName: string;
  readableName: string;
  price: Price;
  quantity: number;
}
