import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { StatusBar } from 'expo-status-bar';
import { container, TYPES } from './di/container';
import { ITransactionService } from '@smart-pocket/transaction-service';
import { SetupScreen } from './screens/SetupScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { Transaction } from '@smart-pocket/shared-types';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

/**
 * App Entry Point
 * 
 * Handles:
 * - Session management (connected/not connected)
 * - Navigation structure
 * - DI container initialization
 */
export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  // Get services from DI container
  const transactionService = container.get<ITransactionService>(TYPES.ITransactionService);

  useEffect(() => {
    if (isConnected) {
      loadRecentTransactions();
    }
  }, [isConnected]);

  const loadRecentTransactions = async () => {
    try {
      const txns = await transactionService.getRecentTransactions(5);
      setRecentTransactions(txns);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const handleConnect = async (serverUrl: string, apiKey: string) => {
    setLoading(true);
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // TODO: Real API connection in issue #42
    setIsConnected(true);
    setLoading(false);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setRecentTransactions([]);
  };

  if (!isConnected) {
    return (
      <>
        <StatusBar style="auto" />
        <SetupScreen onConnect={handleConnect} loading={loading} />
      </>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <NavigationContainer>
        <Drawer.Navigator
          initialRouteName="Dashboard"
          screenOptions={{
            headerShown: false,
            drawerPosition: 'left',
          }}
        >
          <Drawer.Screen name="Dashboard">
            {(props) => (
              <DashboardScreen
                {...props}
                recentTransactions={recentTransactions}
                onScanReceipt={() => {
                  // TODO: Navigate to camera screen
                  console.log('Scan Receipt');
                }}
                onManualTransaction={() => {
                  // TODO: Navigate to transaction screen
                  console.log('Manual Transaction');
                }}
                onGoogleSheetsSync={() => {
                  // TODO: Navigate to Google Sheets sync
                  console.log('Google Sheets Sync');
                }}
                onOpenMenu={() => props.navigation.openDrawer()}
                googleSheetsSyncEnabled={false} // TODO: Get from server info
              />
            )}
          </Drawer.Screen>
          
          {/* Drawer content */}
          <Drawer.Screen name="Settings" component={SettingsPlaceholder} />
        </Drawer.Navigator>
      </NavigationContainer>
    </>
  );
}

// Placeholder component for drawer
const SettingsPlaceholder = () => {
  return null;
};
