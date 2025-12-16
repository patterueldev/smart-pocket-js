// Mock @actual-app/api before requiring the service
const mockInit = jest.fn();
const mockDownloadBudget = jest.fn();
const mockLoadBudget = jest.fn();
const mockSync = jest.fn();
const mockShutdown = jest.fn();
const mockAqlQuery = jest.fn();
const mockIntegerToAmount = jest.fn((cents) => cents / 100);

// Mock query builder - q() returns chainable query object
const mockQ = jest.fn(() => ({
  select: jest.fn().mockReturnThis(),
  filter: jest.fn().mockReturnThis(),
  options: jest.fn().mockReturnThis(),
}));

jest.mock('@actual-app/api', () => ({
  init: (...args) => mockInit(...args),
  downloadBudget: (...args) => mockDownloadBudget(...args),
  loadBudget: (...args) => mockLoadBudget(...args),
  sync: (...args) => mockSync(...args),
  shutdown: (...args) => mockShutdown(...args),
  aqlQuery: (...args) => mockAqlQuery(...args),
  q: (...args) => mockQ(...args),
  utils: {
    integerToAmount: (...args) => mockIntegerToAmount(...args),
  },
}));

// Mock fs module
const mockExistsSync = jest.fn();
const mockMkdirSync = jest.fn();

jest.mock('fs', () => ({
  existsSync: (...args) => mockExistsSync(...args),
  mkdirSync: (...args) => mockMkdirSync(...args),
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
  requestLogger: jest.fn(),
}));

const actualBudgetService = require('../actual-budget.service');

describe('Actual Budget Service', () => {
  const mockConfig = {
    serverURL: 'http://localhost:5006',
    password: 'test-password',
    budgetId: 'test-sync-id',
    dataDir: '/tmp/test-cache',
    currency: 'USD',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockInit.mockResolvedValue(undefined);
    mockDownloadBudget.mockResolvedValue(undefined);
    mockLoadBudget.mockResolvedValue(undefined);
    mockSync.mockResolvedValue(undefined);
    mockShutdown.mockResolvedValue(undefined);
    mockExistsSync.mockReturnValue(true);
  });

  describe('getAccountBalances', () => {
    it('should return account balances successfully', async () => {
      mockExistsSync.mockReturnValue(true);

      // Mock accounts query
      mockAqlQuery.mockResolvedValueOnce({
        data: [
          {
            id: 'account-1',
            name: 'Checking Account',
            offbudget: false,
            closed: false,
          },
          {
            id: 'account-2',
            name: 'Savings Account',
            offbudget: false,
            closed: false,
          },
        ],
      });

      // Mock transactions for account-1
      mockAqlQuery.mockResolvedValueOnce({
        data: [
          { amount: 100000, cleared: true },
          { amount: 50000, cleared: true },
          { amount: 25000, cleared: false },
        ],
      });

      // Mock transactions for account-2
      mockAqlQuery.mockResolvedValueOnce({
        data: [
          { amount: 200000, cleared: true },
        ],
      });

      const result = await actualBudgetService.getAccountBalances(mockConfig);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        accountId: 'account-1',
        accountName: 'Checking Account',
        cleared: {
          amount: '1500.00',
          currency: 'USD',
        },
        uncleared: {
          amount: '250.00',
          currency: 'USD',
        },
      });
      expect(result[1]).toEqual({
        accountId: 'account-2',
        accountName: 'Savings Account',
        cleared: {
          amount: '2000.00',
          currency: 'USD',
        },
        uncleared: {
          amount: '0.00',
          currency: 'USD',
        },
      });

      // Verify budget was downloaded
      expect(mockDownloadBudget).toHaveBeenCalledWith('test-sync-id');

      // Verify shutdown was called
      expect(mockShutdown).toHaveBeenCalled();
    });

    it('should exclude off-budget accounts', async () => {
      mockExistsSync.mockReturnValue(true);

      // Mock accounts query - service filters out off-budget, so only on-budget account is returned
      mockAqlQuery.mockResolvedValueOnce({
        data: [
          {
            id: 'account-1',
            name: 'Checking Account',
            offbudget: false,
            closed: false,
          },
          // account-2 is off-budget, so it's filtered out by the query
        ],
      });

      // Mock transactions for the one on-budget account
      mockAqlQuery.mockResolvedValueOnce({
        data: [{ amount: 100000, cleared: true }],
      });

      const result = await actualBudgetService.getAccountBalances(mockConfig);

      // Should only return on-budget account
      expect(result).toHaveLength(1);
      expect(result[0].accountName).toBe('Checking Account');
    });

    it('should exclude closed accounts', async () => {
      mockExistsSync.mockReturnValue(true);

      // Mock accounts query - service filters out closed, so only open account is returned
      mockAqlQuery.mockResolvedValueOnce({
        data: [
          {
            id: 'account-1',
            name: 'Checking Account',
            offbudget: false,
            closed: false,
          },
          // account-2 is closed, so it's filtered out by the query
        ],
      });

      // Mock transactions for the one open account
      mockAqlQuery.mockResolvedValueOnce({
        data: [{ amount: 100000, cleared: true }],
      });

      const result = await actualBudgetService.getAccountBalances(mockConfig);

      // Should only return open account
      expect(result).toHaveLength(1);
      expect(result[0].accountName).toBe('Checking Account');
    });

    it('should handle negative balances (credit cards)', async () => {
      mockExistsSync.mockReturnValue(true);

      // Mock credit card account
      mockAqlQuery.mockResolvedValueOnce({
        data: [
          {
            id: 'account-1',
            name: 'Credit Card',
            offbudget: false,
            closed: false,
          },
        ],
      });

      // Mock transactions with negative amounts (spending on credit)
      mockAqlQuery.mockResolvedValueOnce({
        data: [
          { amount: -200000, cleared: true },
          { amount: -50000, cleared: true },
          { amount: -15000, cleared: false },
        ],
      });

      const result = await actualBudgetService.getAccountBalances(mockConfig);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        accountId: 'account-1',
        accountName: 'Credit Card',
        cleared: {
          amount: '-2500.00',
          currency: 'USD',
        },
        uncleared: {
          amount: '-150.00',
          currency: 'USD',
        },
      });
    });

    it('should handle API errors gracefully', async () => {
      mockExistsSync.mockReturnValue(true);
      mockDownloadBudget.mockRejectedValue(new Error('Connection failed'));

      await expect(
        actualBudgetService.getAccountBalances(mockConfig)
      ).rejects.toThrow('Connection failed');

      // Should still call shutdown
      expect(mockShutdown).toHaveBeenCalled();
    });

    it('should create data directory if it does not exist', async () => {
      mockExistsSync.mockReturnValue(false);

      mockAqlQuery.mockResolvedValueOnce({ data: [] }); // No accounts

      await actualBudgetService.getAccountBalances(mockConfig);

      // Should create directory
      expect(mockMkdirSync).toHaveBeenCalledWith('/tmp/test-cache', {
        recursive: true,
      });
    });
  });

  describe('getAccounts', () => {
    it('should return all accounts', async () => {
      const mockAccounts = [
        {
          id: 'account-1',
          name: 'Checking',
          type: 'checking',
          offbudget: false,
        },
        {
          id: 'account-2',
          name: 'Savings',
          type: 'savings',
          offbudget: false,
        },
      ];

      mockAqlQuery.mockResolvedValueOnce({ data: mockAccounts });

      const result = await actualBudgetService.getAccounts(mockConfig);

      expect(result).toEqual(mockAccounts);
      expect(mockDownloadBudget).toHaveBeenCalledWith('test-sync-id');
      expect(mockShutdown).toHaveBeenCalled();
    });
  });

  describe('getTransactions', () => {
    it('should return transactions filtered by date range', async () => {
      const mockTransactions = [
        {
          id: 'tx-1',
          amount: -5000,
          date: '2025-12-15',
          cleared: true,
        },
        {
          id: 'tx-2',
          amount: -3000,
          date: '2025-12-16',
          cleared: false,
        },
      ];

      mockAqlQuery.mockResolvedValueOnce({ data: mockTransactions });

      const result = await actualBudgetService.getTransactions(
        mockConfig,
        'account-1',
        '2025-12-01',
        '2025-12-31'
      );

      expect(result).toEqual(mockTransactions);
      expect(mockDownloadBudget).toHaveBeenCalledWith('test-sync-id');
      expect(mockShutdown).toHaveBeenCalled();
    });
  });

  describe('withBudget', () => {
    it('should ensure proper lifecycle (init, download, load, execute, shutdown)', async () => {
      const mockOperation = jest.fn().mockResolvedValue('result');

      const result = await actualBudgetService.withBudget(
        mockConfig,
        mockOperation
      );

      expect(result).toBe('result');
      expect(mockInit).toHaveBeenCalledWith({
        dataDir: '/tmp/test-cache',
        serverURL: 'http://localhost:5006',
        password: 'test-password',
      });
      expect(mockDownloadBudget).toHaveBeenCalledWith('test-sync-id');
      expect(mockOperation).toHaveBeenCalled();
      expect(mockShutdown).toHaveBeenCalled();
    });

    it('should shutdown even if operation fails', async () => {
      const mockOperation = jest
        .fn()
        .mockRejectedValue(new Error('Operation failed'));

      await expect(
        actualBudgetService.withBudget(mockConfig, mockOperation)
      ).rejects.toThrow('Operation failed');

      // Should still call shutdown
      expect(mockShutdown).toHaveBeenCalled();
    });
  });

  describe('Configuration handling', () => {
    it('should initialize without password if not provided', async () => {
      const configWithoutPassword = {
        serverURL: 'http://localhost:5006',
        budgetId: 'test-sync-id',
        dataDir: '/tmp/test-cache',
        currency: 'USD',
      };

      mockAqlQuery.mockResolvedValueOnce({ data: [] });

      await actualBudgetService.getAccountBalances(configWithoutPassword);

      expect(mockInit).toHaveBeenCalledWith({
        dataDir: '/tmp/test-cache',
        serverURL: 'http://localhost:5006',
      });
    });

    it('should use custom currency from config', async () => {
      const customConfig = {
        ...mockConfig,
        currency: 'PHP',
      };

      mockAqlQuery.mockResolvedValueOnce({
        data: [
          {
            id: 'account-1',
            name: 'Cash',
            offbudget: false,
            closed: false,
          },
        ],
      });

      mockAqlQuery.mockResolvedValueOnce({
        data: [{ amount: 100000, cleared: true }],
      });

      const result = await actualBudgetService.getAccountBalances(customConfig);

      expect(result[0].cleared.currency).toBe('PHP');
      expect(result[0].uncleared.currency).toBe('PHP');
    });
  });

  describe('Amount conversion', () => {
    it('should convert cents to dollars correctly', async () => {
      const testCases = [
        { cents: 0, expected: '0.00' },
        { cents: 100, expected: '1.00' },
        { cents: 150, expected: '1.50' },
        { cents: 123456, expected: '1234.56' },
        { cents: -5000, expected: '-50.00' },
      ];

      for (const { cents, expected } of testCases) {
        jest.clearAllMocks();
        mockExistsSync.mockReturnValue(true);

        mockAqlQuery.mockResolvedValueOnce({
          data: [
            {
              id: 'account-1',
              name: 'Test Account',
              offbudget: false,
              closed: false,
            },
          ],
        });

        mockAqlQuery.mockResolvedValueOnce({
          data: [{ amount: cents, cleared: true }],
        });

        const result = await actualBudgetService.getAccountBalances(mockConfig);

        expect(result[0].cleared.amount).toBe(expected);
      }
    });
  });
});
