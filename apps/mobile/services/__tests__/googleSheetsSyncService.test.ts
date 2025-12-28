import {
  GoogleSheetsSyncService,
  googleSheetsSyncService,
  PendingSync,
  SyncDraft,
  SyncResult,
} from '../googleSheetsSyncService';
import * as apiClient from '../../api/generated';

// Mock the generated API client
jest.mock('../../api/generated');

const mockedPostDraft = apiClient.postApiV1GoogleSheetsSyncDraft as jest.MockedFunction<
  typeof apiClient.postApiV1GoogleSheetsSyncDraft
>;
const mockedPostApprove = apiClient.postApiV1GoogleSheetsSyncApproveDraftId as jest.MockedFunction<
  typeof apiClient.postApiV1GoogleSheetsSyncApproveDraftId
>;

describe('GoogleSheetsSyncService', () => {
  let service: GoogleSheetsSyncService;

  beforeEach(() => {
    service = new GoogleSheetsSyncService();
    jest.clearAllMocks();
  });

  describe('createDraft', () => {
    it('should fetch and map draft with pending changes', async () => {
      const mockApiResponse = {
        status: 200,
        data: {
          draftId: 'draft-123',
          createdAt: '2025-12-28T10:00:00.000Z',
          pendingChanges: [
            {
              accountId: 'account-1',
              accountName: 'Cash',
              cleared: {
                current: { amount: '1450.00', currency: 'PHP' },
                synced: { amount: '1234.00', currency: 'PHP' },
              },
            },
            {
              accountId: 'account-2',
              accountName: 'Credit Card',
              cleared: {
                current: { amount: '4850.00', currency: 'PHP' },
                synced: { amount: '5000.00', currency: 'PHP' },
              },
              uncleared: {
                current: { amount: '300.00', currency: 'PHP' },
                synced: { amount: '150.00', currency: 'PHP' },
              },
            },
          ],
          summary: {
            totalAccounts: 2,
            totalChanges: 3,
          },
        },
        headers: {} as Headers,
      };

      mockedPostDraft.mockResolvedValueOnce(mockApiResponse as any);

      const result = await service.createDraft();

      expect(mockedPostDraft).toHaveBeenCalledTimes(1);
      expect(result).toEqual<SyncDraft>({
        draftId: 'draft-123',
        createdAt: '2025-12-28T10:00:00.000Z',
        pendingSyncs: [
          {
            accountId: 'account-1',
            accountName: 'Cash',
            lastSyncedAt: null, // API doesn't provide this
            cleared: {
              current: { amount: '1450.00', currency: 'PHP' },
              synced: { amount: '1234.00', currency: 'PHP' },
            },
          },
          {
            accountId: 'account-2',
            accountName: 'Credit Card',
            lastSyncedAt: null, // API doesn't provide this
            cleared: {
              current: { amount: '4850.00', currency: 'PHP' },
              synced: { amount: '5000.00', currency: 'PHP' },
            },
            uncleared: {
              current: { amount: '300.00', currency: 'PHP' },
              synced: { amount: '150.00', currency: 'PHP' },
            },
          },
        ],
        summary: {
          totalAccounts: 2,
          totalChanges: 3,
        },
      });
    });

    it('should handle empty pending changes', async () => {
      const mockApiResponse = {
        status: 200,
        data: {
          draftId: 'draft-456',
          createdAt: '2025-12-28T11:00:00.000Z',
          pendingChanges: [],
        },
        headers: {} as Headers,
      };

      mockedPostDraft.mockResolvedValueOnce(mockApiResponse as any);

      const result = await service.createDraft();

      expect(result.pendingSyncs).toEqual([]);
      expect(result.draftId).toBe('draft-456');
    });

    it('should propagate errors from API client', async () => {
      const mockError = new Error('Network error');
      mockedPostDraft.mockRejectedValueOnce(mockError);

      await expect(service.createDraft()).rejects.toThrow('Network error');
    });
  });

  describe('executeSync', () => {
    it('should approve draft and map sync result', async () => {
      const mockApiResponse = {
        status: 200,
        data: {
          success: true,
          syncedAt: '2025-12-28T12:00:00.000Z',
          accountsSynced: 3,
          spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/abc123',
        },
        headers: {} as Headers,
      };

      mockedPostApprove.mockResolvedValueOnce(mockApiResponse as any);

      const result = await service.executeSync('draft-789');

      expect(mockedPostApprove).toHaveBeenCalledWith('draft-789');
      expect(result).toEqual<SyncResult>({
        success: true,
        syncedAt: '2025-12-28T12:00:00.000Z',
        accountsSynced: 3,
        spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/abc123',
      });
    });

    it('should handle sync failures', async () => {
      const mockApiResponse = {
        status: 200,
        data: {
          success: false,
          syncedAt: '2025-12-28T12:00:00.000Z',
          accountsSynced: 0,
        },
        headers: {} as Headers,
      };

      mockedPostApprove.mockResolvedValueOnce(mockApiResponse as any);

      const result = await service.executeSync('draft-invalid');

      expect(result.success).toBe(false);
      expect(result.accountsSynced).toBe(0);
    });

    it('should propagate API errors', async () => {
      const mockError = new Error('Draft not found');
      mockedPostApprove.mockRejectedValueOnce(mockError);

      await expect(service.executeSync('draft-nonexistent')).rejects.toThrow('Draft not found');
    });
  });

  describe('refresh', () => {
    it('should call createDraft', async () => {
      const mockDraft: SyncDraft = {
        draftId: 'draft-999',
        createdAt: '2025-12-28T13:00:00.000Z',
        pendingSyncs: [],
      };

      jest.spyOn(service, 'createDraft').mockResolvedValueOnce(mockDraft);

      const result = await service.refresh();

      expect(service.createDraft).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockDraft);
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(googleSheetsSyncService).toBeInstanceOf(GoogleSheetsSyncService);
    });
  });
});
