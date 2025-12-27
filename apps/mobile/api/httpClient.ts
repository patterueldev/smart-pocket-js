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
    const response = await fetch(finalUrl, {
      ...options,
      headers: finalHeaders,
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
    // Re-throw with additional context
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Network request failed: ${String(error)}`);
  }
};
