import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { Button, TextInput, Card, theme } from '@smart-pocket/shared-ui';
import type {
  TransactionDraft,
  LineItem,
  Payee,
  Account,
} from '@smart-pocket/shared-types';

export interface TransactionScreenProps {
  /**
   * Initial draft data (from OCR or editing existing transaction)
   */
  initialDraft?: Partial<TransactionDraft>;
  
  /**
   * Called when transaction is saved
   */
  onSave: (draft: TransactionDraft) => void;
  
  /**
   * Called when user cancels
   */
  onCancel: () => void;
  
  /**
   * Available payees for selection
   */
  payees: Payee[];
  
  /**
   * Available accounts for selection
   */
  accounts: Account[];
  
  /**
   * Loading state
   */
  loading?: boolean;
}

/**
 * TransactionScreen Component
 * 
 * Form for creating/editing transactions with:
 * - Date picker
 * - Payee selector
 * - Account selector
 * - Line items list
 * - Calculated total
 */
export const TransactionScreen: React.FC<TransactionScreenProps> = ({
  initialDraft,
  onSave,
  onCancel,
  payees,
  accounts,
  loading = false,
}) => {
  const [date, setDate] = useState(initialDraft?.date || new Date().toISOString().split('T')[0]);
  const [selectedPayeeId, setSelectedPayeeId] = useState(initialDraft?.payeeId || '');
  const [selectedAccountId, setSelectedAccountId] = useState(initialDraft?.accountId || '');
  const [items, setItems] = useState<LineItem[]>(initialDraft?.items || []);
  const [showPayeeSelector, setShowPayeeSelector] = useState(false);
  const [showAccountSelector, setShowAccountSelector] = useState(false);

  const selectedPayee = payees.find(p => p.id === selectedPayeeId);
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  // Calculate total from items
  const total = items.reduce((sum, item) => {
    const amount = parseFloat(item.price.amount) * item.quantity;
    return sum + amount;
  }, 0);

  const handleSave = () => {
    if (!selectedPayeeId || !selectedAccountId || items.length === 0) {
      // TODO: Show validation error
      return;
    }

    const draft: TransactionDraft = {
      date,
      payeeId: selectedPayeeId,
      accountId: selectedAccountId,
      items,
    };

    onSave(draft);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Date Field */}
        <View style={styles.section}>
          <Text style={styles.label}>📅 Date</Text>
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
          />
        </View>

        {/* Payee Selector */}
        <View style={styles.section}>
          <Text style={styles.label}>🏪 Payee</Text>
          <Pressable
            style={({ pressed }) => [styles.selector, pressed && styles.pressed]}
            onPress={() => setShowPayeeSelector(true)}
          >
            <Text style={selectedPayee ? styles.selectedText : styles.placeholderText}>
              {selectedPayee ? selectedPayee.name : 'Select payee'}
            </Text>
            <Text style={styles.chevron}>▼</Text>
          </Pressable>
          
          {showPayeeSelector && (
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Select Payee</Text>
              <ScrollView style={styles.modalList}>
                {payees.map(payee => (
                  <Pressable
                    key={payee.id}
                    style={({ pressed }) => [
                      styles.modalItem,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => {
                      setSelectedPayeeId(payee.id);
                      setShowPayeeSelector(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{payee.name}</Text>
                    <Text style={styles.modalItemCount}>
                      {payee.transactionCount} transactions
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setShowPayeeSelector(false)}
              />
            </View>
          )}
        </View>

        {/* Account Selector */}
        <View style={styles.section}>
          <Text style={styles.label}>💳 Account</Text>
          <Pressable
            style={({ pressed }) => [styles.selector, pressed && styles.pressed]}
            onPress={() => setShowAccountSelector(true)}
          >
            <Text style={selectedAccount ? styles.selectedText : styles.placeholderText}>
              {selectedAccount ? selectedAccount.name : 'Select account'}
            </Text>
            <Text style={styles.chevron}>▼</Text>
          </Pressable>
          
          {showAccountSelector && (
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Select Account</Text>
              <ScrollView style={styles.modalList}>
                {accounts.map(account => (
                  <Pressable
                    key={account.id}
                    style={({ pressed }) => [
                      styles.modalItem,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => {
                      setSelectedAccountId(account.id);
                      setShowAccountSelector(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{account.name}</Text>
                    <Text style={styles.modalItemCount}>{account.type}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setShowAccountSelector(false)}
              />
            </View>
          )}
        </View>

        {/* Total Display */}
        <View style={styles.section}>
          <Text style={styles.label}>💰 Total</Text>
          <Text style={styles.totalText}>
            ${total.toFixed(2)} {items[0]?.price.currency || 'USD'}
          </Text>
          <Text style={styles.helperText}>Calculated from items</Text>
        </View>

        {/* Items List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>📦 Items ({items.length})</Text>
            <Pressable
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </Pressable>
          </View>

          {items.map((item, index) => (
            <Card key={index} style={styles.itemCard}>
              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemCode}>{item.codeName}</Text>
                  <Text style={styles.itemName}>{item.readableName}</Text>
                  <Text style={styles.itemPrice}>
                    ${item.price.amount} × {item.quantity}
                  </Text>
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.itemAction,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => handleRemoveItem(index)}
                >
                  <Text style={styles.itemActionText}>🗑️</Text>
                </Pressable>
              </View>
            </Card>
          ))}

          {items.length === 0 && (
            <Text style={styles.emptyText}>No items added yet</Text>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          title="Save Transaction"
          onPress={handleSave}
          loading={loading}
          disabled={!selectedPayeeId || !selectedAccountId || items.length === 0}
        />
        <Button
          title="Cancel"
          variant="outline"
          onPress={onCancel}
          disabled={loading}
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
  scrollContent: {
    padding: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    backgroundColor: '#fff',
  },
  selectedText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  placeholderText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  chevron: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  totalText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  helperText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  addButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  addButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  itemCard: {
    marginBottom: theme.spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemCode: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginVertical: theme.spacing.xs,
  },
  itemPrice: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  itemAction: {
    padding: theme.spacing.sm,
  },
  itemActionText: {
    fontSize: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: 16,
    marginTop: theme.spacing.md,
  },
  actions: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: '#fff',
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 1000,
    padding: theme.spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
  },
  modalList: {
    flex: 1,
    marginBottom: theme.spacing.md,
  },
  modalItem: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  modalItemCount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
});
