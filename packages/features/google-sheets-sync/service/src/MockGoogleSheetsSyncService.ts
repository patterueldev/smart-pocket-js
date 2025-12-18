import { IGoogleSheetsSyncService, SyncDraft, SyncResult } from './IGoogleSheetsSyncService';

export class MockGoogleSheetsSyncService implements IGoogleSheetsSyncService {
  async createDraft(): Promise<SyncDraft> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      draftId: 'mock-draft-' + Date.now(),
      createdAt: new Date().toISOString(),
      lastSyncedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      pendingSyncs: [
        {
          accountId: 'account-1',
          accountName: 'Cash',
          lastSyncedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          cleared: {
            current: { amount: '1450.00', currency: 'PHP' },
            synced: { amount: '1234.00', currency: 'PHP' },
          },
        },
        {
          accountId: 'account-2',
          accountName: 'Credit Card',
          lastSyncedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          cleared: {
            current: { amount: '4850.00', currency: 'PHP' },
            synced: { amount: '5000.00', currency: 'PHP' },
          },
          uncleared: {
            current: { amount: '300.00', currency: 'PHP' },
            synced: { amount: '150.00', currency: 'PHP' },
          },
        },
        {
          accountId: 'account-3',
          accountName: 'Online Wallet',
          lastSyncedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
          uncleared: {
            current: { amount: '50.00', currency: 'PHP' },
            synced: { amount: '0.00', currency: 'PHP' },
          },
        },
      ],
    };
  }

  async executeSync(draftId: string): Promise<SyncResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Mock sync executed for draft:', draftId);

    return {
      success: true,
      syncedAt: new Date().toISOString(),
      accountsSynced: 3,
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/mock-sheet-id',
    };
  }
}
