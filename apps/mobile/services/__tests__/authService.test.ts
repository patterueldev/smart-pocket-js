import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, AuthError, AuthErrorType } from '../authService';
import * as httpClient from '../../api/httpClient';
import * as generated from '../../api/generated';
import * as features from '../../config/features';
import * as useSession from '../../hooks/useSession';
import * as deviceIdModule from '../deviceId';

// Mock all dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../api/httpClient');
jest.mock('../../api/generated');
jest.mock('../../config/features');
jest.mock('../../hooks/useSession', () => ({
  emitSessionCleared: jest.fn(),
  onSessionCleared: jest.fn(),
}));
jest.mock('../deviceId');

describe('AuthService', () => {
  const mockServerUrl = 'http://test.local:3001';
  const mockApiKey = 'test-api-key';
  const mockToken = 'test-jwt-token';
  const mockDeviceId = 'test-device-id';
  const mockServerInfo = {
    version: '0.1.0',
    features: {
      googleSheetsSync: false,
      aiInsights: true,
    },
    currency: 'USD',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (deviceIdModule.getDeviceId as jest.Mock).mockResolvedValue(mockDeviceId);
    (features.isAuthRefreshEnabled as jest.Mock).mockReturnValue(true);
  });

  describe('connect()', () => {
    it('should successfully connect with valid credentials', async () => {
      const mockExpiresIn = 2592000; // 30 days

      (generated.postApiV1Connect as jest.Mock).mockResolvedValue({
        status: 200,
        data: {
          token: mockToken,
          expiresIn: mockExpiresIn,
          serverInfo: mockServerInfo,
        },
      });

      const session = await authService.connect(mockServerUrl, mockApiKey);

      expect(session.serverUrl).toBe(mockServerUrl);
      expect(session.token).toBe(mockToken);
      expect(session.apiKey).toBe(mockApiKey);
      expect(session.serverInfo).toEqual(mockServerInfo);
      expect(new Date(session.expiresAt).getTime()).toBeGreaterThan(Date.now());

      expect(httpClient.configureHttpClient).toHaveBeenCalledWith({
        baseUrl: mockServerUrl,
        apiKey: mockApiKey,
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@smart_pocket_session',
        expect.stringContaining(mockToken)
      );
    });

    it('should normalize serverUrl by removing trailing slash', async () => {
      (generated.postApiV1Connect as jest.Mock).mockResolvedValue({
        status: 200,
        data: {
          token: mockToken,
          expiresIn: 2592000,
          serverInfo: mockServerInfo,
        },
      });

      await authService.connect('http://test.local:3001/', mockApiKey);

      expect(httpClient.configureHttpClient).toHaveBeenCalledWith({
        baseUrl: 'http://test.local:3001',
        apiKey: mockApiKey,
      });
    });

    it('should throw InvalidUrl error for invalid URL format', async () => {
      await expect(
        authService.connect('invalid-url', mockApiKey)
      ).rejects.toThrow(AuthError);

      await expect(
        authService.connect('invalid-url', mockApiKey)
      ).rejects.toMatchObject({
        type: AuthErrorType.InvalidUrl,
        message: expect.stringContaining('Invalid server URL'),
      });
    });

    it('should throw NetworkError for network failures', async () => {
      (generated.postApiV1Connect as jest.Mock).mockRejectedValue(
        new Error('Network request failed')
      );

      await expect(
        authService.connect(mockServerUrl, mockApiKey)
      ).rejects.toMatchObject({
        type: AuthErrorType.NetworkError,
      });
    });

    it('should throw InvalidApiKey error for 401 response', async () => {
      (generated.postApiV1Connect as jest.Mock).mockResolvedValue({
        status: 401,
        data: { error: 'invalid_api_key' },
      });

      await expect(
        authService.connect(mockServerUrl, mockApiKey)
      ).rejects.toMatchObject({
        type: AuthErrorType.InvalidApiKey,
      });
    });

    it('should throw ServerError for 500 response', async () => {
      (generated.postApiV1Connect as jest.Mock).mockRejectedValue(
        new Error('500: Internal Server Error')
      );

      await expect(
        authService.connect(mockServerUrl, mockApiKey)
      ).rejects.toMatchObject({
        type: AuthErrorType.ServerError,
      });
    });

    it('should use server-provided expiresIn for session TTL', async () => {
      const mockExpiresIn = 3600; // 1 hour

      (generated.postApiV1Connect as jest.Mock).mockResolvedValue({
        status: 200,
        data: {
          token: mockToken,
          expiresIn: mockExpiresIn,
          serverInfo: mockServerInfo,
        },
      });

      const now = Date.now();
      const session = await authService.connect(mockServerUrl, mockApiKey);

      const expiresAtTime = new Date(session.expiresAt).getTime();
      const expectedExpiry = now + mockExpiresIn * 1000;

      // Allow 1 second tolerance for test execution time
      expect(Math.abs(expiresAtTime - expectedExpiry)).toBeLessThan(1000);
    });

    it('should fall back to 30 days if expiresIn is invalid', async () => {
      (generated.postApiV1Connect as jest.Mock).mockResolvedValue({
        status: 200,
        data: {
          token: mockToken,
          expiresIn: -1, // Invalid
          serverInfo: mockServerInfo,
        },
      });

      const now = Date.now();
      const session = await authService.connect(mockServerUrl, mockApiKey);

      const expiresAtTime = new Date(session.expiresAt).getTime();
      const expectedExpiry = now + 30 * 24 * 60 * 60 * 1000;

      expect(Math.abs(expiresAtTime - expectedExpiry)).toBeLessThan(1000);
    });

    it('should register token refresh handler when AUTH_REFRESH_ENABLED is true', async () => {
      (features.isAuthRefreshEnabled as jest.Mock).mockReturnValue(true);
      (generated.postApiV1Connect as jest.Mock).mockResolvedValue({
        status: 200,
        data: {
          token: mockToken,
          expiresIn: 2592000,
          serverInfo: mockServerInfo,
        },
      });

      await authService.connect(mockServerUrl, mockApiKey);

      expect(httpClient.setTokenRefreshHandler).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    it('should not register refresh handler when AUTH_REFRESH_ENABLED is false', async () => {
      (features.isAuthRefreshEnabled as jest.Mock).mockReturnValue(false);
      (generated.postApiV1Connect as jest.Mock).mockResolvedValue({
        status: 200,
        data: {
          token: mockToken,
          expiresIn: 2592000,
          serverInfo: mockServerInfo,
        },
      });

      await authService.connect(mockServerUrl, mockApiKey);

      expect(httpClient.setTokenRefreshHandler).toHaveBeenCalledWith(undefined);
    });

    it('should register onAuthExpired callback', async () => {
      (generated.postApiV1Connect as jest.Mock).mockResolvedValue({
        status: 200,
        data: {
          token: mockToken,
          expiresIn: 2592000,
          serverInfo: mockServerInfo,
        },
      });

      await authService.connect(mockServerUrl, mockApiKey);

      expect(httpClient.setOnAuthExpired).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    it('should send device info in connect request', async () => {
      (generated.postApiV1Connect as jest.Mock).mockResolvedValue({
        status: 200,
        data: {
          token: mockToken,
          expiresIn: 2592000,
          serverInfo: mockServerInfo,
        },
      });

      await authService.connect(mockServerUrl, mockApiKey);

      expect(generated.postApiV1Connect).toHaveBeenCalledWith({
        deviceInfo: {
          platform: 'mobile',
          appVersion: '1.0.0',
          deviceId: mockDeviceId,
        },
      });
    });
  });

  describe('disconnect()', () => {
    const mockSession = {
      serverUrl: mockServerUrl,
      token: mockToken,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      serverInfo: mockServerInfo,
      apiKey: mockApiKey,
    };

    it('should call server disconnect endpoint if session provided', async () => {
      (generated.postApiV1Disconnect as jest.Mock).mockResolvedValue({
        status: 200,
        data: { success: true },
      });

      await authService.disconnect(mockSession);

      expect(httpClient.configureHttpClient).toHaveBeenCalledWith({
        baseUrl: mockServerUrl,
        token: mockToken,
      });
      expect(generated.postApiV1Disconnect).toHaveBeenCalled();
    });

    it('should clear local session even if server call fails', async () => {
      (generated.postApiV1Disconnect as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await authService.disconnect(mockSession);

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@smart_pocket_session');
      expect(httpClient.clearHttpClientConfig).toHaveBeenCalled();
      expect(useSession.emitSessionCleared).toHaveBeenCalled();
    });

    it('should clear local session without server call if no session provided', async () => {
      await authService.disconnect();

      expect(generated.postApiV1Disconnect).not.toHaveBeenCalled();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@smart_pocket_session');
      expect(httpClient.clearHttpClientConfig).toHaveBeenCalled();
    });

    it('should clear token refresh handler and onAuthExpired callback', async () => {
      await authService.disconnect(mockSession);

      expect(httpClient.setTokenRefreshHandler).toHaveBeenCalledWith(undefined);
      expect(httpClient.setOnAuthExpired).toHaveBeenCalledWith(undefined);
    });

    it('should emit session cleared event', async () => {
      await authService.disconnect(mockSession);

      expect(useSession.emitSessionCleared).toHaveBeenCalled();
    });
  });

  describe('forceDisconnect()', () => {
    it('should clear session without calling server', async () => {
      await authService.forceDisconnect();

      expect(generated.postApiV1Disconnect).not.toHaveBeenCalled();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@smart_pocket_session');
      expect(httpClient.clearHttpClientConfig).toHaveBeenCalled();
    });

    it('should clear handlers and emit session cleared', async () => {
      await authService.forceDisconnect();

      expect(httpClient.setTokenRefreshHandler).toHaveBeenCalledWith(undefined);
      expect(httpClient.setOnAuthExpired).toHaveBeenCalledWith(undefined);
      expect(useSession.emitSessionCleared).toHaveBeenCalled();
    });
  });

  describe('getSession()', () => {
    it('should return stored session if valid', async () => {
      const mockSession = {
        serverUrl: mockServerUrl,
        token: mockToken,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        serverInfo: mockServerInfo,
        apiKey: mockApiKey,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockSession)
      );

      const session = await authService.getSession();

      expect(session).toEqual(mockSession);
      expect(httpClient.configureHttpClient).toHaveBeenCalledWith({
        baseUrl: mockServerUrl,
        token: mockToken,
        apiKey: mockApiKey,
      });
    });

    it('should return null if no session stored', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const session = await authService.getSession();

      expect(session).toBeNull();
    });

    it('should return null and clear storage if session expired', async () => {
      const expiredSession = {
        serverUrl: mockServerUrl,
        token: mockToken,
        expiresAt: new Date(Date.now() - 86400000).toISOString(), // Expired
        serverInfo: mockServerInfo,
        apiKey: mockApiKey,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(expiredSession)
      );

      const session = await authService.getSession();

      expect(session).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@smart_pocket_session');
    });

    it('should register handlers when returning valid session', async () => {
      const mockSession = {
        serverUrl: mockServerUrl,
        token: mockToken,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        serverInfo: mockServerInfo,
        apiKey: mockApiKey,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockSession)
      );
      (features.isAuthRefreshEnabled as jest.Mock).mockReturnValue(true);

      await authService.getSession();

      expect(httpClient.setTokenRefreshHandler).toHaveBeenCalledWith(
        expect.any(Function)
      );
      expect(httpClient.setOnAuthExpired).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });
  });

  describe('refreshSessionFromStorage()', () => {
    it('should refresh token using stored credentials', async () => {
      const mockSession = {
        serverUrl: mockServerUrl,
        token: mockToken,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        serverInfo: mockServerInfo,
        apiKey: mockApiKey,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockSession)
      );

      const mockNewToken = 'new-token';
      (generated.postApiV1Connect as jest.Mock).mockResolvedValue({
        status: 200,
        data: {
          token: mockNewToken,
          expiresIn: 2592000,
          serverInfo: mockServerInfo,
        },
      });

      const newToken = await authService.refreshSessionFromStorage();

      expect(newToken).toBe(mockNewToken);
      expect(generated.postApiV1Connect).toHaveBeenCalledWith({
        deviceInfo: expect.any(Object),
      });
    });

    it('should return null if no stored session', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const newToken = await authService.refreshSessionFromStorage();

      expect(newToken).toBeNull();
    });

    it('should return null if stored session missing apiKey', async () => {
      const mockSession = {
        serverUrl: mockServerUrl,
        token: mockToken,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        serverInfo: mockServerInfo,
        // apiKey missing
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockSession)
      );

      const newToken = await authService.refreshSessionFromStorage();

      expect(newToken).toBeNull();
    });

    it('should return null and log error if refresh fails', async () => {
      const mockSession = {
        serverUrl: mockServerUrl,
        token: mockToken,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        serverInfo: mockServerInfo,
        apiKey: mockApiKey,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockSession)
      );
      (generated.postApiV1Connect as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const newToken = await authService.refreshSessionFromStorage();

      expect(newToken).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should include expired sessions when fetching for refresh', async () => {
      const expiredSession = {
        serverUrl: mockServerUrl,
        token: mockToken,
        expiresAt: new Date(Date.now() - 86400000).toISOString(), // Expired
        serverInfo: mockServerInfo,
        apiKey: mockApiKey,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(expiredSession)
      );

      const mockNewToken = 'new-token';
      (generated.postApiV1Connect as jest.Mock).mockResolvedValue({
        status: 200,
        data: {
          token: mockNewToken,
          expiresIn: 2592000,
          serverInfo: mockServerInfo,
        },
      });

      const newToken = await authService.refreshSessionFromStorage();

      // Should attempt refresh even with expired session
      expect(newToken).toBe(mockNewToken);
    });
  });

  describe('AuthError', () => {
    it('should create error with correct type and message', () => {
      const error = new AuthError(AuthErrorType.NetworkError);

      expect(error.type).toBe(AuthErrorType.NetworkError);
      expect(error.message).toContain('connect to server');
      expect(error.name).toBe('AuthError');
    });

    it('should store original error if provided', () => {
      const originalError = new Error('Original');
      const error = new AuthError(AuthErrorType.ServerError, originalError);

      expect(error.originalError).toBe(originalError);
    });

    it('should provide correct messages for all error types', () => {
      expect(
        AuthError.getMessageForType(AuthErrorType.InvalidUrl)
      ).toContain('Invalid server URL');

      expect(
        AuthError.getMessageForType(AuthErrorType.NetworkError)
      ).toContain('Unable to connect');

      expect(
        AuthError.getMessageForType(AuthErrorType.InvalidApiKey)
      ).toContain('Invalid API key');

      expect(
        AuthError.getMessageForType(AuthErrorType.ServerError)
      ).toContain('Server error');

      expect(
        AuthError.getMessageForType(AuthErrorType.SessionExpired)
      ).toContain('Session expired');

      expect(
        AuthError.getMessageForType(AuthErrorType.Unknown)
      ).toContain('Unknown error');
    });
  });
});
