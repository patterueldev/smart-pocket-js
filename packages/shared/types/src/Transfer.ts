import { Price } from './Price';

/**
 * Transfer type enum
 * - withdraw: Bank → Cash
 * - transfer: Bank ↔ Bank/eWallet
 * - deposit: Cash → Bank/eWallet
 */
export type TransferType = 'withdraw' | 'transfer' | 'deposit';

/**
 * Transfer draft for creating new transfers
 */
export interface TransferDraft {
  date: string; // ISO date string
  transferType: TransferType;
  fromAccountId: string;
  toAccountId: string;
  amount: Price;
  fee?: Price;
  hasFee: boolean; // Checkbox state in UI
  atmPayeeId?: string; // Required for withdraw/deposit, optional for transfer
  notes?: string;
}

/**
 * Complete transfer record
 */
export interface Transfer {
  id: string;
  date: string;
  transferType: TransferType;
  fromAccountId: string;
  fromAccountName: string;
  toAccountId: string;
  toAccountName: string;
  amount: Price;
  fee?: Price;
  atmPayeeId?: string;
  atmPayeeName?: string;
  actualBudgetId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
