import { SyncDraft, SyncResult, SyncItem } from '@smart-pocket/shared-types';
import { IGoogleSheetsService } from './IGoogleSheetsService';

/**
 * Mock implementation of Google Sheets Service
 * 
 * Returns hard-coded mock sync data for testing UI without API
 */
export class MockGoogleSheetsService implements IGoogleSheetsService {
  private mockSyncItems: SyncItem[] = [
    {
      accountId: 'account-3',
      accountName: 'Cash',
      lastSyncedAt: '2025-12-15T08:30:00Z',
      cleared: {
        current: { amount: '1450.00', currency: 'PHP' },
        synced: { amount: '1234.00', currency: 'PHP' },
      },
      uncleared: null,
    },
    {
      accountId: 'account-2',
      accountName: 'Amex Credit Card',
      lastSyncedAt: '2025-12-14T10:30:00Z',
      cleared: {
        current: { amount: '4850.00', currency: 'USD' },
        synced: { amount: '5000.00', currency: 'USD' },
      },
      uncleared: {
        current: { amount: '300.00', currency: 'USD' },
        synced: { amount: '150.00', currency: 'USD' },
      },
    },
  ];

  async getSyncDraft(): Promise<SyncDraft | null> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate checking for changes
    if (this.mockSyncItems.length === 0) {
      return null;
    }
    
    return {
      draftId: `draft-${Date.now()}`,
      createdAt: new Date().toISOString(),
      pendingSyncs: this.mockSyncItems,
      lastSyncedAt: '2025-12-15T10:30:00Z',
    };
  }

  async approveSyncDraft(draftId: string): Promise<SyncResult> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate successful sync
    const syncedCount = this.mockSyncItems.length;
    
    // Clear pending syncs after successful sync
    this.mockSyncItems = [];
    
    return {
      success: true,
      syncedAccounts: syncedCount,
      syncedAt: new Date().toISOString(),
    };
  }
}
