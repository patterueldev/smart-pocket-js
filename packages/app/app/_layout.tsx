import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { SessionProvider, useSession } from '@/hooks/useSession';

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

    const onIndex = segments[0] === 'index' || segments.length === 0;
    const onSetup = segments[0] === 'setup';
    const isConnected = session?.connected;
    
    // Don't interfere with feature routes
    const onFeatureRoute = ['receipt-scan', 'transaction', 'google-sheets-sync'].includes(segments[0]);

    console.log('Navigation guard:', { onIndex, onSetup, isConnected, onFeatureRoute, segments });

    if (onFeatureRoute) {
      // Allow feature routes to work normally
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

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="setup" options={{ headerShown: false, title: 'Setup' }} />
        <Stack.Screen name="index" options={{ headerShown: false, title: 'Dashboard' }} />
        <Stack.Screen name="receipt-scan" options={{ headerShown: true, title: 'Scan Receipt' }} />
        <Stack.Screen name="transaction" options={{ headerShown: true, title: 'Transaction' }} />
        <Stack.Screen name="google-sheets-sync" options={{ headerShown: true, title: 'Google Sheets Sync' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
