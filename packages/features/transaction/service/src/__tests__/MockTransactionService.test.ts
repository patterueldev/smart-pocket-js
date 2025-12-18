import { MockTransactionService } from '../MockTransactionService';
import { TransactionDraft } from '@smart-pocket/shared-types';

describe('MockTransactionService', () => {
  let service: MockTransactionService;

  beforeEach(() => {
    service = new MockTransactionService();
  });

  describe('getRecentTransactions', () => {
    it('returns transactions array', async () => {
      const result = await service.getRecentTransactions();
      expect(Array.isArray(result)).toBe(true);
    });

    it('respects limit parameter', async () => {
      const result = await service.getRecentTransactions(1);
      expect(result.length).toBeLessThanOrEqual(1);
    });

    it('returns transactions with proper structure', async () => {
      const result = await service.getRecentTransactions();
      if (result.length > 0) {
        const txn = result[0];
        expect(txn).toHaveProperty('id');
        expect(txn).toHaveProperty('date');
        expect(txn).toHaveProperty('payeeId');
        expect(txn).toHaveProperty('accountId');
        expect(txn).toHaveProperty('total');
      }
    });

    it('simulates API delay', async () => {
      const startTime = Date.now();
      await service.getRecentTransactions();
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(500);
    });
  });

  describe('getTransaction', () => {
    it('returns transaction when found', async () => {
      const transactions = await service.getRecentTransactions();
      if (transactions.length > 0) {
        const result = await service.getTransaction(transactions[0].id);
        expect(result).not.toBeNull();
        expect(result?.id).toBe(transactions[0].id);
      }
    });

    it('returns null when not found', async () => {
      const result = await service.getTransaction('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('createTransaction', () => {
    it('creates and returns transaction', async () => {
      const draft: TransactionDraft = {
        date: '2025-12-18',
        payeeId: 'payee-1',
        accountId: 'account-1',
        items: [
          {
            id: 'item-1',
            codeName: 'TEST-001',
            readableName: 'Test Item',
            price: { amount: '1.99', currency: 'USD' },
            quantity: 1,
          },
        ],
      };

      const result = await service.createTransaction(draft);

      expect(result).toHaveProperty('id');
      expect(result.date).toBe(draft.date);
      expect(result.payeeId).toBe(draft.payeeId);
      expect(result.accountId).toBe(draft.accountId);
    });

    it('calculates total from items', async () => {
      const draft: TransactionDraft = {
        date: '2025-12-18',
        payeeId: 'payee-1',
        accountId: 'account-1',
        items: [
          {
            id: 'item-1',
            codeName: 'TEST-001',
            readableName: 'Item 1',
            price: { amount: '1.99', currency: 'USD' },
            quantity: 2,
          },
          {
            id: 'item-2',
            codeName: 'TEST-002',
            readableName: 'Item 2',
            price: { amount: '3.00', currency: 'USD' },
            quantity: 1,
          },
        ],
      };

      const result = await service.createTransaction(draft);
      expect(result.total.amount).toBe('6.98');
    });

    it('adds transaction to list', async () => {
      const draft: TransactionDraft = {
        date: '2025-12-18',
        payeeId: 'payee-1',
        accountId: 'account-1',
        items: [
          {
            id: 'item-1',
            codeName: 'TEST-001',
            readableName: 'Test Item',
            price: { amount: '1.99', currency: 'USD' },
            quantity: 1,
          },
        ],
      };

      const beforeCount = (await service.getRecentTransactions()).length;
      await service.createTransaction(draft);
      const afterCount = (await service.getRecentTransactions()).length;

      expect(afterCount).toBe(beforeCount + 1);
    });
  });

  describe('getPayees', () => {
    it('returns payees array', async () => {
      const result = await service.getPayees();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('filters by search term', async () => {
      const result = await service.getPayees('Walmart');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].name.toLowerCase()).toContain('walmart');
    });

    it('returns empty array when no match', async () => {
      const result = await service.getPayees('NonExistentStore');
      expect(result.length).toBe(0);
    });

    it('returns payees with proper structure', async () => {
      const result = await service.getPayees();
      const payee = result[0];
      expect(payee).toHaveProperty('id');
      expect(payee).toHaveProperty('name');
      expect(payee).toHaveProperty('transactionCount');
    });
  });

  describe('getAccounts', () => {
    it('returns accounts array', async () => {
      const result = await service.getAccounts();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('returns accounts with proper structure', async () => {
      const result = await service.getAccounts();
      const account = result[0];
      expect(account).toHaveProperty('id');
      expect(account).toHaveProperty('name');
      expect(account).toHaveProperty('type');
      expect(account).toHaveProperty('actualBudgetId');
    });
  });
});
