import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button } from '../components/Button';
import { router } from 'expo-router';
import { TextInput } from '../components/TextInput';
import { useSession } from '../hooks/useSession';
import { authService, AuthError, AuthErrorType } from '@/services/authService';
import { isDevelopment, prefilledApiBaseUrl, prefilledApiKey } from '@/config/env';

/**
 * Setup Screen - Initial connection to server
 * 
 * User enters server URL and API key to connect to their personal Smart Pocket server.
 * Values can be prefilled from environment configuration (.env files or GitHub Secrets).
 */
export default function SetupScreen() {
  const { saveSession } = useSession();
  // Priority: GitHub Secrets prefilled values > empty (user enters)
  const [serverUrl, setServerUrl] = useState(prefilledApiBaseUrl || '');
  const [apiKey, setApiKey] = useState(prefilledApiKey || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const hasPrefilledValues = !!(prefilledApiBaseUrl && prefilledApiKey);

  const handleConnect = async () => {
    if (!serverUrl || !apiKey) {
      setError('Please enter both server URL and API key');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Attempt to connect using AuthService
      const session = await authService.connect(serverUrl, apiKey);
      
      // Save session to app state
      await saveSession({
        serverUrl: session.serverUrl,
        token: session.token,
        expiresAt: session.expiresAt,
        serverInfo: session.serverInfo,
        connected: true,
        connectedAt: new Date().toISOString(),
      });
      
      // Navigate to dashboard
      router.replace('/');
      console.log('Connected to server, session saved');
    } catch (err) {
      // Handle auth errors with user-friendly messages
      if (err instanceof AuthError) {
        setError(err.message);
        console.error(`Auth error [${err.type}]:`, err.originalError);
      } else if (err instanceof Error) {
        setError(err.message);
        console.error('Connection error:', err);
      } else {
        setError('Failed to connect to server');
        console.error('Unknown error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>💰</Text>
        <Text style={styles.title}>Smart Pocket</Text>
        <Text style={styles.subtitle}>Connect to your server</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          label="Server URL"
          value={serverUrl}
          onChangeText={setServerUrl}
          placeholder="https://smartpocket.example.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          editable={!loading}
        />

        <TextInput
          label="API Key"
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="Enter your API key"
          secureTextEntry
          showToggleVisibility
          editable={!loading}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          title="Connect to Server"
          onPress={handleConnect}
          loading={loading}
          disabled={!serverUrl || !apiKey || loading}
        />
      </View>

      <Text style={styles.helpText}>
        ℹ️ Get your API key from your server configuration
      </Text>
      {(isDevelopment || hasPrefilledValues) && (
        <Text style={styles.devNote}>
          {hasPrefilledValues ? '✓ Pre-filled from GitHub Secrets' : '[DEV MODE] Pre-filled from environment config'}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    gap: 20,
    marginBottom: 24,
  },
  error: {
    color: '#d32f2f',
    textAlign: 'center',
    fontSize: 14,
  },
  helpText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  devNote: {
    textAlign: 'center',
    color: '#1976d2',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 16,
  },
});
