import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Button, Card, theme } from '@smart-pocket/shared-ui';
import { Transaction } from '@smart-pocket/shared-types';

export interface DashboardScreenProps {
  recentTransactions: Transaction[];
  onScanReceipt: () => void;
  onManualTransaction: () => void;
  onGoogleSheetsSync?: () => void;
  onOpenMenu: () => void;
  googleSheetsSyncEnabled?: boolean;
}

/**
 * DashboardScreen - Main hub
 * 
 * Shows recent transactions and primary actions
 */
export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  recentTransactions,
  onScanReceipt,
  onManualTransaction,
  onGoogleSheetsSync,
  onOpenMenu,
  googleSheetsSyncEnabled = false,
}) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onOpenMenu} style={styles.menuButton}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Smart Pocket</Text>
        <View style={styles.serverStatus}>
          <Text style={styles.serverIcon}>✓</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Recent Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {recentTransactions.length === 0 ? (
            <Text style={styles.emptyText}>No transactions yet</Text>
          ) : (
            recentTransactions.slice(0, 5).map(txn => (
              <Card key={txn.id} style={styles.transactionCard}>
                <View style={styles.transactionRow}>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionPayee}>{txn.payeeName}</Text>
                    <Text style={styles.transactionDate}>{txn.date}</Text>
                  </View>
                  <Text style={styles.transactionAmount}>
                    ${txn.total.amount}
                  </Text>
                </View>
              </Card>
            ))
          )}
        </View>

        {/* Primary Action */}
        <View style={styles.section}>
          <Button
            title="📸 Scan Receipt"
            onPress={onScanReceipt}
            size="large"
          />
        </View>

        {/* Google Sheets Sync (conditional) */}
        {googleSheetsSyncEnabled && Platform.OS !== 'android' && Platform.OS !== 'ios' && (
          <View style={styles.section}>
            <Button
              title="📊 Google Sheets Sync"
              onPress={onGoogleSheetsSync}
              variant="secondary"
            />
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={onManualTransaction}
          >
            <Text style={styles.quickActionText}>• Manual Transaction</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <Text style={styles.quickActionText}>• View All Transactions</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  menuButton: {
    padding: theme.spacing.sm,
  },
  menuIcon: {
    fontSize: 24,
    color: theme.colors.text,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  serverStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serverIcon: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
    color: theme.colors.text,
  },
  transactionCard: {
    marginBottom: theme.spacing.sm,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionPayee: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  transactionDate: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: 16,
    paddingVertical: theme.spacing.lg,
  },
  quickAction: {
    paddingVertical: theme.spacing.sm,
  },
  quickActionText: {
    fontSize: 16,
    color: theme.colors.primary,
  },
});
