import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { TransactionScreen } from '@smart-pocket/transaction-ui';
import { RealTransactionService } from '@smart-pocket/transaction-service';
import type { TransactionDraft, Payee, Account, LineItem } from '@smart-pocket/shared-types';

const transactionService = new RealTransactionService();

export default function TransactionRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [payees, setPayees] = useState<Payee[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [initialDraft, setInitialDraft] = useState<Partial<TransactionDraft> | undefined>();

  console.log('🔵 TransactionRoute RENDER', {
    initializing,
    loading,
    fromOCR: params.fromOCR,
    hasInitialDraft: !!initialDraft,
    paramsKeys: Object.keys(params),
  });

  useEffect(() => {
    console.log('🟢 TransactionRoute MOUNT - useEffect triggered');
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInitialData = async () => {
    console.log('🔷 loadInitialData STARTED');
    try {
      // Load payees and accounts
      const [payeesData, accountsData] = await Promise.all([
        transactionService.getPayees(),
        transactionService.getAccounts(),
      ]);
      console.log('🔷 loadInitialData - Loaded payees:', payeesData.length, 'accounts:', accountsData.length);
      
      setPayees(payeesData);
      setAccounts(accountsData);

      // If coming from OCR, pre-fill draft
      console.log('🔷 Checking if fromOCR:', params.fromOCR);
      if (params.fromOCR === 'true') {
        console.log('🔷 fromOCR is true, parsing items...');
        const items: LineItem[] = params.items 
          ? JSON.parse(params.items as string).map((item: any, index: number) => ({
              id: `temp-${index}`,
              codeName: item.codeName,
              readableName: item.readableName,
              price: item.price,
              quantity: item.quantity,
            }))
          : [];

        // Try to match merchant to existing payee
        const merchantName = params.merchant as string;
        const matchedPayee = payeesData.find(p => 
          p.name.toLowerCase() === merchantName?.toLowerCase()
        );

        const draft = {
          date: params.date as string || new Date().toISOString().split('T')[0],
          payeeId: matchedPayee?.id || '',
          accountId: accountsData[0]?.id || '', // Default to first account
          items: items.map(({ id, ...rest }) => rest), // Remove temporary IDs for draft
          ocrMetadata: params.ocrText ? {
            rawText: params.ocrText as string,
            remarks: params.remarks as string,
            confidence: parseFloat(params.confidence as string),
          } : undefined,
        };
        console.log('🔷 Setting initialDraft:', { itemCount: draft.items.length, payeeId: draft.payeeId });
        setInitialDraft(draft);
      }
    } catch (error) {
      console.error('❌ Failed to load initial data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      console.log('🔷 loadInitialData COMPLETED - setting initializing to false');
      setInitializing(false);
    }
  };

  const handleSave = async (draft: TransactionDraft) => {
    console.log('💾 handleSave CALLED');
    setLoading(true);
    try {
      const transaction = await transactionService.createTransaction(draft);
      console.log('💾 Transaction created:', transaction);
      
      Alert.alert(
        'Success',
        'Transaction saved successfully!',
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
      console.error('Failed to create transaction:', error);
      Alert.alert('Error', 'Failed to save transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard this transaction?',
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

  const handleCreatePayee = async (name: string): Promise<Payee> => {
    try {
      const newPayee = await transactionService.createPayee(name);
      // Refresh payees list
      const updatedPayees = await transactionService.getPayees();
      setPayees(updatedPayees);
      return newPayee;
    } catch (error) {
      console.error('Failed to create payee:', error);
      throw error;
    }
  };

  const handleSearchPayees = async (search: string): Promise<Payee[]> => {
    try {
      return await transactionService.getPayees(search);
    } catch (error) {
      console.error('Failed to search payees:', error);
      return [];
    }
  };

  if (initializing) {
    console.log('🔵 TransactionRoute returning null (initializing)');
    return null; // Or show loading spinner
  }

  console.log('🔵 TransactionRoute RENDERING TransactionScreen', {
    hasDraft: !!initialDraft,
    payeesCount: payees.length,
    accountsCount: accounts.length,
  });

  return (
    <TransactionScreen
      initialDraft={initialDraft}
      onSave={handleSave}
      onCancel={handleCancel}
      onCreatePayee={handleCreatePayee}
      onSearchPayees={handleSearchPayees}
      payees={payees}
      accounts={accounts}
      loading={loading}
    />
  );
}
