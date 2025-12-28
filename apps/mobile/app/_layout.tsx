import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { SessionProvider, useSession } from '@/hooks/useSession';
import { ocrEnabled } from '@/config/env';

export const unstable_settings = {
  initialRouteName: 'setup',
};

export default function RootLayout() {
  return (
    <SessionProvider>
      <RootLayoutNav />
    </SessionProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { session, loading } = useSession();
  const router = useRouter();
  const segments = useSegments();

  // Handle navigation based on session state
  useEffect(() => {
    if (loading) return; // Wait for session to load

    const currentSegment = (segments[0] as string | undefined) ?? '';
    const onIndex = !segments.length || currentSegment === 'index';
    const onSetup = segments.length > 0 && currentSegment === 'setup';
    const isConnected = session?.connected;
    
    // Don't interfere with feature routes
    const featureRoutes = ['transaction', 'google-sheets-sync'];
    if (ocrEnabled) {
      featureRoutes.push('receipt-scan');
    }

    const onFeatureRoute = featureRoutes.includes(currentSegment);

    console.log('Navigation guard:', { onIndex, onSetup, isConnected, onFeatureRoute, segments });

    if (currentSegment === 'receipt-scan' && !ocrEnabled) {
      router.replace('/');
      return;
    }

    if (onFeatureRoute) {
      return;
    }

    if (!isConnected && !onSetup) {
      // User is not connected but trying to access other routes, redirect to setup
      console.log('Redirecting to setup (not connected)');
      router.replace('/setup');
    } else if (isConnected && onSetup) {
      // User is connected but on setup screen, redirect to dashboard
      console.log('Redirecting to dashboard (connected)');
      router.replace('/');
    }
  }, [session, loading, segments, router]);

  const headerBackground = '#1F1F1F';

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: headerBackground }}
      edges={['top', 'left', 'right']}
    >
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerShadowVisible: false,
            headerStyle: {
            backgroundColor: headerBackground,
          },
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
            color: '#fff',
          },
          contentStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#fff',
          headerLeft: ({ tintColor, canGoBack }) => {
            if (!canGoBack) return null;
            return (
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.5 : 1,
                  paddingLeft: 10,
                  paddingRight: 10,
                })}
              >
                <Ionicons
                  name="arrow-back"
                  size={28}
                  color="#fff"
                />
              </Pressable>
            );
          },
          headerBackVisible: false,
        }}
      >
        <Stack.Screen name="setup" options={{ headerShown: false, title: 'Setup' }} />
        <Stack.Screen name="index" options={{ headerShown: false, title: 'Dashboard' }} />
        {ocrEnabled ? (
          <Stack.Screen name="receipt-scan" options={{ headerShown: true, title: 'Scan Receipt' }} />
        ) : null}
        <Stack.Screen name="transaction" options={{ headerShown: true, title: 'Transaction' }} />
        <Stack.Screen name="google-sheets-sync" options={{ headerShown: true, title: 'Google Sheets Sync' }} />
      </Stack>
      <StatusBar style="light" backgroundColor={headerBackground} />
      </ThemeProvider>
    </SafeAreaView>
  );
}
