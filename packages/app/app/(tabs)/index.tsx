import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Transaction } from '../../types';

export default function DashboardScreen() {
  const [recentTransactions] = useState<Transaction[]>([]);
  const [googleSheetsSyncEnabled] = useState(false);

  const handleScanReceipt = () => {
    console.log('Scan receipt pressed');
  };

  const handleManualTransaction = () => {
    console.log('Manual transaction pressed');
  };

  const handleGoogleSheetsSync = () => {
    console.log('Google Sheets sync pressed');
  };

  const handleOpenMenu = () => {
    console.log('Menu pressed');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleOpenMenu} style={styles.menuButton}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Smart Pocket</Text>
        <View style={styles.serverStatus}>
          <Text style={styles.serverIcon}>✓</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {recentTransactions.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptyHint}>Tap "Scan Receipt" to get started</Text>
            </Card>
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

        <View style={styles.section}>
          <Button title="📸 Scan Receipt" onPress={handleScanReceipt} size="large" />
        </View>

        {googleSheetsSyncEnabled && (
          <View style={styles.section}>
            <Button title="📊 Google Sheets Sync" onPress={handleGoogleSheetsSync} variant="secondary" />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.quickAction} onPress={handleManualTransaction}>
            <Text style={styles.quickActionText}>• Manual Transaction</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <Text style={styles.quickActionText}>• View All Transactions</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  menuButton: { padding: 12 },
  menuIcon: { fontSize: 24 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  serverStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serverIcon: { color: '#4caf50', fontSize: 18 },
  content: { flex: 1 },
  scrollContent: { padding: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  emptyCard: { padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#666', marginBottom: 8 },
  emptyHint: { fontSize: 14, color: '#999' },
  transactionCard: { padding: 16, marginBottom: 12 },
  transactionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  transactionInfo: { flex: 1 },
  transactionPayee: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
  transactionDate: { fontSize: 14, color: '#666' },
  transactionAmount: { fontSize: 18, fontWeight: 'bold' },
  quickAction: { paddingVertical: 16 },
  quickActionText: { fontSize: 16, color: '#2196f3' },
});
