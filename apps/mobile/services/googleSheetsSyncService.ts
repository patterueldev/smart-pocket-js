import {
  postApiV1GoogleSheetsSyncDraft,
  postApiV1GoogleSheetsSyncApproveDraftId,
  PostApiV1GoogleSheetsSyncDraft200,
  PostApiV1GoogleSheetsSyncApproveDraftId200,
} from '../api/generated';

// UI Models
export interface PendingSync {
  accountId: string;
  accountName: string;
  lastSyncedAt?: string | null;
  cleared?: {
    current: { amount: string; currency: string };
    synced: { amount: string; currency: string };
  };
  uncleared?: {
    current: { amount: string; currency: string };
    synced: { amount: string; currency: string };
  };
}

export interface SyncDraft {
  draftId: string;
  createdAt: string;
  pendingSyncs: PendingSync[];
  summary?: {
    totalAccounts: number;
    totalChanges: number;
  };
  lastSyncedAt?: string | null;
}

export interface SyncResult {
  success: boolean;
  syncedAt: string;
  accountsSynced: number;
  spreadsheetUrl?: string;
}

// DTO Mappers
function mapPendingSyncs(
  draftResponse: PostApiV1GoogleSheetsSyncDraft200
): PendingSync[] {
  const pendingChanges = draftResponse.pendingChanges || [];
  
  return pendingChanges.map((change) => ({
    accountId: change.accountId || '',
    accountName: change.accountName || '',
    lastSyncedAt: (change as any).lastSyncedAt || null,
    cleared: change.cleared
      ? {
          current: {
            amount: change.cleared.current?.amount || '0.00',
            currency: change.cleared.current?.currency || 'USD',
          },
          synced: {
            amount: change.cleared.synced?.amount || '0.00',
            currency: change.cleared.synced?.currency || 'USD',
          },
        }
      : undefined,
    uncleared: change.uncleared
      ? {
          current: {
            amount: (change.uncleared as any)?.current?.amount || '0.00',
            currency: (change.uncleared as any)?.current?.currency || 'USD',
          },
          synced: {
            amount: (change.uncleared as any)?.synced?.amount || '0.00',
            currency: (change.uncleared as any)?.synced?.currency || 'USD',
          },
        }
      : undefined,
  }));
}

function mapSyncDraft(
  draftResponse: PostApiV1GoogleSheetsSyncDraft200
): SyncDraft {
  return {
    draftId: draftResponse.draftId || '',
    createdAt: draftResponse.createdAt || new Date().toISOString(),
    pendingSyncs: mapPendingSyncs(draftResponse),
    lastSyncedAt: (draftResponse as any).lastSyncedAt || null,
    summary: draftResponse.summary
      ? {
          totalAccounts: draftResponse.summary.totalAccounts || 0,
          totalChanges: draftResponse.summary.totalChanges || 0,
        }
      : undefined,
  };
}

function mapSyncResult(
  approveResponse: PostApiV1GoogleSheetsSyncApproveDraftId200
): SyncResult {
  return {
    success: approveResponse.success || false,
    syncedAt: approveResponse.syncedAt || new Date().toISOString(),
    accountsSynced: approveResponse.accountsSynced || 0,
    spreadsheetUrl: approveResponse.spreadsheetUrl,
  };
}

// Service Implementation
export class GoogleSheetsSyncService {
  /**
   * Fetch a new sync draft with pending changes.
   */
  async createDraft(): Promise<SyncDraft> {
    const response = await postApiV1GoogleSheetsSyncDraft();
    
    // Handle union response type - check for success status
    if (response.status === 200) {
      return mapSyncDraft(response.data);
    }
    
    // Handle error response (404 - feature not enabled)
    throw new Error(
      response.status === 404
        ? 'Google Sheets sync feature is not enabled on the server'
        : 'Failed to create sync draft'
    );
  }

  /**
   * Approve and execute a sync draft.
   */
  async executeSync(draftId: string): Promise<SyncResult> {
    const response = await postApiV1GoogleSheetsSyncApproveDraftId(draftId);
    
    // Handle union response type - check for success status
    if (response.status === 200) {
      return mapSyncResult(response.data);
    }
    
    // Handle error responses
    throw new Error(
      response.status === 404
        ? 'Sync draft not found or feature not enabled'
        : response.status === 400
        ? 'Invalid sync draft ID'
        : 'Failed to execute sync'
    );
  }

  /**
   * Refresh by creating a new draft (convenience method).
   */
  async refresh(): Promise<SyncDraft> {
    return this.createDraft();
  }
}

// Export singleton instance
export const googleSheetsSyncService = new GoogleSheetsSyncService();
