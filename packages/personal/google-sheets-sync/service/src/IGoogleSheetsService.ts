import { SyncDraft, SyncResult } from '@smart-pocket/shared-types';

/**
 * Google Sheets Service Interface
 * 
 * Handles account balance sync to Google Sheets (personal feature)
 */
export interface IGoogleSheetsService {
  /**
   * Get draft of pending sync changes
   * 
   * Compares Actual Budget balances with last synced values
   * 
   * @returns Draft with pending changes or null if all synced
   */
  getSyncDraft(): Promise<SyncDraft | null>;
  
  /**
   * Execute sync to Google Sheets
   * 
   * Updates spreadsheet with current account balances
   * 
   * @param draftId - Draft ID from getSyncDraft()
   * @returns Sync result with updated accounts
   */
  approveSyncDraft(draftId: string): Promise<SyncResult>;
}
