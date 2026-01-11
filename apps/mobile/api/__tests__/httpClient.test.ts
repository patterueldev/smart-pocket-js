import { 
  httpClient, 
  configureHttpClient, 
  clearHttpClientConfig, 
  getHttpClientConfig,
  setTokenRefreshHandler,
  setOnAuthExpired,
  AuthExpiredError,
} from '../httpClient';

// Mock fetch globally
global.fetch = jest.fn();

describe('httpClient', () => {
  const mockBaseUrl = 'http://test.local:3001';
  const mockApiKey = 'test-api-key';
  const mockToken = 'test-token';
  const mockNewToken = 'new-refreshed-token';

  beforeEach(() => {
    jest.clearAllMocks();
    clearHttpClientConfig();
  });

  describe('Configuration Management', () => {
    it('should configure baseUrl, apiKey, and token', () => {
      configureHttpClient({
        baseUrl: mockBaseUrl,
        apiKey: mockApiKey,
        token: mockToken,
      });

      const config = getHttpClientConfig();
      expect(config.baseUrl).toBe(mockBaseUrl);
      expect(config.apiKey).toBe(mockApiKey);
      expect(config.token).toBe(mockToken);
    });

    it('should merge partial config updates', () => {
      configureHttpClient({ baseUrl: mockBaseUrl });
      configureHttpClient({ token: mockToken });

      const config = getHttpClientConfig();
      expect(config.baseUrl).toBe(mockBaseUrl);
      expect(config.token).toBe(mockToken);
    });

    it('should clear all config', () => {
      configureHttpClient({
        baseUrl: mockBaseUrl,
        apiKey: mockApiKey,
        token: mockToken,
      });

      clearHttpClientConfig();

      const config = getHttpClientConfig();
      expect(config.baseUrl).toBeUndefined();
      expect(config.apiKey).toBeUndefined();
      expect(config.token).toBeUndefined();
    });
  });

  describe('Request Headers', () => {
    it('should add X-API-Key header when apiKey is configured', async () => {
      configureHttpClient({
        baseUrl: mockBaseUrl,
        apiKey: mockApiKey,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ success: true }),
      });

      await httpClient('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/test`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Key': mockApiKey,
          }),
        })
      );
    });

    it('should add Authorization Bearer header when token is configured', async () => {
      configureHttpClient({
        baseUrl: mockBaseUrl,
        token: mockToken,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ success: true }),
      });

      await httpClient('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/test`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
          }),
        })
      );
    });

    it('should use default baseUrl if not configured', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ success: true }),
      });

      await httpClient('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/test',
        expect.any(Object)
      );
    });
  });

  describe('Token Refresh on 401', () => {
    it('should attempt token refresh when 401 response received', async () => {
      configureHttpClient({
        baseUrl: mockBaseUrl,
        token: mockToken,
      });

      const mockRefreshHandler = jest.fn().mockResolvedValue(mockNewToken);
      setTokenRefreshHandler(mockRefreshHandler);

      // First call returns 401
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers(),
        json: async () => ({ error: 'token_expired' }),
      });

      // Retry call with new token succeeds
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ success: true }),
      });

      const result = await httpClient('/test');

      expect(mockRefreshHandler).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.status).toBe(200);
      expect(result.data).toEqual({ success: true });
    });

    it('should update global token after successful refresh', async () => {
      configureHttpClient({
        baseUrl: mockBaseUrl,
        token: mockToken,
      });

      const mockRefreshHandler = jest.fn().mockResolvedValue(mockNewToken);
      setTokenRefreshHandler(mockRefreshHandler);

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          headers: new Headers(),
          json: async () => ({ error: 'token_expired' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({ success: true }),
        });

      await httpClient('/test');

      // Second call should use new token
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        `${mockBaseUrl}/test`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockNewToken}`,
          }),
        })
      );

      // Config should be updated
      const config = getHttpClientConfig();
      expect(config.token).toBe(mockNewToken);
    });

    it('should not attempt refresh if skipAuthRefresh is true', async () => {
      configureHttpClient({
        baseUrl: mockBaseUrl,
        token: mockToken,
      });

      const mockRefreshHandler = jest.fn().mockResolvedValue(mockNewToken);
      setTokenRefreshHandler(mockRefreshHandler);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers(),
        json: async () => ({ error: 'token_expired' }),
      });

      await expect(
        httpClient('/test', { skipAuthRefresh: true })
      ).rejects.toThrow();

      expect(mockRefreshHandler).not.toHaveBeenCalled();
    });

    it('should not attempt refresh if no refresh handler registered', async () => {
      configureHttpClient({
        baseUrl: mockBaseUrl,
        token: mockToken,
      });

      // No refresh handler set

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers(),
        json: async () => ({ error: 'token_expired' }),
      });

      await expect(httpClient('/test')).rejects.toThrow();

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw AuthExpiredError when refresh fails', async () => {
      configureHttpClient({
        baseUrl: mockBaseUrl,
        token: mockToken,
      });

      const mockRefreshHandler = jest.fn().mockResolvedValue(null);
      setTokenRefreshHandler(mockRefreshHandler);

      const mockOnAuthExpired = jest.fn();
      setOnAuthExpired(mockOnAuthExpired);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers(),
        json: async () => ({ error: 'token_expired' }),
      });

      await expect(httpClient('/test')).rejects.toThrow(AuthExpiredError);
      expect(mockOnAuthExpired).toHaveBeenCalledTimes(1);
    });

    it('should invoke onAuthExpired callback before throwing AuthExpiredError', async () => {
      configureHttpClient({
        baseUrl: mockBaseUrl,
        token: mockToken,
      });

      const mockRefreshHandler = jest.fn().mockResolvedValue(null);
      setTokenRefreshHandler(mockRefreshHandler);

      const mockOnAuthExpired = jest.fn();
      setOnAuthExpired(mockOnAuthExpired);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers(),
        json: async () => ({ error: 'token_expired' }),
      });

      await expect(httpClient('/test')).rejects.toThrow(AuthExpiredError);
      expect(mockOnAuthExpired).toHaveBeenCalled();
    });
  });

  describe('Single-Flight Token Refresh', () => {
    it('should deduplicate concurrent refresh attempts', async () => {
      configureHttpClient({
        baseUrl: mockBaseUrl,
        token: mockToken,
      });

      const mockRefreshHandler = jest.fn().mockResolvedValue(mockNewToken);
      setTokenRefreshHandler(mockRefreshHandler);

      // Mock 401 responses for both requests
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          headers: new Headers(),
          json: async () => ({ error: 'token_expired' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          headers: new Headers(),
          json: async () => ({ error: 'token_expired' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({ success: 1 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({ success: 2 }),
        });

      // Fire two concurrent requests
      const [result1, result2] = await Promise.all([
        httpClient('/test1'),
        httpClient('/test2'),
      ]);

      // Refresh handler should only be called once
      expect(mockRefreshHandler).toHaveBeenCalledTimes(1);
      expect(result1.status).toBe(200);
      expect(result2.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for non-401 HTTP errors', async () => {
      configureHttpClient({
        baseUrl: mockBaseUrl,
        token: mockToken,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers(),
        json: async () => ({ error: 'server_error' }),
      });

      await expect(httpClient('/test')).rejects.toThrow('HTTP 500');
    });

    it('should handle network errors', async () => {
      configureHttpClient({
        baseUrl: mockBaseUrl,
        token: mockToken,
      });

      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new TypeError('Network request failed')
      );

      await expect(httpClient('/test')).rejects.toThrow('Network request failed');
    });

    it('should handle non-JSON responses', async () => {
      configureHttpClient({
        baseUrl: mockBaseUrl,
        token: mockToken,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => 'Plain text response',
        json: async () => {
          throw new Error('Not JSON');
        },
      });

      const result = await httpClient('/test');
      expect(result.data).toBe('Plain text response');
    });

    it('should not invoke onAuthExpired if it throws', async () => {
      configureHttpClient({
        baseUrl: mockBaseUrl,
        token: mockToken,
      });

      const mockRefreshHandler = jest.fn().mockResolvedValue(null);
      setTokenRefreshHandler(mockRefreshHandler);

      const mockOnAuthExpired = jest.fn(() => {
        throw new Error('Callback error');
      });
      setOnAuthExpired(mockOnAuthExpired);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers(),
        json: async () => ({ error: 'token_expired' }),
      });

      // Should still throw AuthExpiredError, not callback error
      await expect(httpClient('/test')).rejects.toThrow(AuthExpiredError);
      expect(mockOnAuthExpired).toHaveBeenCalled();
    });
  });

  describe('AuthExpiredError', () => {
    it('should have correct properties', () => {
      const error = new AuthExpiredError();
      expect(error.name).toBe('AuthExpiredError');
      expect(error.status).toBe(401);
      expect(error.code).toBe('AUTH_EXPIRED');
      expect(error.message).toBe('Session expired. Please reconnect.');
    });

    it('should accept custom message', () => {
      const error = new AuthExpiredError('Custom message');
      expect(error.message).toBe('Custom message');
    });
  });
});
