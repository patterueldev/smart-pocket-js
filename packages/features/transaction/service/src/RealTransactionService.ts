import {
  Transaction,
  TransactionDraft,
  Payee,
  Account,
  Price,
  LineItem,
} from '@smart-pocket/shared-types';
import { ITransactionService } from './ITransactionService';
import {
  getApiV1Transactions,
  postApiV1Transactions,
  getApiV1Payees,
  postApiV1Payees,
  getApiV1Accounts,
  TransactionCreate,
  LineItemCreate,
} from '../../../../apps/mobile/api/generated';

/**
 * Real implementation of Transaction Service
 * 
 * Connects to Smart Pocket server API for transaction management
 */
export class RealTransactionService implements ITransactionService {
  /**
   * Get list of recent transactions
   */
  async getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
    try {
      const response = await getApiV1Transactions({
        limit,
        offset: 0,
      });

      // Map API response to Transaction type
      const transactions = response.data.transactions || [];
      return transactions.map(this.mapApiTransactionToModel);
    } catch (error) {
      console.error('[RealTransactionService] Failed to get recent transactions:', error);
      throw error;
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(id: string): Promise<Transaction | null> {
    try {
      // For now, fetch all and find by ID
      // TODO: Implement GET /api/v1/transactions/:id endpoint
      const response = await getApiV1Transactions({
        limit: 100,
        offset: 0,
      });

      const transactions = response.data.transactions || [];
      const found = transactions.find(t => t.id === id);
      
      return found ? this.mapApiTransactionToModel(found) : null;
    } catch (error) {
      console.error('[RealTransactionService] Failed to get transaction:', error);
      throw error;
    }
  }

  /**
   * Create new transaction
   */
  async createTransaction(draft: TransactionDraft): Promise<Transaction> {
    try {
      // Map draft to API request format
      const createRequest: TransactionCreate = {
        date: draft.date,
        payeeId: draft.payeeId,
        accountId: draft.accountId,
        items: draft.items.map(this.mapLineItemToApiFormat),
        ocrMetadata: draft.ocrMetadata,
      };

      const response = await postApiV1Transactions(createRequest);

      // Map API response to Transaction type
      return this.mapApiTransactionToModel(response.data);
    } catch (error) {
      console.error('[RealTransactionService] Failed to create transaction:', error);
      throw error;
    }
  }

  /**
   * Get all payees with optional search/fuzzy matching
   */
  async getPayees(search?: string): Promise<Payee[]> {
    try {
      const response = await getApiV1Payees(
        search ? { search } : undefined
      );

      const payees = response.data.payees || [];
      
      // Map API response to Payee type
      return payees.map(p => ({
        id: p.id || '',
        name: p.name || '',
        transactionCount: p.transactionCount || 0,
      }));
    } catch (error) {
      console.error('[RealTransactionService] Failed to get payees:', error);
      throw error;
    }
  }

  /**
   * Create new payee
   */
  async createPayee(name: string): Promise<Payee> {
    try {
      const response = await postApiV1Payees({ name });

      return {
        id: response.data.id || '',
        name: response.data.name || '',
        transactionCount: response.data.transactionCount || 0,
      };
    } catch (error) {
      console.error('[RealTransactionService] Failed to create payee:', error);
      throw error;
    }
  }

  /**
   * Get all accounts
   */
  async getAccounts(): Promise<Account[]> {
    try {
      const response = await getApiV1Accounts();

      const accounts = response.data.accounts || [];
      
      // Map API response to Account type
      return accounts.map(a => ({
        id: a.id || '',
        name: a.name || '',
        type: (a.type as Account['type']) || 'other',
        actualBudgetId: a.actualBudgetId || '',
      }));
    } catch (error) {
      console.error('[RealTransactionService] Failed to get accounts:', error);
      throw error;
    }
  }

  /**
   * Map API transaction to internal Transaction model
   */
  private mapApiTransactionToModel(apiTxn: any): Transaction {
    return {
      id: apiTxn.id || '',
      date: apiTxn.date || '',
      payeeId: apiTxn.payee?.id || '',
      payeeName: apiTxn.payee?.name || '',
      accountId: apiTxn.account?.id || '',
      accountName: apiTxn.account?.name || '',
      total: this.mapPriceFromApi(apiTxn.total, apiTxn.currency),
      items: (apiTxn.items || []).map((item: any) => this.mapLineItemFromApi(item)),
      notes: apiTxn.notes,
      createdAt: apiTxn.createdAt || new Date().toISOString(),
      updatedAt: apiTxn.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Map API line item to internal LineItem model
   */
  private mapLineItemFromApi(apiItem: any): LineItem {
    return {
      id: apiItem.id || '',
      codeName: apiItem.codeName || '',
      readableName: apiItem.readableName || '',
      price: this.mapPriceFromApi(apiItem.price, apiItem.currency),
      quantity: apiItem.quantity || 1,
      storeItemId: apiItem.storeItemId,
    };
  }

  /**
   * Map line item to API request format
   */
  private mapLineItemToApiFormat(item: Omit<LineItem, 'id'>): LineItemCreate {
    return {
      codeName: item.codeName,
      readableName: item.readableName,
      price: parseFloat(item.price.amount),
      quantity: item.quantity,
      currency: item.price.currency,
    };
  }

  /**
   * Map price from API format to internal Price object
   */
  private mapPriceFromApi(apiPrice: any, fallbackCurrency?: string): Price {
    // API may return price as number or Price object
    if (typeof apiPrice === 'number') {
      return {
        amount: apiPrice.toFixed(2),
        currency: fallbackCurrency || 'USD',
      };
    }
    
    return {
      amount: apiPrice?.amount?.toString() || '0.00',
      currency: apiPrice?.currency || fallbackCurrency || 'USD',
    };
  }
}
