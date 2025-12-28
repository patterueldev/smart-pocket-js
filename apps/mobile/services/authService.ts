import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  configureHttpClient, 
  clearHttpClientConfig 
} from '../api/httpClient';
import { 
  postApiV1Connect, 
  postApiV1Disconnect,
  type PostApiV1ConnectBody,
  type postApiV1ConnectResponse,
  type ServerInfo
} from '../api/generated';
import { getDeviceId } from './deviceId';

/**
 * Session data stored in AsyncStorage
 */
export interface StoredSession {
  serverUrl: string;
  token: string;
  expiresAt: string;
  serverInfo: ServerInfo;
}

/**
 * Error types for auth operations
 */
export enum AuthErrorType {
  InvalidUrl = 'INVALID_URL',
  NetworkError = 'NETWORK_ERROR',
  InvalidApiKey = 'INVALID_API_KEY',
  ServerError = 'SERVER_ERROR',
  Unknown = 'UNKNOWN',
}

export class AuthError extends Error {
  constructor(
    public type: AuthErrorType,
    public originalError?: Error
  ) {
    super(AuthError.getMessageForType(type));
    this.name = 'AuthError';
  }

  static getMessageForType(type: AuthErrorType): string {
    switch (type) {
      case AuthErrorType.InvalidUrl:
        return 'Invalid server URL. Please check and try again.';
      case AuthErrorType.NetworkError:
        return 'Unable to connect to server. Check your network and URL.';
      case AuthErrorType.InvalidApiKey:
        return 'Invalid API key. Please check and try again.';
      case AuthErrorType.ServerError:
        return 'Server error. Please try again later.';
      case AuthErrorType.Unknown:
        return 'Unknown error occurred. Please try again.';
    }
  }
}

const STORAGE_KEY = '@smart_pocket_session';

/**
 * AuthService handles authentication and session management
 * - Exchanges API key for JWT bearer token
 * - Persists session in secure storage
 * - Manages session expiry
 */
export class AuthService {
  /**
   * Connect to a server using API key
   * @param serverUrl - Base URL of the Smart Pocket server
   * @param apiKey - API key generated on the server
   * @throws AuthError with specific error type
   */
  async connect(serverUrl: string, apiKey: string): Promise<StoredSession> {
    const logContext = {
      timestamp: new Date().toISOString(),
      sessionStart: true,
    };

    try {
      console.log('[authService] ========================================');
      console.log('[authService] CONNECTION ATTEMPT START');
      console.log('[authService] ========================================');
      console.log('[authService] Attempting to connect:', {
        ...logContext,
        serverUrl,
        apiKeyLength: apiKey?.length,
        apiKeyStart: apiKey?.substring(0, 10) + '***',
      });

      // Validate URL format
      if (!this.isValidUrl(serverUrl)) {
        console.error('[authService] Invalid URL format:', serverUrl);
        throw new AuthError(AuthErrorType.InvalidUrl);
      }

      // Normalize URL (remove trailing slash)
      const normalizedUrl = serverUrl.replace(/\/$/, '');
      console.log('[authService] Normalized URL:', {
        original: serverUrl,
        normalized: normalizedUrl,
        hostname: new URL(normalizedUrl).hostname,
        port: new URL(normalizedUrl).port,
        protocol: new URL(normalizedUrl).protocol,
      });

      // Configure HTTP client with baseUrl and apiKey
      configureHttpClient({
        baseUrl: normalizedUrl,
        apiKey: apiKey,
      });

      console.log('[authService] HTTP client configured:', {
        baseUrl: normalizedUrl,
        apiKeySet: !!apiKey,
      });

        // Prepare request body (persisted device id)
        const deviceId = await getDeviceId();

        const requestBody: PostApiV1ConnectBody = {
          deviceInfo: {
            platform: 'mobile', // Could be iOS, Android, web
            appVersion: '1.0.0', // Should come from package.json or Constants
            deviceId,
          },
        };

      console.log('[authService] Request body prepared:', {
        deviceInfo: {
          platform: requestBody.deviceInfo.platform,
          appVersion: requestBody.deviceInfo.appVersion,
          deviceIdLength: deviceId?.length,
        },
      });

      console.log('[authService] Sending connect request to:', normalizedUrl + '/api/v1/connect');

      // Call generated API function
      const response = await postApiV1Connect(requestBody);

      console.log('[authService] API Response received:', {
        status: response.status,
        dataKeys: response.data ? Object.keys(response.data) : null,
        hasToken: !!response.data?.token,
      });

      // Check if it's an error response (401)
      if (response.status === 401) {
        console.error('[authService] Invalid API key (401)');
        throw new AuthError(AuthErrorType.InvalidApiKey);
      }

      // Extract data from successful response
      const connectData = response.data;
      console.log('[authService] Connect data:', {
        hasToken: !!connectData?.token,
        hasServerInfo: !!connectData?.serverInfo,
        expiresIn: connectData?.expiresIn,
      });

      // Create session object
      const expiresAt = new Date(
        Date.now() + connectData.expiresIn * 1000
      ).toISOString();

      const session: StoredSession = {
        serverUrl: normalizedUrl,
        token: connectData.token,
        expiresAt,
        serverInfo: connectData.serverInfo,
      };

      // Store session
      await this.saveSession(session);

      // Update HTTP client with token for future requests
      configureHttpClient({
        baseUrl: normalizedUrl,
        token: connectData.token,
      });

      return session;
    } catch (error) {
      console.error('[authService] ========================================');
      console.error('[authService] CONNECTION FAILED');
      console.error('[authService] ========================================');
      console.error('[authService] Connection error:', error);

      if (error instanceof AuthError) {
        console.error('[authService] AuthError details:', {
          type: error.type,
          message: error.message,
          originalErrorMessage: error.originalError?.message,
        });
        throw error;
      }

      if (error instanceof Error) {
        console.error('[authService] Generic Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });

        // Classify the error
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          console.error('[authService] → Classified as InvalidApiKey');
          throw new AuthError(AuthErrorType.InvalidApiKey, error);
        }

        if (
          error.message.includes('HTTP') ||
          error.message.includes('Network')
        ) {
          console.error('[authService] → Classified as NetworkError');
          console.error('[authService] NETWORK ERROR DETAILS:', {
            message: error.message,
            probable_causes: [
              'Server is not running on the specified host:port',
              'Hostname resolution failed (thursday.local unreachable)',
              'Network connectivity issue',
              'Firewall blocking the connection',
              'Port 3001 not exposed or listening',
            ],
            debugging_steps: [
              '1. Verify server is running: curl http://thursday.local:3001/health',
              '2. Check network connectivity from device/simulator',
              '3. Verify thursday.local resolves correctly',
              '4. Check firewalls and network settings',
            ],
          });
          throw new AuthError(AuthErrorType.NetworkError, error);
        }

        if (error.message.includes('5')) {
          console.error('[authService] → Classified as ServerError');
          throw new AuthError(AuthErrorType.ServerError, error);
        }
      }

      console.error('[authService] → Classified as Unknown error');
      console.error('[authService] Full error object:', error);
      throw new AuthError(AuthErrorType.Unknown, error as Error);
    }
  }

  /**
   * Disconnect from server
   * @param session - Current session (optional, for API call)
   */
  async disconnect(session?: StoredSession): Promise<void> {
    try {
      // Attempt to notify server (best effort)
      if (session) {
        // Configure HTTP client with session details
        configureHttpClient({
          baseUrl: session.serverUrl,
          token: session.token,
        });

        await postApiV1Disconnect().catch(() => {
          // Ignore errors if server is unreachable
        });
      }
    } finally {
      // Always clear local session and HTTP client config
      await AsyncStorage.removeItem(STORAGE_KEY);
      clearHttpClientConfig();
    }
  }

  /**
   * Get stored session if valid
   */
  async getSession(): Promise<StoredSession | null> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return null;
      }

      const session = JSON.parse(stored) as StoredSession;

      // Check if expired
      if (new Date() > new Date(session.expiresAt)) {
        await AsyncStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return session;
    } catch (error) {
      console.error('Error retrieving session:', error);
      return null;
    }
  }

  /**
   * Save session to storage
   */
  private async saveSession(session: StoredSession): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Error saving session:', error);
      throw new Error('Failed to save session');
    }
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      // Allow both http and https
      return /^https?:\/\//.test(url);
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
