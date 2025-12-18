import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Button, Card, theme } from '@smart-pocket/shared-ui';
import type { SyncDraft, SyncItem } from '@smart-pocket/shared-types';

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
export const GoogleSheetsSyncScreen: React.FC<GoogleSheetsSyncScreenProps> = ({
  syncDraft,
  onRefresh,
  onSync,
  loading = false,
  syncing = false,
}) => {
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
    color: theme.colors.text,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  lastSyncText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  accountCard: {
    marginBottom: theme.spacing.md,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  accountIcon: {
    fontSize: 24,
    marginRight: theme.spacing.sm,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  lastSynced: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  balanceRow: {
    marginBottom: theme.spacing.sm,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  balanceChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceOld: {
    fontSize: 16,
    color: theme.colors.error,
    fontWeight: '500',
  },
  arrow: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginHorizontal: theme.spacing.sm,
  },
  balanceNew: {
    fontSize: 16,
    color: theme.colors.success,
    fontWeight: '600',
  },
  actions: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: '#fff',
  },
});
