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
    try {
      // Validate URL format
      if (!this.isValidUrl(serverUrl)) {
        throw new AuthError(AuthErrorType.InvalidUrl);
      }

      // Normalize URL (remove trailing slash)
      const normalizedUrl = serverUrl.replace(/\/$/, '');

      // Configure HTTP client with baseUrl and apiKey
      configureHttpClient({
        baseUrl: normalizedUrl,
        apiKey: apiKey,
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

      // Call generated API function
      const response = await postApiV1Connect(requestBody);

      console.log('API Response:', {
        status: response.status,
        data: response.data,
        headers: response.headers,
      });

      // Check if it's an error response (401)
      if (response.status === 401) {
        throw new AuthError(AuthErrorType.InvalidApiKey);
      }

      // Extract data from successful response
      const connectData = response.data;
      console.log('Connect data:', connectData);

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
      if (error instanceof AuthError) {
        throw error;
      }

      if (error instanceof Error) {
        // Classify the error
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          throw new AuthError(AuthErrorType.InvalidApiKey, error);
        }

        if (
          error.message.includes('HTTP') ||
          error.message.includes('Network')
        ) {
          throw new AuthError(AuthErrorType.NetworkError, error);
        }

        if (error.message.includes('5')) {
          throw new AuthError(AuthErrorType.ServerError, error);
        }
      }

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
