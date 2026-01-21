import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { Button, TextInput, Card, theme } from '@smart-pocket/shared-ui';
import type {
  TransferDraft,
  TransferType,
  Account,
  Payee,
  Price,
} from '@smart-pocket/shared-types';

export interface TransferScreenProps {
  /**
   * Available accounts for selection
   */
  accounts: Account[];
  
  /**
   * Available payees (for ATM/source selection)
   */
  payees: Payee[];
  
  /**
   * Called when transfer is submitted
   */
  onSubmit: (draft: TransferDraft) => void;
  
  /**
   * Called when user cancels
   */
  onCancel: () => void;
  
  /**
   * Loading state during submission
   */
  loading?: boolean;
  
  /**
   * Default currency
   */
  defaultCurrency?: string;
}

/**
 * TransferScreen Component
 * 
 * Form for creating transfer transactions with:
 * - Transfer type selector (withdraw/transfer/deposit)
 * - Amount input (large, centered)
 * - Source and destination account selectors
 * - Optional fee with checkbox
 * - Conditional ATM/payee selector
 */
export const TransferScreen: React.FC<TransferScreenProps> = ({
  accounts,
  payees,
  onSubmit,
  onCancel,
  loading = false,
  defaultCurrency = 'PHP',
}) => {
  const [amount, setAmount] = useState('');
  const [transferType, setTransferType] = useState<TransferType>('transfer');
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [hasFee, setHasFee] = useState(false);
  const [feeAmount, setFeeAmount] = useState('');
  const [atmPayeeId, setAtmPayeeId] = useState('');
  const [notes, setNotes] = useState('');
  const [showFromAccount, setShowFromAccount] = useState(false);
  const [showToAccount, setShowToAccount] = useState(false);
  const [showAtmPayee, setShowAtmPayee] = useState(false);

  const selectedFromAccount = accounts.find(a => a.id === fromAccountId);
  const selectedToAccount = accounts.find(a => a.id === toAccountId);
  const selectedAtmPayee = payees.find(p => p.id === atmPayeeId);
  
  // ATM/Source field is required for withdraw/deposit, not for transfer
  const requiresAtmPayee = transferType !== 'transfer';

  const handleSubmit = () => {
    // Validation
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount');
      return;
    }

    if (!fromAccountId || !toAccountId) {
      Alert.alert('Validation Error', 'Please select both source and destination accounts');
      return;
    }

    if (fromAccountId === toAccountId) {
      Alert.alert('Validation Error', 'Source and destination accounts must be different');
      return;
    }

    if (requiresAtmPayee && !atmPayeeId) {
      Alert.alert('Validation Error', 'Please select ATM/Source for this transfer type');
      return;
    }

    if (hasFee && (!feeAmount || parseFloat(feeAmount) <= 0)) {
      Alert.alert('Validation Error', 'Please enter a valid fee amount');
      return;
    }

    const draft: TransferDraft = {
      date: new Date().toISOString().split('T')[0],
      transferType,
      fromAccountId,
      toAccountId,
      amount: {
        amount,
        currency: defaultCurrency,
      },
      hasFee,
      fee: hasFee ? {
        amount: feeAmount,
        currency: defaultCurrency,
      } : undefined,
      atmPayeeId: requiresAtmPayee ? atmPayeeId : undefined,
      notes: notes.trim() || undefined,
    };

    onSubmit(draft);
  };

  const getTransferTypeLabel = (type: TransferType): string => {
    switch (type) {
      case 'withdraw':
        return 'Withdraw (Bank → Cash)';
      case 'transfer':
        return 'Transfer (Bank ↔ Bank/eWallet)';
      case 'deposit':
        return 'Deposit (Cash → Bank/eWallet)';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Amount - Large, Centered */}
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>₱</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#999"
          />
        </View>

        {/* Transfer Type Selector */}
        <View style={styles.field}>
          <Text style={styles.label}>Type of Transfer</Text>
          <View style={styles.typeButtons}>
            {(['withdraw', 'transfer', 'deposit'] as TransferType[]).map((type) => (
              <Pressable
                key={type}
                style={[
                  styles.typeButton,
                  transferType === type && styles.typeButtonActive,
                ]}
                onPress={() => setTransferType(type)}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    transferType === type && styles.typeButtonTextActive,
                  ]}
                >
                  {type === 'withdraw' ? 'Withdraw' : type === 'transfer' ? 'Transfer' : 'Deposit'}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.typeDescription}>{getTransferTypeLabel(transferType)}</Text>
        </View>

        {/* Source Account */}
        <View style={styles.field}>
          <Text style={styles.label}>Source Account</Text>
          <Pressable
            style={styles.selector}
            onPress={() => setShowFromAccount(!showFromAccount)}
          >
            <Text style={selectedFromAccount ? styles.selectorText : styles.selectorPlaceholder}>
              {selectedFromAccount?.name || 'Select account'}
            </Text>
            <Text style={styles.selectorArrow}>▼</Text>
          </Pressable>
          {showFromAccount && (
            <Card style={styles.dropdown}>
              {accounts.map((account) => (
                <Pressable
                  key={account.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setFromAccountId(account.id);
                    setShowFromAccount(false);
                  }}
                >
                  <Text style={styles.dropdownText}>{account.name}</Text>
                </Pressable>
              ))}
            </Card>
          )}
        </View>

        {/* Destination Account */}
        <View style={styles.field}>
          <Text style={styles.label}>Destination Account</Text>
          <Pressable
            style={styles.selector}
            onPress={() => setShowToAccount(!showToAccount)}
          >
            <Text style={selectedToAccount ? styles.selectorText : styles.selectorPlaceholder}>
              {selectedToAccount?.name || 'Select account'}
            </Text>
            <Text style={styles.selectorArrow}>▼</Text>
          </Pressable>
          {showToAccount && (
            <Card style={styles.dropdown}>
              {accounts.map((account) => (
                <Pressable
                  key={account.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setToAccountId(account.id);
                    setShowToAccount(false);
                  }}
                >
                  <Text style={styles.dropdownText}>{account.name}</Text>
                </Pressable>
              ))}
            </Card>
          )}
        </View>

        {/* Fee Checkbox */}
        <View style={styles.checkboxRow}>
          <Switch
            value={hasFee}
            onValueChange={setHasFee}
            trackColor={{ false: '#767577', true: theme.colors.primary }}
            thumbColor={hasFee ? '#fff' : '#f4f3f4'}
          />
          <Text style={styles.checkboxLabel}>Has transfer/withdraw fee</Text>
        </View>

        {/* Fee Amount (conditional) */}
        {hasFee && (
          <View style={styles.field}>
            <Text style={styles.label}>Fee Amount</Text>
            <TextInput
              value={feeAmount}
              onChangeText={setFeeAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#999"
            />
          </View>
        )}

        {/* ATM/Source Payee (conditional) */}
        {requiresAtmPayee && (
          <View style={styles.field}>
            <Text style={styles.label}>ATM / Source Bank</Text>
            <Pressable
              style={styles.selector}
              onPress={() => setShowAtmPayee(!showAtmPayee)}
            >
              <Text style={selectedAtmPayee ? styles.selectorText : styles.selectorPlaceholder}>
                {selectedAtmPayee?.name || 'Select ATM/Bank'}
              </Text>
              <Text style={styles.selectorArrow}>▼</Text>
            </Pressable>
            {showAtmPayee && (
              <Card style={styles.dropdown}>
                <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                  {payees.map((payee) => (
                    <Pressable
                      key={payee.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setAtmPayeeId(payee.id);
                        setShowAtmPayee(false);
                      }}
                    >
                      <Text style={styles.dropdownText}>{payee.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </Card>
            )}
          </View>
        )}

        {/* Notes */}
        <View style={styles.field}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            style={styles.notesInput}
          />
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="Cancel"
          onPress={onCancel}
          variant="secondary"
          disabled={loading}
          style={styles.actionButton}
        />
        <Button
          title="Submit"
          onPress={handleSubmit}
          disabled={loading}
          loading={loading}
          style={styles.actionButton}
        />
      </View>
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
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 24,
    marginBottom: 32,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginRight: 8,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: 'bold',
    minWidth: 150,
    textAlign: 'center',
    padding: 0,
    color: theme.colors.text,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#f5f5f5',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  typeButtonTextActive: {
    color: theme.colors.primary,
  },
  typeDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    fontStyle: 'italic',
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  selectorText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  selectorPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  selectorArrow: {
    fontSize: 12,
    color: '#999',
  },
  dropdown: {
    marginTop: 8,
    maxHeight: 200,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkboxLabel: {
    marginLeft: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  actionButton: {
    flex: 1,
  },
});
