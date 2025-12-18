import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
import { Button, TextInput, theme } from '@smart-pocket/shared-ui';

export interface SetupScreenProps {
  onConnect: (serverUrl: string, apiKey: string) => void;
  loading?: boolean;
}

/**
 * SetupScreen - Initial connection screen
 * 
 * User enters server URL and API key to connect
 */
export const SetupScreen: React.FC<SetupScreenProps> = ({
  onConnect,
  loading = false,
}) => {
  const [serverUrl, setServerUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');

  const handleConnect = () => {
    if (!serverUrl || !apiKey) {
      setError('Please enter both server URL and API key');
      return;
    }

    setError('');
    onConnect(serverUrl, apiKey);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>💰</Text>
        <Text style={styles.title}>Smart Pocket</Text>
        <Text style={styles.subtitle}>Connect to your server</Text>

        <View style={styles.form}>
          <TextInput
            label="Server URL"
            value={serverUrl}
            onChangeText={setServerUrl}
            placeholder="https://smartpocket.example.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <TextInput
            label="API Key"
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="Enter your API key"
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Connect to Server"
            onPress={handleConnect}
            loading={loading}
            disabled={!serverUrl || !apiKey}
          />
        </View>

        <Text style={styles.helpText}>
          ℹ️ Get your API key from your server configuration
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: 'center',
  },
  logo: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  form: {
    gap: theme.spacing.md,
  },
  error: {
    color: theme.colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  helpText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
});
