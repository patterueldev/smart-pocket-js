import {
  Transaction,
  TransactionDraft,
  Payee,
  Account,
} from '@smart-pocket/shared-types';
import { ITransactionService } from './ITransactionService';

/**
 * Mock implementation of Transaction Service
 * 
 * Returns hard-coded mock data for testing UI without API
 */
export class MockTransactionService implements ITransactionService {
  private mockPayees: Payee[] = [
    { id: 'payee-1', name: 'Walmart', transactionCount: 42 },
    { id: 'payee-2', name: 'Target', transactionCount: 28 },
    { id: 'payee-3', name: 'Costco', transactionCount: 15 },
    { id: 'payee-4', name: 'CVS Pharmacy', transactionCount: 12 },
    { id: 'payee-5', name: '7-Eleven', transactionCount: 8 },
  ];

  private mockAccounts: Account[] = [
    { id: 'account-1', name: 'Chase Checking', type: 'checking', actualBudgetId: 'actual-1' },
    { id: 'account-2', name: 'Amex Credit Card', type: 'credit', actualBudgetId: 'actual-2' },
    { id: 'account-3', name: 'Cash', type: 'cash', actualBudgetId: 'actual-3' },
  ];

  private mockTransactions: Transaction[] = [
    {
      id: 'txn-1',
      date: '2025-12-15',
      payeeId: 'payee-1',
      payeeName: 'Walmart',
      accountId: 'account-1',
      accountName: 'Chase Checking',
      total: { amount: '45.67', currency: 'USD' },
      items: [
        {
          id: 'item-1',
          codeName: 'WM-123456',
          readableName: 'Organic Bananas',
          price: { amount: '3.99', currency: 'USD' },
          quantity: 1.5,
        },
      ],
      createdAt: '2025-12-15T10:30:00Z',
      updatedAt: '2025-12-15T10:30:00Z',
    },
    {
      id: 'txn-2',
      date: '2025-12-14',
      payeeId: 'payee-2',
      payeeName: 'Target',
      accountId: 'account-2',
      accountName: 'Amex Credit Card',
      total: { amount: '23.12', currency: 'USD' },
      items: [],
      createdAt: '2025-12-14T14:20:00Z',
      updatedAt: '2025-12-14T14:20:00Z',
    },
  ];

  async getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
    await new Promise(resolve => setTimeout(resolve, 800));
    return this.mockTransactions.slice(0, limit);
  }

  async getTransaction(id: string): Promise<Transaction | null> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.mockTransactions.find(t => t.id === id) || null;
  }

  async createTransaction(draft: TransactionDraft): Promise<Transaction> {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const payee = this.mockPayees.find(p => p.id === draft.payeeId);
    const account = this.mockAccounts.find(a => a.id === draft.accountId);
    
    const total = draft.items.reduce((sum, item) => {
      const amount = parseFloat(item.price.amount) * item.quantity;
      return sum + amount;
    }, 0);
    
    const newTransaction: Transaction = {
      id: `txn-${Date.now()}`,
      date: draft.date,
      payeeId: draft.payeeId,
      payeeName: payee?.name || 'Unknown',
      accountId: draft.accountId,
      accountName: account?.name || 'Unknown',
      total: {
        amount: total.toFixed(2),
        currency: draft.items[0]?.price.currency || 'USD',
      },
      items: draft.items.map((item, index) => ({
        ...item,
        id: `item-${Date.now()}-${index}`,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    this.mockTransactions.unshift(newTransaction);
    return newTransaction;
  }

  async getPayees(search?: string): Promise<Payee[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!search) {
      return this.mockPayees;
    }
    
    const lowerSearch = search.toLowerCase();
    return this.mockPayees.filter(p =>
      p.name.toLowerCase().includes(lowerSearch)
    );
  }

  async getAccounts(): Promise<Account[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.mockAccounts;
  }

  async createPayee(name: string): Promise<Payee> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const newPayee: Payee = {
      id: `payee-${Date.now()}`,
      name,
      transactionCount: 0,
    };
    
    this.mockPayees.push(newPayee);
    return newPayee;
  }
}
