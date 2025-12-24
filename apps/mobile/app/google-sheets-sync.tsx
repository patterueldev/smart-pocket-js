import React, { useState } from 'react';
import { Alert } from 'react-native';
import { Stack } from 'expo-router';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { GoogleSheetsSyncScreen } from '@smart-pocket/google-sheets-sync-ui';
import { MockGoogleSheetsSyncService, SyncDraft } from '@smart-pocket/google-sheets-sync-service';

const syncService = new MockGoogleSheetsSyncService();

export default function GoogleSheetsSyncRoute() {
  const [syncDraft, setSyncDraft] = useState<SyncDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Load initial data
  React.useEffect(() => {
    if (!initialized) {
      handleRefresh();
      setInitialized(true);
    }
  }, [initialized]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const draft = await syncService.createDraft();
      setSyncDraft(draft);
    } catch (error) {
      console.error('Failed to load sync draft:', error);
      Alert.alert('Error', 'Failed to load sync data');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (draftId: string) => {
    setSyncing(true);
    try {
      const result = await syncService.executeSync(draftId);
      
      if (result.success) {
        // Clear pending syncs after successful sync
        setSyncDraft({
          ...syncDraft!,
          pendingSyncs: [],
          lastSyncedAt: result.syncedAt,
        });

        Alert.alert(
          'Sync Complete',
          `${result.accountsSynced} account(s) synced successfully.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to sync:', error);
      Alert.alert('Error', 'Failed to sync to Google Sheets');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Google Sheets Sync',
          headerShown: true,
        }}
      />
      <GoogleSheetsSyncScreen
        syncDraft={syncDraft}
        onRefresh={handleRefresh}
        onSync={handleSync}
        loading={loading}
        syncing={syncing}
        Button={Button}
        Card={Card}
      />
    </>
  );
}
