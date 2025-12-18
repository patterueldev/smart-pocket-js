import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Button, theme } from '@smart-pocket/shared-ui';

export interface OCRPreviewScreenProps {
  ocrText: string;
  onSubmit: (remarks?: string) => void;
  onRetake: () => void;
  isLoading?: boolean;
}

/**
 * OCR Preview Screen
 * 
 * Displays extracted OCR text (read-only) and allows user to add remarks
 */
export const OCRPreviewScreen: React.FC<OCRPreviewScreenProps> = ({
  ocrText,
  onSubmit,
  onRetake,
  isLoading = false,
}) => {
  const [remarks, setRemarks] = useState('');

  const handleSubmit = () => {
    onSubmit(remarks.trim() || undefined);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* OCR Text Display */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📄</Text>
            <Text style={styles.sectionTitle}>OCR Extracted Text</Text>
          </View>
          <View style={styles.ocrTextContainer}>
            <Text style={styles.ocrText}>{ocrText}</Text>
          </View>
          <Text style={styles.warningText}>
            ⚠️ Read-only - Cannot edit text
          </Text>
        </View>

        {/* Remarks Input */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>✏️</Text>
            <Text style={styles.sectionTitle}>Your Remarks (Optional)</Text>
          </View>
          <RNTextInput
            style={styles.remarksInput}
            placeholder="e.g., Receipt slightly blurry at bottom. Total may be unclear"
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            numberOfLines={4}
            value={remarks}
            onChangeText={setRemarks}
            textAlignVertical="top"
          />
          <Text style={styles.helperText}>
            Note any issues to help improve AI extraction accuracy
          </Text>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <Button
          title="Continue to Details"
          onPress={handleSubmit}
          loading={isLoading}
          fullWidth
          style={styles.submitButton}
        />
        <TouchableOpacity onPress={onRetake} style={styles.retakeButton}>
          <Text style={styles.retakeText}>Retake Photo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  ocrTextContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  ocrText: {
    ...theme.typography.body,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: theme.colors.text,
  },
  warningText: {
    ...theme.typography.caption,
    color: theme.colors.warning,
    marginTop: theme.spacing.sm,
  },
  remarksInput: {
    ...theme.typography.body,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    minHeight: 100,
    color: theme.colors.text,
  },
  helperText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  actionsContainer: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  submitButton: {
    marginBottom: theme.spacing.md,
  },
  retakeButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  retakeText: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
