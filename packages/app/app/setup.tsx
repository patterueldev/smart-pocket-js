import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button } from '../components/Button';
import { TextInput } from '../components/TextInput';
import { router } from 'expo-router';
import { useSession } from '../hooks/useSession';

/**
 * Setup Screen - Initial connection to server
 * 
 * User enters server URL and API key to connect to their personal Smart Pocket server
 */
export default function SetupScreen() {
  const { saveSession } = useSession();
  const [serverUrl, setServerUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    if (!serverUrl || !apiKey) {
      setError('Please enter both server URL and API key');
      return;
    }

    if (!serverUrl.startsWith('http://') && !serverUrl.startsWith('https://')) {
      setError('Server URL must start with http:// or https://');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Mock API connection
      console.log('Connecting to:', serverUrl);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save session
      await saveSession({
        serverUrl,
        apiKey,
        connected: true,
        connectedAt: new Date().toISOString(),
      });
      
      // Navigate to dashboard after successful connection
      router.replace('/(tabs)');
    } catch (err) {
      setError('Failed to connect to server');
      console.error(err);
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
  },
  helpText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
});
