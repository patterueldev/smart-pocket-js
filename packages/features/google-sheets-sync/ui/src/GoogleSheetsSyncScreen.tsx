import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  initialLoading?: boolean;
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
  initialLoading = false,
  loading = false,
  syncing = false,
  Button,
  Card,
}: GoogleSheetsSyncScreenProps) {
  const hasPendingSyncs = syncDraft && syncDraft.pendingSyncs.length > 0;

  // Currency symbols map
  const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    PHP: '₱',
    CNY: '¥',
    INR: '₹',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'CHF',
    SEK: 'kr',
    NZD: 'NZ$',
  };

  const getCurrencySymbol = (code: string): string => {
    return CURRENCY_SYMBOLS[code] || code;
  };

  const formatDate = (isoDate?: string | null): string => {
    if (!isoDate) return 'Not synced yet';

    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return 'Not synced yet';

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: string, currency: string): string => {
    const numAmount = parseFloat(amount);
    const isNegative = numAmount < 0;
    const absoluteAmount = Math.abs(numAmount);
    const symbol = getCurrencySymbol(currency);
    // Use toLocaleString for thousands separators
    const formatted = absoluteAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return isNegative ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
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
            {formatAmount(synced.amount, synced.currency)}
          </Text>
          <Text style={styles.arrow}>→</Text>
          <Text style={styles.balanceNew}>
            {formatAmount(current.amount, current.currency)}
          </Text>
        </View>
      </View>
    );
  };

  // Skeleton loader data
  const skeletonLayout = [
    { key: 'skeleton1', width: '100%', height: 120, marginBottom: 16, borderRadius: 8 },
    { key: 'skeleton2', width: '100%', height: 120, marginBottom: 16, borderRadius: 8 },
    { key: 'skeleton3', width: '100%', height: 120, marginBottom: 16, borderRadius: 8 },
  ];

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.scrollContent}>
          {skeletonLayout.map((item) => (
            <View
              key={item.key}
              style={{
                width: item.width,
                height: item.height,
                marginBottom: item.marginBottom,
                borderRadius: item.borderRadius,
                backgroundColor: '#E0E0E0',
              }}
            />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scrollViewWrapper}>
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
                  Last synced: {formatDate(syncDraft.lastSyncedAt)}
                </Text>
              )}
            </View>
          )}

          {hasPendingSyncs && (
            <>
              {syncDraft.pendingSyncs.map((item: SyncItem, index: number) => (
                <Card
                  key={item.accountId || `${item.accountName}-${index}`}
                  style={styles.accountCard}
                >
                  <View style={styles.accountHeader}>
                    <Text style={styles.accountIcon}>
                      {item.accountName.includes('Cash') ? '💵' : '💳'}
                    </Text>
                    <View style={styles.accountInfo}>
                      <Text style={styles.accountName}>{item.accountName}</Text>
                      <Text style={styles.lastSynced}>
                        Last synced: {formatDate(item.lastSyncedAt)}
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
      </View>

      {hasPendingSyncs && (
        <View style={[styles.actions, styles.actionsPadding]}>
          <Button
            title="Sync to Google Sheets"
            onPress={() => onSync(syncDraft.draftId)}
            loading={syncing}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollViewWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: Platform.select({ ios: 32, android: 20 }),
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
    paddingBottom: Platform.select({ ios: 48, android: 24 }),
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  actionsPadding: {
    paddingBottom: 0,
  },
});
