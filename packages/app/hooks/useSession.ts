import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@smart_pocket_session';

export interface Session {
  serverUrl: string;
  apiKey: string;
  connected: boolean;
  connectedAt: string;
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Load session on mount
  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const sessionData = await AsyncStorage.getItem(SESSION_KEY);
      if (sessionData) {
        setSession(JSON.parse(sessionData));
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSession = async (newSession: Session) => {
    try {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
      setSession(newSession);
    } catch (error) {
      console.error('Failed to save session:', error);
      throw error;
    }
  };

  const clearSession = async () => {
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
      setSession(null);
    } catch (error) {
      console.error('Failed to clear session:', error);
      throw error;
    }
  };

  return {
    session,
    loading,
    saveSession,
    clearSession,
    isConnected: !!session?.connected,
  };
}
