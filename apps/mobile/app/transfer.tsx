import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { TransferScreen } from '@smart-pocket/transfer-ui';
import type { TransferDraft, Account, Payee } from '@smart-pocket/shared-types';
import { postApiV1Transfers } from '../api/generated';

// Mock services - will be replaced with real services
const mockAccounts: Account[] = [
  { id: '1', name: 'BPI Checking', actualBudgetId: 'bpi-1' },
  { id: '2', name: 'Cash', actualBudgetId: 'cash-1' },
  { id: '3', name: 'GCash', actualBudgetId: 'gcash-1' },
  { id: '4', name: 'Maya', actualBudgetId: 'maya-1' },
];

const mockPayees: Payee[] = [
  { id: '1', name: 'BPI ATM', transactionCount: 15 },
  { id: '2', name: 'BDO ATM', transactionCount: 8 },
  { id: '3', name: 'Security Bank', transactionCount: 5 },
  { id: '4', name: 'GCash', transactionCount: 20 },
  { id: '5', name: 'Maya', transactionCount: 12 },
];

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
      // TODO: Replace with real service calls
      // const [accountsData, payeesData] = await Promise.all([
      //   accountService.getAccounts(),
      //   payeeService.getPayees(),
      // ]);
      
      // Using mock data for now
      setAccounts(mockAccounts);
      setPayees(mockPayees);
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
      console.log('Creating transfer:', draft);
      
      // Call API
      await postApiV1Transfers({
        date: draft.date,
        transferType: draft.transferType,
        fromAccountId: draft.fromAccountId,
        toAccountId: draft.toAccountId,
        amount: draft.amount,
        fee: draft.fee,
        hasFee: draft.hasFee,
        atmPayeeId: draft.atmPayeeId,
        notes: draft.notes,
      });
      
      Alert.alert(
        'Success',
        'Transfer created successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to dashboard
              router.replace('/(tabs)');
            },
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
    Alert.alert(
      'Discard Transfer',
      'Are you sure you want to discard this transfer?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
  };

  if (initializing) {
    return null; // Or show loading spinner
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
