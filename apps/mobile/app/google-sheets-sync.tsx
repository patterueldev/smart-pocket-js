import React, { useState } from 'react';
import { Alert } from 'react-native';
import { Stack } from 'expo-router';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { GoogleSheetsSyncScreen } from '@smart-pocket/google-sheets-sync-ui';
import { googleSheetsSyncService, SyncDraft } from '../services/googleSheetsSyncService';

export default function GoogleSheetsSyncRoute() {
  const [syncDraft, setSyncDraft] = useState<SyncDraft | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
      const draft = await googleSheetsSyncService.createDraft();
      setSyncDraft(draft);
    } catch (error) {
      console.error('Failed to load sync draft:', error);
      Alert.alert('Error', 'Failed to load sync data. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const handlePullToRefresh = async () => {
    setRefreshing(true);
    try {
      const draft = await googleSheetsSyncService.refresh();
      setSyncDraft(draft);
    } catch (error) {
      console.error('Failed to refresh sync draft:', error);
      Alert.alert('Error', 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSync = async (draftId: string) => {
    setSyncing(true);
    try {
      const result = await googleSheetsSyncService.executeSync(draftId);
      
      if (result.success) {
        // Refresh draft to get updated state after sync
        const updatedDraft = await googleSheetsSyncService.refresh();
        setSyncDraft(updatedDraft);

        Alert.alert(
          'Sync Complete',
          `${result.accountsSynced} account(s) synced successfully at ${new Date(result.syncedAt).toLocaleTimeString()}.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to sync:', error);
      Alert.alert('Error', 'Failed to sync to Google Sheets. Please try again.');
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
        onRefresh={handlePullToRefresh}
        onSync={handleSync}
        initialLoading={initialLoading}
        loading={loading}
        syncing={syncing}
        Button={Button}
        Card={Card}
      />
    </>
  );
}
