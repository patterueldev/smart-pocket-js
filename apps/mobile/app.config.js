/**
 * Smart Pocket - App Configuration
 * Supports multiple build variants: development, quality, production
 * 
 * Variants are determined by APP_VARIANT environment variable:
 * - development: Local development builds
 * - quality: QA/testing builds
 * - production: Production releases
 * 
 * Each variant has:
 * - Different bundle identifier (can install all variants simultaneously)
 * - Different display name (distinguish in app drawer)
 * - Different default API endpoints
 * - Different feature flags
 */

const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_QA = process.env.APP_VARIANT === 'quality';
const IS_PROD = process.env.APP_VARIANT === 'production';

// Default to development if no variant specified
const APP_VARIANT = process.env.APP_VARIANT || 'development';

/**
 * Variant configurations
 */
const variants = {
  development: {
    name: 'Smart Pocket (Dev)',
    bundleIdentifier: 'io.patterueldev.smartpocket.development',
    package: 'io.patterueldev.smartpocket.development',
    apiEndpoint: 'http://thursday.local:3001',
    ocrEnabled: false,
    debugEnabled: true,
  },
  quality: {
    name: 'Smart Pocket (QA)',
    bundleIdentifier: 'io.patterueldev.smartpocket.quality',
    package: 'io.patterueldev.smartpocket.quality',
    apiEndpoint: 'http://localhost:3002',
    ocrEnabled: false,
    debugEnabled: true,
  },
  production: {
    name: 'Smart Pocket',
    bundleIdentifier: 'io.patterueldev.smartpocket',
    package: 'io.patterueldev.smartpocket',
    apiEndpoint: 'https://smartpocket.example.com',
    ocrEnabled: false,
    debugEnabled: false,
  },
};

const currentVariant = variants[APP_VARIANT];

module.exports = {
  expo: {
    name: currentVariant.name,
    slug: 'smart-pocket',
    version: '0.1.1',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'smartpocket',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    
    ios: {
      supportsTablet: true,
      bundleIdentifier: currentVariant.bundleIdentifier,
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
          NSExceptionDomains: {
            'thursday.local': {
              NSTemporaryExceptionAllowsInsecureHTTPLoads: true,
              NSTemporaryExceptionMinimumTLSVersion: 'TLSv1.0',
              NSTemporaryExceptionRequiresForwardSecrecy: false,
            },
          },
        },
      },
    },
    
    android: {
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: currentVariant.package,
    },
    
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
          dark: {
            backgroundColor: '#000000',
          },
        },
      ],
      [
        'expo-build-properties',
        {
          android: {
            usesCleartextTraffic: true,
          },
        },
      ],
    ],
    
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    
    extra: {
      // Legacy dev environment variables (for backward compatibility)
      DEV_SERVER_URL: 'http://thursday.local:3001',
      DEV_API_KEY: 'dev_api_key_change_me',
      
      // Current variant configuration
      APP_VARIANT: APP_VARIANT,
      API_ENDPOINT: currentVariant.apiEndpoint,
      OCR_ENABLED: currentVariant.ocrEnabled,
      DEBUG_ENABLED: currentVariant.debugEnabled,
      
      // All variant configs (for debugging/info screens)
      variants: variants,
    },
  },
};
