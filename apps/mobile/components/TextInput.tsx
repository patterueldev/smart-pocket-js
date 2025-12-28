import React, { useState } from 'react';
import { View, Text, TextInput as RNTextInput, StyleSheet, TextInputProps as RNTextInputProps, TouchableOpacity } from 'react-native';

interface TextInputProps extends RNTextInputProps {
  label: string;
  error?: string;
  showToggleVisibility?: boolean; // Enable eye button for password fields
}

export function TextInput({ label, error, style, secureTextEntry, showToggleVisibility, ...props }: TextInputProps) {
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <RNTextInput
          style={[styles.input, error && styles.inputError, showToggleVisibility && styles.inputWithButton, style]}
          placeholderTextColor="#999"
          secureTextEntry={isSecure}
          {...props}
        />
        {showToggleVisibility && (
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setIsSecure(!isSecure)}
            activeOpacity={0.7}
          >
            <Text style={styles.toggleIcon}>{isSecure ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputContainer: {
    position: 'relative',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputWithButton: {
    paddingRight: 48, // Make room for the button
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  toggleButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  toggleIcon: {
    fontSize: 20,
  },
  errorText: {
    fontSize: 12,
    color: '#ff3b30',
    marginTop: 4,
  },
});
