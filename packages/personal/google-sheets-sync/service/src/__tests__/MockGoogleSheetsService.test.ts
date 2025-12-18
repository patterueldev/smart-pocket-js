import { MockGoogleSheetsService } from '../MockGoogleSheetsService';

describe('MockGoogleSheetsService', () => {
  let service: MockGoogleSheetsService;

  beforeEach(() => {
    service = new MockGoogleSheetsService();
  });

  describe('getSyncDraft', () => {
    it('returns sync draft with pending syncs', async () => {
      const result = await service.getSyncDraft();

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('draftId');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('pendingSyncs');
      expect(result).toHaveProperty('lastSyncedAt');
    });

    it('returns draft with sync items', async () => {
      const result = await service.getSyncDraft();

      expect(result?.pendingSyncs).toBeDefined();
      expect(Array.isArray(result?.pendingSyncs)).toBe(true);
    });

    it('returns null when no pending syncs', async () => {
      // Approve sync first to clear pending syncs
      const draft = await service.getSyncDraft();
      if (draft) {
        await service.approveSyncDraft(draft.draftId);
      }

      const result = await service.getSyncDraft();
      expect(result).toBeNull();
    });

    it('returns sync items with proper structure', async () => {
      const result = await service.getSyncDraft();
      if (result && result.pendingSyncs.length > 0) {
        const item = result.pendingSyncs[0];
        expect(item).toHaveProperty('accountId');
        expect(item).toHaveProperty('accountName');
        expect(item).toHaveProperty('lastSyncedAt');
      }
    });

    it('simulates API delay', async () => {
      const startTime = Date.now();
      await service.getSyncDraft();
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(500);
    });
  });

  describe('approveSyncDraft', () => {
    it('returns sync result', async () => {
      const draft = await service.getSyncDraft();
      expect(draft).not.toBeNull();

      if (draft) {
        const result = await service.approveSyncDraft(draft.draftId);

        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('syncedAccounts');
        expect(result).toHaveProperty('syncedAt');
      }
    });

    it('returns success true', async () => {
      const draft = await service.getSyncDraft();
      if (draft) {
        const result = await service.approveSyncDraft(draft.draftId);
        expect(result.success).toBe(true);
      }
    });

    it('returns number of synced accounts', async () => {
      const draft = await service.getSyncDraft();
      if (draft) {
        const result = await service.approveSyncDraft(draft.draftId);
        expect(typeof result.syncedAccounts).toBe('number');
        expect(result.syncedAccounts).toBeGreaterThan(0);
      }
    });

    it('clears pending syncs after approval', async () => {
      const draft = await service.getSyncDraft();
      if (draft) {
        await service.approveSyncDraft(draft.draftId);
        const afterSync = await service.getSyncDraft();
        expect(afterSync).toBeNull();
      }
    });

    it('simulates API delay', async () => {
      const draft = await service.getSyncDraft();
      if (draft) {
        const startTime = Date.now();
        await service.approveSyncDraft(draft.draftId);
        const endTime = Date.now();

        expect(endTime - startTime).toBeGreaterThanOrEqual(1000);
      }
    });
  });
});
