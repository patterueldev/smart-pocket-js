/**
 * Environment configuration for mobile app
 * Supports multiple app variants: development, quality, production
 * Controls API endpoints, feature flags, and app behavior
 */

import Constants from 'expo-constants';

const isDev = __DEV__ || process.env.NODE_ENV === 'development';

type AppVariant = 'development' | 'quality' | 'production';

interface EnvConfig {
  isDev: boolean;
  variant: AppVariant;
  displayName: string;
  apiBaseUrl: string;
  ocrEnabled: boolean;
  debugEnabled: boolean;
  prefilledApiBaseUrl: string;
  prefilledApiKey: string;
}

/**
 * Detect app variant from environment
 * Priority: APP_VARIANT env var > bundle ID > default to production
 */
function detectVariant(): AppVariant {
  const expoExtra = Constants.expoConfig?.extra || {};
  
  // Primary: APP_VARIANT from eas.json env
  const variant = expoExtra.APP_VARIANT as AppVariant | undefined;
  if (variant && ['development', 'quality', 'production'].includes(variant)) {
    return variant;
  }

  // Fallback: infer from bundle ID
  const bundleId = Constants.expoConfig?.ios?.bundleIdentifier || 
                  Constants.expoConfig?.android?.package || '';
  
  if (bundleId.includes('.development')) return 'development';
  if (bundleId.includes('.quality')) return 'quality';
  
  return 'production';
}

/**
 * Get environment configuration
 * Reads from:
 * - Expo app.config.js (APP_VARIANT, API_ENDPOINT, etc.)
 * - App bundle ID
 * - Hardcoded defaults
 */
export function getEnvConfig(): EnvConfig {
  const expoExtra = Constants.expoConfig?.extra || {};
  const variant = detectVariant();

  return {
    isDev,
    variant,
    displayName: Constants.expoConfig?.name || 'Smart Pocket',
    // Use API_ENDPOINT from app.config.js (variant-specific)
    apiBaseUrl: expoExtra.API_ENDPOINT || 'https://smartpocket.example.com',
    ocrEnabled: expoExtra.OCR_ENABLED === true || expoExtra.OCR_ENABLED === 'true',
    debugEnabled: expoExtra.DEBUG_ENABLED === true || expoExtra.DEBUG_ENABLED === 'true',
    // Prefilled values from GitHub Secrets (injected at build time)
    prefilledApiBaseUrl: expoExtra.PREFILLED_API_BASEURL || '',
    prefilledApiKey: expoExtra.PREFILLED_API_KEY || '',
  };
}

// Export convenience accessors
export const envConfig = getEnvConfig();
export const variant = envConfig.variant;
export const displayName = envConfig.displayName;
export const apiBaseUrl = envConfig.apiBaseUrl;
export const ocrEnabled = envConfig.ocrEnabled;
export const debugEnabled = envConfig.debugEnabled;
export const isDevelopment = envConfig.isDev;
export const prefilledApiBaseUrl = envConfig.prefilledApiBaseUrl;
export const prefilledApiKey = envConfig.prefilledApiKey;
