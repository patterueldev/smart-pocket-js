import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { TransferScreen } from '@smart-pocket/transfer-ui';
import type { TransferDraft, Account, Payee } from '@smart-pocket/shared-types';
import {
  postApiV1Transfers,
  getApiV1Accounts,
  getApiV1Payees,
  getApiV1SettingsTransfer,
} from '../api/generated';

export default function TransferRoute() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [payees, setPayees] = useState<Payee[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

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
      const transferSettings = transferSettingsResponse.transferSettings || {
        enabledAccountIds: [],
        bankAtmPayeeIds: [],
      };

      const enabledAccounts = accountsData.filter(acc =>
        transferSettings.enabledAccountIds.includes(acc.id || '')
      );

      const bankAtmPayees = payeesData.filter(payee =>
        transferSettings.bankAtmPayeeIds.includes(payee.id || '')
      );

      setAccounts(enabledAccounts);
      setPayees(bankAtmPayees);
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setInitializing(false);
    }
  };

  const handleSubmit = async (draft: TransferDraft) => {
    setLoading(true);
    try {
      await postApiV1Transfers(draft);

      Alert.alert(
        'Success',
        'Transfer created successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to create transfer:', error);
      Alert.alert('Error', 'Failed to create transfer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (initializing) {
    return null;
  }

  return (
    <TransferScreen
      accounts={accounts}
      payees={payees}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={loading}
      defaultCurrency="PHP"
    />
  );
}
