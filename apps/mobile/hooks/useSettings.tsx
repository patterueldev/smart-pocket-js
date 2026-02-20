import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  AccountTypes,
  AccountMappings,
} from '@smart-pocket/shared-types';

const SETTINGS_KEY = '@smart_pocket_settings';

export interface Settings {
  accountTypes: AccountTypes;
}

interface SettingsContextType {
  settings: Settings | null;
  loading: boolean;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const settingsData = await AsyncStorage.getItem(SETTINGS_KEY);
      if (!settingsData) {
        const defaultSettings: Settings = {
          accountTypes: {},
        };
        setSettings(defaultSettings);
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
        return;
      }

      const parsed = JSON.parse(settingsData) as Partial<Settings>;

      const normalizedSettings: Settings = {
        accountTypes: parsed.accountTypes || {},
      };

      setSettings(normalizedSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
      const defaultSettings: Settings = {
        accountTypes: {},
      };
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<Settings>) => {
    try {
      const updatedSettings: Settings = {
        accountTypes: settings?.accountTypes || {},
        ...newSettings,
      };

      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  };

  const refreshSettings = async () => {
    setLoading(true);
    await loadSettings();
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        updateSettings,
        refreshSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
