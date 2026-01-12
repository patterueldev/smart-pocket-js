import {
  Transaction,
  TransactionDraft,
  Payee,
  Account,
} from '@smart-pocket/shared-types';

/**
 * Transaction Service Interface
 * 
 * Handles transaction CRUD operations, payee/account management
 */
export interface ITransactionService {
  /**
   * Get list of recent transactions
   * 
   * @param limit - Number of transactions to fetch
   * @returns Array of transactions
   */
  getRecentTransactions(limit?: number): Promise<Transaction[]>;
  
  /**
   * Get transaction by ID
   * 
   * @param id - Transaction ID
   * @returns Transaction or null if not found
   */
  getTransaction(id: string): Promise<Transaction | null>;
  
  /**
   * Create new transaction
   * 
   * @param draft - Transaction draft data
   * @returns Created transaction
   */
  createTransaction(draft: TransactionDraft): Promise<Transaction>;
  
  /**
   * Get all payees (merchants)
   * 
   * @param search - Optional search term
   * @returns Array of payees
   */
  getPayees(search?: string): Promise<Payee[]>;
  
  /**
   * Get all accounts
   * 
   * @returns Array of accounts
   */
  getAccounts(): Promise<Account[]>;
  
  /**
   * Create new payee
   * 
   * @param name - Payee name
   * @returns Created payee
   */
  createPayee(name: string): Promise<Payee>;
}
