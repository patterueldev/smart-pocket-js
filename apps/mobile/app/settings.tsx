import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import type { Account, Payee } from '@smart-pocket/shared-types';
import {
  getApiV1Accounts,
  getApiV1Payees,
  getApiV1SettingsTransfer,
  putApiV1SettingsTransfer,
} from '@/api/generated';

const CHECKBOX_SIZE = 24;

interface AccountWithEnabled extends Account {
  enabled?: boolean;
}

interface PayeeWithEnabled extends Payee {
  enabled?: boolean;
}

export default function SettingsRoute() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountWithEnabled[]>([]);
  const [payees, setPayees] = useState<PayeeWithEnabled[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabledAccountIds, setEnabledAccountIds] = useState<string[]>([]);
  const [bankAtmPayeeIds, setBankAtmPayeeIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [accountsResponse, payeesResponse, transferSettingsResponse] = await Promise.all([
        getApiV1Accounts(),
        getApiV1Payees(),
        getApiV1SettingsTransfer(),
      ]);

      const accountsData = accountsResponse.accounts || [];
      const payeesData = payeesResponse.payees || [];
      const transferSettingsData = transferSettingsResponse.transferSettings || {
        enabledAccountIds: [],
        bankAtmPayeeIds: [],
      };

      const accountsWithEnabled = accountsData.map(acc => ({
        ...acc,
        enabled: transferSettingsData.enabledAccountIds.includes(acc.id || ''),
      }));

      const payeesWithEnabled = payeesData.map(payee => ({
        ...payee,
        enabled: transferSettingsData.bankAtmPayeeIds.includes(payee.id || ''),
      }));

      setAccounts(accountsWithEnabled);
      setPayees(payeesWithEnabled);
      setEnabledAccountIds(transferSettingsData.enabledAccountIds);
      setBankAtmPayeeIds(transferSettingsData.bankAtmPayeeIds);
    } catch (error) {
      console.error('Failed to load settings:', error);
      Alert.alert('Error', 'Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await putApiV1SettingsTransfer({
        enabledAccountIds,
        bankAtmPayeeIds,
      });

      Alert.alert(
        'Success',
        'Settings saved successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to save settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accounts</Text>
          <Text style={styles.sectionDescription}>
            Select which accounts appear in transfer selectors
          </Text>

          {accounts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No accounts found</Text>
              <Text style={styles.emptySubtext}>
                Add accounts from your transactions
              </Text>
            </View>
          ) : (
            accounts.map((account, index) => (
              <Pressable
                key={account.id || `account-${index}`}
                style={styles.accountListItem}
                onPress={() => {
                  const newEnabledIds = enabledAccountIds.includes(account.id || '')
                    ? enabledAccountIds.filter(id => id !== account.id)
                    : [...enabledAccountIds, account.id || ''];
                  setEnabledAccountIds(newEnabledIds);
                  setAccounts(prev =>
                    prev.map(a =>
                      a.id === account.id ? { ...a, enabled: newEnabledIds.includes(account.id || '') } : a
                    )
                  );
                }}
              >
                <View style={styles.accountListItemContent}>
                  <Text style={styles.accountListItemName}>{account.name || 'Unknown Account'}</Text>
                  <View style={[styles.checkbox, enabledAccountIds.includes(account.id || '') && styles.checkboxChecked]}>
                    {enabledAccountIds.includes(account.id || '') && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bank ATMs</Text>
          <Text style={styles.sectionDescription}>
            Select which payees appear in ATM/Source dropdown
          </Text>

          {payees.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No payees found</Text>
              <Text style={styles.emptySubtext}>
                Payees will appear here once you create transactions
              </Text>
            </View>
          ) : (
            payees.map((payee, index) => (
              <Pressable
                key={payee.id || `payee-${index}`}
                style={styles.payeeListItem}
                onPress={() => {
                  const newBankAtmIds = bankAtmPayeeIds.includes(payee.id || '')
                    ? bankAtmPayeeIds.filter(id => id !== payee.id)
                    : [...bankAtmPayeeIds, payee.id || ''];
                  setBankAtmPayeeIds(newBankAtmIds);
                  setPayees(prev =>
                    prev.map(p =>
                      p.id === payee.id ? { ...p, enabled: newBankAtmIds.includes(payee.id || '') } : p
                    )
                  );
                }}
              >
                <View style={styles.payeeListItemContent}>
                  <Text style={styles.payeeListItemName}>{payee.name || 'Unknown Payee'}</Text>
                  <View style={[styles.checkbox, bankAtmPayeeIds.includes(payee.id || '') && styles.checkboxChecked]}>
                    {bankAtmPayeeIds.includes(payee.id || '') && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  headerSpacer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  accountListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  accountListItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountListItemName: {
    fontSize: 16,
    color: '#333',
  },
  payeeListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  payeeListItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  payeeListItemName: {
    fontSize: 16,
    color: '#333',
  },
  checkbox: {
    width: CHECKBOX_SIZE,
    height: CHECKBOX_SIZE,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  actions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
});
