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
  
  return pendingChanges.map((change) => {
    const base: PendingSync = {
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
    } as PendingSync;

    if ((change as any).uncleared) {
      base.uncleared = {
        current: {
          amount: (change.uncleared as any)?.current?.amount || '0.00',
          currency: (change.uncleared as any)?.current?.currency || 'USD',
        },
        synced: {
          amount: (change.uncleared as any)?.synced?.amount || '0.00',
          currency: (change.uncleared as any)?.synced?.currency || 'USD',
        },
      };
    }

    return base;
  });
}

function mapSyncDraft(
  draftResponse: PostApiV1GoogleSheetsSyncDraft200
): SyncDraft {
  const mapped: SyncDraft = {
    draftId: draftResponse.draftId || '',
    createdAt: draftResponse.createdAt || new Date().toISOString(),
    pendingSyncs: mapPendingSyncs(draftResponse),
    summary: draftResponse.summary
      ? {
          totalAccounts: draftResponse.summary.totalAccounts || 0,
          totalChanges: draftResponse.summary.totalChanges || 0,
        }
      : undefined,
  };

  // Back-compat: only include top-level lastSyncedAt when provided non-null
  if ((draftResponse as any).lastSyncedAt) {
    (mapped as any).lastSyncedAt = (draftResponse as any).lastSyncedAt;
  }

  return mapped;
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
    try {
      const response = await postApiV1GoogleSheetsSyncDraft();
      if (response.status === 200) {
        return mapSyncDraft(response.data);
      }
      throw new Error('Failed to create sync draft');
    } catch (error: any) {
      if (error?.status === 404) {
        throw new Error('Google Sheets sync feature is not enabled on the server');
      }
      // Bubble 401 and other errors to centralized handling
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Approve and execute a sync draft.
   */
  async executeSync(draftId: string): Promise<SyncResult> {
    try {
      const response = await postApiV1GoogleSheetsSyncApproveDraftId(draftId);
      if (response.status === 200) {
        return mapSyncResult(response.data);
      }
      throw new Error('Failed to execute sync');
    } catch (error: any) {
      if (error?.status === 404) {
        throw new Error('Sync draft not found or feature not enabled');
      }
      if (error?.status === 400) {
        throw new Error('Invalid sync draft ID');
      }
      // Bubble 401 and other errors to centralized handling
      throw error instanceof Error ? error : new Error(String(error));
    }
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
