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
 * - API endpoints loaded from .env.{variant} files
 * - Different feature flags
 * 
 * NOTE: Expo automatically loads .env.{NODE_ENV} files before app.config.js runs.
 * We manually load the correct .env.{APP_VARIANT} file below.
 */

const path = require('path');

// App version and build number
// NOTE: CHANGE THESE TO MATCH root package.json WHEN UPDATING RELEASES
const VERSION = '0.1.1';
const BUILD_NUMBER = 3;

// Determine which .env file to load based on APP_VARIANT
const APP_VARIANT = process.env.APP_VARIANT || 'development';

// Load variant-specific .env file if it exists (optional for local dev)
const fs = require('fs');
const envFilePath = path.resolve(__dirname, `.env.${APP_VARIANT}`);
if (fs.existsSync(envFilePath)) {
  require('dotenv').config({
    path: envFilePath,
    override: true,
  });
  console.log(`✅ Loaded .env.${APP_VARIANT}`);
} else {
  console.log(`ℹ️  .env.${APP_VARIANT} not found - using process.env variables`);
}

console.log('🔧 app.config.js - Loading environment:');
console.log('   APP_VARIANT:', APP_VARIANT);
console.log('   PREFILLED_API_BASEURL:', process.env.PREFILLED_API_BASEURL);
console.log('   PREFILLED_API_KEY:', process.env.PREFILLED_API_KEY ? '***' : '(empty)');

const IS_DEV = APP_VARIANT === 'development';
const IS_QA = APP_VARIANT === 'quality';
const IS_PROD = APP_VARIANT === 'production';

/**
 * Variant configurations
 * API endpoints are loaded from .env.{variant} files via dotenv
 */
const variants = {
  development: {
    name: 'Smart Pocket (Dev)',
    bundleIdentifier: 'io.patterueldev.smartpocket.development',
    package: 'io.patterueldev.smartpocket.development',
    ocrEnabled: false,
    debugEnabled: true,
  },
  quality: {
    name: 'Smart Pocket (QA)',
    bundleIdentifier: 'io.patterueldev.smartpocket.quality',
    package: 'io.patterueldev.smartpocket.quality',
    ocrEnabled: false,
    debugEnabled: true,
  },
  production: {
    name: 'Smart Pocket',
    bundleIdentifier: 'io.patterueldev.smartpocket',
    package: 'io.patterueldev.smartpocket',
    ocrEnabled: false,
    debugEnabled: false,
  },
};

const currentVariant = variants[APP_VARIANT];

console.log('📦 Version:', VERSION, '| Build:', BUILD_NUMBER);

module.exports = {
  expo: {
    name: currentVariant.name,
    slug: 'smart-pocket',
    version: VERSION,
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'smartpocket',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    
    ios: {
      supportsTablet: true,
      bundleIdentifier: currentVariant.bundleIdentifier,
      buildNumber: String(BUILD_NUMBER),
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
      versionCode: BUILD_NUMBER,
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
            enableProguardInReleaseBuilds: true,
            enableShrinkResourcesInReleaseBuilds: false,
          },
        },
      ],
    ],
    
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    
    extra: {
      // EAS Project ID
      eas: {
        projectId: 'a1e89f9a-d846-4bf1-a569-2d01ccae3f61',
      },
      
      // Current variant configuration
      APP_VARIANT: APP_VARIANT,
      // Prefilled base URL from .env.{variant} or GitHub Secrets (optional)
      // App uses this to prefill setup screen - user can customize on connect
      PREFILLED_API_BASEURL: process.env.PREFILLED_API_BASEURL || '',
      OCR_ENABLED: currentVariant.ocrEnabled,
      DEBUG_ENABLED: currentVariant.debugEnabled,
      
      // Prefilled values from GitHub Secrets (optional - injected at build time)
      PREFILLED_API_KEY: process.env.PREFILLED_API_KEY || '',
      
      // All variant configs (for debugging/info screens)
      variants: variants,
    },
  },
};
