import { Price } from './Price';

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
  pendingChanges: SyncItem[];
  summary: {
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
