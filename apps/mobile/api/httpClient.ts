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
}

/**
 * Custom HTTP client that orval uses for all API calls
 * Signature matches orval's fetch client mutator: (url, options)
 */
export const httpClient = async <T>(
  url: string,
  options?: RequestInit & { apiKey?: string; token?: string }
): Promise<T> => {
  // Resolve the full URL using global config
  const finalUrl = url.startsWith('http')
    ? url
    : `${globalConfig.baseUrl || 'http://localhost:3001'}${url}`;

  console.log('[httpClient] Making request:', {
    url,
    finalUrl,
    method: options?.method || 'GET',
    baseUrl: globalConfig.baseUrl,
  });

  // Build headers
  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  // Add API Key if provided (for /connect endpoint) - check both options and global
  const apiKey = options?.apiKey || globalConfig.apiKey;
  if (apiKey) {
    finalHeaders['X-API-Key'] = apiKey;
  }

  // Add Bearer token if provided (for authenticated endpoints) - check both options and global
  const token = options?.token || globalConfig.token;
  if (token) {
    finalHeaders['Authorization'] = `Bearer ${token}`;
  }

  try {
    console.log('[httpClient] Making request:', {
      url,
      finalUrl,
      method: options?.method || 'GET',
      baseUrl: globalConfig.baseUrl,
    });

    console.log('[httpClient] Request details:', {
      timestamp: new Date().toISOString(),
      finalUrl,
      method: options?.method || 'GET',
      headers: finalHeaders,
      hasApiKey: !!finalHeaders['X-API-Key'],
      hasAuthToken: !!finalHeaders['Authorization'],
    });

    console.log('[httpClient] Sending fetch request to:', finalUrl);
    const response = await fetch(finalUrl, {
      ...options,
      headers: finalHeaders,
    });

    console.log('[httpClient] Response received:', {
      status: response.status,
      statusText: response.statusText,
    });

    // Parse response
    let responseData: any;
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    // Handle HTTP errors
    if (!response.ok) {
      const error = new Error(
        `HTTP ${response.status}: ${response.statusText}`
      ) as any;
      error.status = response.status;
      error.data = responseData;
      throw error;
    }

    // Return wrapped response with status and headers (orval expects this structure)
    return {
      data: responseData,
      status: response.status,
      headers: response.headers,
    } as T;
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

    // Re-throw with additional context
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Network request failed: ${String(error)}`);
  }
};
