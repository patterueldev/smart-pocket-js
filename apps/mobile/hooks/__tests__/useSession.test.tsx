import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Unmock useSession to test the real implementation
jest.unmock('../useSession');

import {
  SessionProvider,
  useSession,
  onSessionCleared,
  emitSessionCleared,
  Session,
} from '../useSession';

jest.mock('@react-native-async-storage/async-storage');

describe('useSession', () => {
  const mockSession: Session = {
    serverUrl: 'http://test.local:3001',
    token: 'test-token',
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    serverInfo: {
      version: '0.1.0',
      features: {
        googleSheetsSync: false,
        aiInsights: true,
      },
      currency: 'USD',
    },
    connected: true,
    connectedAt: new Date().toISOString(),
    apiKey: 'test-api-key',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset AsyncStorage to return null by default
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('SessionProvider', () => {
    it('should load session from storage on mount', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockSession)
      );

      const { result } = renderHook(() => useSession(), {
        wrapper: SessionProvider,
      });

      // Wait for session to load (loading becomes false)
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.session).toEqual(mockSession);
      expect(result.current.isConnected).toBe(true);
    });

    it('should handle no stored session', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => useSession(), {
        wrapper: SessionProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.session).toBeNull();
      expect(result.current.isConnected).toBe(false);
    });

    it('should discard incomplete session data', async () => {
      const incompleteSession = {
        serverUrl: 'http://test.local:3001',
        // Missing token and expiresAt
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(incompleteSession)
      );

      const { result } = renderHook(() => useSession(), {
        wrapper: SessionProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.session).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@smart_pocket_session');
    });

    it('should normalize legacy session data', async () => {
      const legacySession = {
        serverUrl: 'http://test.local:3001',
        token: 'test-token',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        // Missing connected, connectedAt, apiKey
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(legacySession)
      );

      const { result } = renderHook(() => useSession(), {
        wrapper: SessionProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.session).toMatchObject({
        serverUrl: legacySession.serverUrl,
        token: legacySession.token,
        expiresAt: legacySession.expiresAt,
        connected: true, // Normalized
        connectedAt: expect.any(String), // Normalized
      });
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useSession(), {
        wrapper: SessionProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.session).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('saveSession()', () => {
    it('should save session to storage and update state', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useSession(), {
        wrapper: SessionProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.saveSession(mockSession);
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@smart_pocket_session',
        JSON.stringify(mockSession)
      );
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.isConnected).toBe(true);
    });

    it('should throw error if storage fails', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(
        new Error('Storage full')
      );

      const { result } = renderHook(() => useSession(), {
        wrapper: SessionProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.saveSession(mockSession);
        })
      ).rejects.toThrow();
    });
  });

  describe('clearSession()', () => {
    it('should clear session from storage and state', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockSession)
      );
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useSession(), {
        wrapper: SessionProvider,
      });

      await waitFor(() => {
        expect(result.current.session).toEqual(mockSession);
      });

      await act(async () => {
        await result.current.clearSession();
      });

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@smart_pocket_session');
      expect(result.current.session).toBeNull();
      expect(result.current.isConnected).toBe(false);
    });

    it('should throw error if storage fails', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockSession)
      );
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      const { result } = renderHook(() => useSession(), {
        wrapper: SessionProvider,
      });

      await waitFor(() => {
        expect(result.current.session).toEqual(mockSession);
      });

      await expect(
        act(async () => {
          await result.current.clearSession();
        })
      ).rejects.toThrow();
    });
  });

  describe('isConnected', () => {
    it('should return true when session is connected', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockSession)
      );

      const { result } = renderHook(() => useSession(), {
        wrapper: SessionProvider,
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });
    });

    it('should return false when session is not connected', async () => {
      const disconnectedSession = { ...mockSession, connected: false };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(disconnectedSession)
      );

      const { result } = renderHook(() => useSession(), {
        wrapper: SessionProvider,
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(false);
      });
    });

    it('should return false when no session', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => useSession(), {
        wrapper: SessionProvider,
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(false);
      });
    });
  });

  describe('Session Cleared Event Bus', () => {
    it('should clear session when emitSessionCleared is called', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockSession)
      );
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useSession(), {
        wrapper: SessionProvider,
      });

      await waitFor(() => {
        expect(result.current.session).toEqual(mockSession);
      });

      act(() => {
        emitSessionCleared();
      });

      await waitFor(() => {
        expect(result.current.session).toBeNull();
        expect(result.current.isConnected).toBe(false);
      });

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@smart_pocket_session');
    });

    it('should support multiple listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      const unsubscribe1 = onSessionCleared(listener1);
      const unsubscribe2 = onSessionCleared(listener2);

      emitSessionCleared();

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);

      unsubscribe1();
      unsubscribe2();
    });

    it('should allow unsubscribing listeners', () => {
      const listener = jest.fn();

      const unsubscribe = onSessionCleared(listener);

      emitSessionCleared();
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();

      emitSessionCleared();
      expect(listener).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      const goodListener = jest.fn();

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      onSessionCleared(errorListener);
      onSessionCleared(goodListener);

      emitSessionCleared();

      expect(errorListener).toHaveBeenCalled();
      expect(goodListener).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle storage errors during event handling', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockSession)
      );
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useSession(), {
        wrapper: SessionProvider,
      });

      await waitFor(() => {
        expect(result.current.session).toEqual(mockSession);
      });

      act(() => {
        emitSessionCleared();
      });

      // Should still attempt to clear state
      await waitFor(() => {
        expect(result.current.session).toBeNull();
      });

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('useSession hook', () => {
    it('should throw error if used outside SessionProvider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        renderHook(() => useSession());
      }).toThrow('useSession must be used within a SessionProvider');

      consoleSpy.mockRestore();
    });
  });
});
