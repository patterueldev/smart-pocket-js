/**
 * Environment configuration for mobile app
 * Supports multiple app variants: development, qa, production
 * Controls API endpoints, feature flags, and app behavior
 */

import Constants from 'expo-constants';

const isDev = __DEV__ || process.env.NODE_ENV === 'development';

type AppVariant = 'development' | 'qa' | 'production';

interface VariantConfig {
  displayName: string;
  apiEndpoint: string;
  ocrEnabled: boolean;
  debugEnabled: boolean;
}

interface EnvConfig {
  isDev: boolean;
  variant: AppVariant;
  displayName: string;
  apiBaseUrl: string;
  ocrEnabled: boolean;
  debugEnabled: boolean;
  devServerUrl: string | null;
  devApiKey: string | null;
}

/**
 * Detect app variant from environment
 * Priority: EAS env var > bundle ID > default to production
 */
function detectVariant(): AppVariant {
  // EAS Build sets VARIANT env var
  const variant = process.env.VARIANT as AppVariant | undefined;
  if (variant && ['development', 'qa', 'production'].includes(variant)) {
    return variant;
  }

  // Fallback: infer from bundle ID
  const bundleId = Constants.expoConfig?.ios?.bundleIdentifier || 
                  Constants.expoConfig?.android?.package || '';
  
  if (bundleId.includes('.dev')) return 'development';
  if (bundleId.includes('.qa')) return 'qa';
  
  return 'production';
}

/**
 * Get environment configuration
 * Reads from:
 * - Expo Build environment variables (VARIANT)
 * - Expo extra config (app.json - variant-specific configs)
 * - App bundle ID
 * - Hardcoded defaults
 */
export function getEnvConfig(): EnvConfig {
  const expoExtra = Constants.expoConfig?.extra || {};
  const variant = detectVariant();
  const variantConfig = (expoExtra.variants?.[variant] as VariantConfig) || {};

  return {
    isDev,
    variant,
    // Display name from variant config
    displayName: variantConfig.displayName || 'Smart Pocket',
    // API endpoint from variant config
    apiBaseUrl: variantConfig.apiEndpoint || expoExtra.API_BASE_URL || 'https://smartpocket.example.com',
    // OCR feature flag from variant config
    ocrEnabled: variantConfig.ocrEnabled === true || expoExtra.OCR_ENABLED === true,
    // Debug mode from variant config
    debugEnabled: variantConfig.debugEnabled === true,
    // Dev prefill for server URL (for development variant)
    devServerUrl: isDev && variant === 'development' ? expoExtra.DEV_SERVER_URL || null : null,
    // Optional dev prefill for API key
    devApiKey: isDev && variant === 'development' ? expoExtra.DEV_API_KEY || null : null,
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
export const devServerUrl = envConfig.devServerUrl;
export const devApiKey = envConfig.devApiKey;
