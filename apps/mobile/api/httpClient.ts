/**
 * Custom HTTP client for orval-generated API calls.
 * Handles:
 * - Dynamic base URL injection via global config
 * - API Key header for /connect endpoint
 * - Bearer token injection for authenticated requests
 * - Error handling and response parsing
 */

// Global configuration for dynamic baseUrl and auth
let globalConfig: {
  baseUrl?: string;
  apiKey?: string;
  token?: string;
} = {};

type TokenRefreshHandler = () => Promise<string | null>;

let tokenRefreshHandler: TokenRefreshHandler | undefined;
let refreshPromise: Promise<string | null> | null = null;
type AuthExpiredCallback = () => void;
let onAuthExpired: AuthExpiredCallback | undefined;

export class AuthExpiredError extends Error {
  status = 401;
  code = 'AUTH_EXPIRED';

  constructor(message = 'Session expired. Please reconnect.') {
    super(message);
    this.name = 'AuthExpiredError';
  }
}

/**
 * Configure the HTTP client with dynamic settings
 * Call this before making API requests to set baseUrl and auth
 */
export function configureHttpClient(config: {
  baseUrl?: string;
  apiKey?: string;
  token?: string;
}) {
  globalConfig = { ...globalConfig, ...config };
}

/**
 * Register a token refresh handler. Returns new token or null.
 */
export function setTokenRefreshHandler(handler?: TokenRefreshHandler) {
  tokenRefreshHandler = handler;
}

/**
 * Register a callback invoked when auth is expired and refresh fails/disabled.
 */
export function setOnAuthExpired(callback?: AuthExpiredCallback) {
  onAuthExpired = callback;
}

/**
 * Get current HTTP client configuration
 */
export function getHttpClientConfig() {
  return { ...globalConfig };
}

/**
 * Clear HTTP client configuration (useful for disconnect)
 */
export function clearHttpClientConfig() {
  globalConfig = {};
  tokenRefreshHandler = undefined;
  refreshPromise = null;
}

/**
 * Custom HTTP client that orval uses for all API calls
 * Signature matches orval's fetch client mutator: (url, options)
 */
const refreshAuthToken = async (): Promise<string | null> => {
  if (!tokenRefreshHandler) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = tokenRefreshHandler()
      .catch((error) => {
        console.error('[httpClient] Token refresh failed:', error);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

type HttpClientOptions = RequestInit & {
  apiKey?: string;
  token?: string;
  skipAuthRefresh?: boolean;
};

const performRequest = async (
  finalUrl: string,
  options: HttpClientOptions,
  headers: Record<string, string>
) => {
  console.log('[httpClient] Request details:', {
    timestamp: new Date().toISOString(),
    finalUrl,
    method: options?.method || 'GET',
    headers,
    hasApiKey: !!headers['X-API-Key'],
    hasAuthToken: !!headers['Authorization'],
  });

  const response = await fetch(finalUrl, {
    ...options,
    headers,
  });

  console.log('[httpClient] Response received:', {
    status: response.status,
    statusText: response.statusText,
  });

  let responseData: any;
  const contentType = response.headers.get('content-type');

  if (contentType?.includes('application/json')) {
    responseData = await response.json();
  } else {
    responseData = await response.text();
  }

  return { response, responseData };
};

export const httpClient = async <T>(
  url: string,
  options: HttpClientOptions = {}
): Promise<T> => {
  const finalUrl = url.startsWith('http')
    ? url
    : `${globalConfig.baseUrl || 'http://localhost:3001'}${url}`;

  // Build headers for initial attempt
  const buildHeaders = (overrideToken?: string) => {
    const finalHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    };

    const apiKey = options?.apiKey || globalConfig.apiKey;
    if (apiKey) {
      finalHeaders['X-API-Key'] = apiKey;
    }

    const token = overrideToken || options?.token || globalConfig.token;
    if (token) {
      finalHeaders['Authorization'] = `Bearer ${token}`;
    }

    return finalHeaders;
  };

  try {
    const initialHeaders = buildHeaders();
    const { response, responseData } = await performRequest(
      finalUrl,
      options,
      initialHeaders
    );

    if (response.ok) {
      return {
        data: responseData,
        status: response.status,
        headers: response.headers,
      } as T;
    }

    const shouldAttemptRefresh =
      response.status === 401 &&
      !options.skipAuthRefresh &&
      !!tokenRefreshHandler;

    if (shouldAttemptRefresh) {
      console.warn('[httpClient] 401 Unauthorized detected. Attempting token refresh...', {
        timestamp: new Date().toISOString(),
        url: finalUrl,
        skipAuthRefresh: !!options.skipAuthRefresh,
        hasRefreshHandler: !!tokenRefreshHandler,
      });
      const refreshedToken = await refreshAuthToken();

      if (refreshedToken) {
        // Update global token for future requests
        globalConfig = { ...globalConfig, token: refreshedToken };
        console.log('[httpClient] Token refresh succeeded. Retrying request...', {
          timestamp: new Date().toISOString(),
          url: finalUrl,
        });

        const retryHeaders = buildHeaders(refreshedToken);
        const retryOptions: HttpClientOptions = {
          ...options,
          skipAuthRefresh: true,
        };

        const retryResult = await performRequest(
          finalUrl,
          retryOptions,
          retryHeaders
        );

        if (retryResult.response.ok) {
          console.log('[httpClient] Retry after refresh succeeded.', {
            timestamp: new Date().toISOString(),
            url: finalUrl,
            status: retryResult.response.status,
          });
          return {
            data: retryResult.responseData,
            status: retryResult.response.status,
            headers: retryResult.response.headers,
          } as T;
        }
        console.warn('[httpClient] Retry after refresh failed.', {
          timestamp: new Date().toISOString(),
          url: finalUrl,
          status: retryResult.response.status,
        });
      }

      // Notify callback before throwing
      console.warn('[httpClient] Auth expired. Invoking onAuthExpired callback and throwing AuthExpiredError.', {
        timestamp: new Date().toISOString(),
        url: finalUrl,
      });
      try { onAuthExpired?.(); } catch (e) { /* noop */ }
      throw new AuthExpiredError();
    }

    const error = new Error(
      `HTTP ${response.status}: ${response.statusText}`
    ) as any;
    error.status = response.status;
    error.data = responseData;
    throw error;
  } catch (error) {
    const errorDetails: any = {
      url: finalUrl,
      timestamp: new Date().toISOString(),
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
    };

    if (error instanceof Error) {
      errorDetails.stack = error.stack;
      if (error.constructor === TypeError && error.message.includes('Network')) {
        errorDetails.likelyNetworkCause = 'fetch XHR error - could be CORS, DNS resolution, connection refused, or host unreachable';
        errorDetails.attemptedUrl = finalUrl;
        errorDetails.checkItems = [
          '1. Is the server actually running?',
          '2. Is the hostname "thursday.local" resolvable from this device?',
          '3. Is port 3001 accessible from this network?',
          '4. Check firewall rules',
          '5. Try with IP address instead of hostname',
        ];
      }
    }

    console.error('[httpClient] Request failed with detailed error:', errorDetails);

    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Network request failed: ${String(error)}`);
  }
};
