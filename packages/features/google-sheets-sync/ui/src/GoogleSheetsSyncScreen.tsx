import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ViewStyle,
  TextStyle,
} from 'react-native';
import type { SyncDraft, SyncItem } from '@smart-pocket/google-sheets-sync-service';

export interface GoogleSheetsSyncScreenProps {
  /**
   * Current sync draft data
   */
  syncDraft: SyncDraft | null;
  
  /**
   * Called when user pulls to refresh
   */
  onRefresh: () => void;
  
  /**
   * Called when user triggers sync
   */
  onSync: (draftId: string) => void;
  
  /**
   * Loading states
   */
  loading?: boolean;
  syncing?: boolean;

  /**
   * Custom Button component (dependency injection)
   */
  Button: React.ComponentType<{
    title: string;
    onPress: () => void;
    loading?: boolean;
  }>;

  /**
   * Custom Card component (dependency injection)
   */
  Card: React.ComponentType<{
    style?: ViewStyle;
    children: React.ReactNode;
  }>;
}

/**
 * GoogleSheetsSyncScreen Component
 * 
 * Displays pending account balance syncs with:
 * - Pull to refresh
 * - List of accounts with changes (cleared/uncleared)
 * - Sync button
 * - Empty state when all synced
 */
export function GoogleSheetsSyncScreen({
  syncDraft,
  onRefresh,
  onSync,
  loading = false,
  syncing = false,
  Button,
  Card,
}: GoogleSheetsSyncScreenProps) {
  const hasPendingSyncs = syncDraft && syncDraft.pendingSyncs.length > 0;

  const formatRelativeTime = (isoDate: string): string => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const renderBalanceChange = (
    label: string,
    current?: { amount: string; currency: string } | null,
    synced?: { amount: string; currency: string } | null,
  ) => {
    if (!current || !synced || current.amount === synced.amount) {
      return null;
    }

    return (
      <View style={styles.balanceRow}>
        <Text style={styles.balanceLabel}>{label}:</Text>
        <View style={styles.balanceChange}>
          <Text style={styles.balanceOld}>
            {synced.currency} {synced.amount}
          </Text>
          <Text style={styles.arrow}>→</Text>
          <Text style={styles.balanceNew}>
            {current.currency} {current.amount}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
      >
        {!hasPendingSyncs && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyTitle}>All accounts are synced</Text>
            <Text style={styles.emptyText}>Pull down to check for updates</Text>
            {syncDraft?.lastSyncedAt && (
              <Text style={styles.lastSyncText}>
                Last synced: {formatRelativeTime(syncDraft.lastSyncedAt)}
              </Text>
            )}
          </View>
        )}

        {hasPendingSyncs && (
          <>
            <Text style={styles.header}>
              Pending Syncs ({syncDraft.pendingSyncs.length})
            </Text>

            {syncDraft.pendingSyncs.map((item: SyncItem) => (
              <Card key={item.accountId} style={styles.accountCard}>
                <View style={styles.accountHeader}>
                  <Text style={styles.accountIcon}>
                    {item.accountName.includes('Cash') ? '💵' : '💳'}
                  </Text>
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountName}>{item.accountName}</Text>
                    <Text style={styles.lastSynced}>
                      Last synced: {formatRelativeTime(item.lastSyncedAt)}
                    </Text>
                  </View>
                </View>

                {renderBalanceChange('Cleared', item.cleared?.current, item.cleared?.synced)}
                {renderBalanceChange('Uncleared', item.uncleared?.current, item.uncleared?.synced)}
              </Card>
            ))}
          </>
        )}
      </ScrollView>

      {hasPendingSyncs && (
        <View style={styles.actions}>
          <Button
            title="Sync to Google Sheets"
            onPress={() => onSync(syncDraft.draftId)}
            loading={syncing}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  lastSyncText: {
    fontSize: 14,
    color: '#666',
    marginTop: 16,
  },
  accountCard: {
    marginBottom: 16,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  accountIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  lastSynced: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  balanceRow: {
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  balanceChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceOld: {
    fontSize: 16,
    color: '#D32F2F',
    fontWeight: '500',
  },
  arrow: {
    fontSize: 16,
    color: '#666',
    marginHorizontal: 8,
  },
  balanceNew: {
    fontSize: 16,
    color: '#388E3C',
    fontWeight: '600',
  },
  actions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
});
