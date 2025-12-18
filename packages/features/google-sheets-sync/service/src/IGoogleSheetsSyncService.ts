export interface Price {
  amount: string;
  currency: string;
}

export interface SyncItem {
  accountId: string;
  accountName: string;
  lastSyncedAt: string;
  cleared?: {
    current: Price;
    synced: Price;
  };
  uncleared?: {
    current: Price;
    synced: Price;
  };
}

export interface SyncDraft {
  draftId: string;
  createdAt: string;
  pendingSyncs: SyncItem[];
  summary?: {
    totalAccounts: number;
    totalChanges: number;
  };
  lastSyncedAt?: string;
}

export interface SyncResult {
  success: boolean;
  syncedAt: string;
  accountsSynced: number;
  spreadsheetUrl?: string;
}

export interface IGoogleSheetsSyncService {
  /**
   * Create a draft of pending syncs
   */
  createDraft(): Promise<SyncDraft>;

  /**
   * Execute sync for a draft
   */
  executeSync(draftId: string): Promise<SyncResult>;
}
