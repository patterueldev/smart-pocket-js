import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ServerInfo } from '@/api/generated';

const SESSION_KEY = '@smart_pocket_session';

export interface Session {
  serverUrl: string;
  token: string;
  expiresAt: string;
  serverInfo?: ServerInfo;
  connected: boolean;
  connectedAt: string;
  apiKey?: string;
}

interface SessionContextType {
  session: Session | null;
  loading: boolean;
  saveSession: (session: Session) => Promise<void>;
  clearSession: () => Promise<void>;
  isConnected: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

// Simple event bus to notify external session changes (e.g., forced disconnect)
type Listener = () => void;
const sessionClearedListeners = new Set<Listener>();

export function onSessionCleared(listener: Listener) {
  sessionClearedListeners.add(listener);
  return () => sessionClearedListeners.delete(listener);
}

export function emitSessionCleared() {
  sessionClearedListeners.forEach((l) => {
    try {
      l();
    } catch (err) {
      console.error('SessionCleared listener error:', err);
    }
  });
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Load session on mount
  useEffect(() => {
    loadSession();
  }, []);

  // Subscribe to forced session clear events (e.g., auth expiry)
  useEffect(() => {
    const unsubscribe = onSessionCleared(async () => {
      try {
        await AsyncStorage.removeItem(SESSION_KEY);
        setSession(null);
      } catch (error) {
        console.error('Failed to handle external session clear:', error);
      }
    });
    return unsubscribe;
  }, []);

  const loadSession = async () => {
    try {
      const sessionData = await AsyncStorage.getItem(SESSION_KEY);
      if (!sessionData) {
        return;
      }

      const parsed = JSON.parse(sessionData) as Partial<Session>;

      // Validate required fields; discard if incomplete
      if (!parsed?.serverUrl || !parsed?.token || !parsed?.expiresAt) {
        await AsyncStorage.removeItem(SESSION_KEY);
        return;
      }

      // Normalize legacy sessions that may be missing flags
      const normalizedSession: Session = {
        serverUrl: parsed.serverUrl,
        token: parsed.token,
        expiresAt: parsed.expiresAt,
        serverInfo: parsed.serverInfo,
        connected: parsed.connected ?? true,
        connectedAt: parsed.connectedAt ?? new Date().toISOString(),
        apiKey: parsed.apiKey,
      };

      setSession(normalizedSession);
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

  return (
    <SessionContext.Provider
      value={{
        session,
        loading,
        saveSession,
        clearSession,
        isConnected: !!session?.connected,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
