import { Price } from './Price';

export interface Transaction {
  id: string;
  date: string; // ISO 8601 date string
  payeeId: string;
  payeeName: string;
  accountId: string;
  accountName: string;
  total: Price;
  items: LineItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LineItem {
  id: string;
  codeName: string; // Store-specific product code
  readableName: string; // Product name as written on receipt
  price: Price;
  quantity: number;
  storeItemId?: string; // Optional: linked to store_items table
}

export interface TransactionDraft {
  date: string;
  payeeId: string;
  accountId: string;
  items: Omit<LineItem, 'id'>[];
  ocrMetadata?: {
    rawText: string;
    remarks?: string;
    confidence: number;
  };
}
