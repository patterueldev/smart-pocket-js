/**
 * Environment configuration for mobile app
 * Controls development prefills and feature flags
 */

import Constants from 'expo-constants';

const isDev = __DEV__ || process.env.NODE_ENV === 'development';

interface EnvConfig {
  isDev: boolean;
  devServerUrl: string | null;
  devApiKey: string | null;
  apiBaseUrl: string;
}

/**
 * Get environment configuration
 * Reads from:
 * - Expo extra config (app.json)
 * - Environment variables
 * - Hardcoded defaults
 */
export function getEnvConfig(): EnvConfig {
  const expoExtra = Constants.expoConfig?.extra || {};

  return {
    isDev,
    // Dev prefill for server URL (e.g., http://thursday.local:3001)
    devServerUrl: isDev ? expoExtra.DEV_SERVER_URL || null : null,
    // Optional dev prefill for API key
    devApiKey: isDev ? expoExtra.DEV_API_KEY || null : null,
    // Default API base URL for production
    apiBaseUrl: expoExtra.API_BASE_URL || 'https://smartpocket.example.com',
  };
}

// Export convenience accessors
export const envConfig = getEnvConfig();
export const isDevelopment = envConfig.isDev;
export const devServerUrl = envConfig.devServerUrl;
export const devApiKey = envConfig.devApiKey;
