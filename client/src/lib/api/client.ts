import { auth } from '../firebase/config';
import type { ApiResponse } from './types';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/mortgage-firebase-firebase/us-central1/api';
const API_TIMEOUT = 30000; // 30 seconds

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Request configuration interface
interface RequestConfig extends RequestInit {
  timeout?: number;
  requireAuth?: boolean;
}

// Response interceptor type
type ResponseInterceptor = (response: Response) => Promise<Response>;

// Request interceptor type
type RequestInterceptor = (config: RequestConfig) => Promise<RequestConfig>;

class ApiClient {
  private baseURL: string;
  private defaultTimeout: number;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor(baseURL: string = API_BASE_URL, timeout: number = API_TIMEOUT) {
    this.baseURL = baseURL;
    this.defaultTimeout = timeout;
    
    // Add default request interceptor for authentication
    this.addRequestInterceptor(this.authInterceptor.bind(this));
    
    // Add default response interceptor for error handling
    this.addResponseInterceptor(this.errorInterceptor.bind(this));
  }

  // Add request interceptor
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  // Add response interceptor
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  // Default auth interceptor
  private async authInterceptor(config: RequestConfig): Promise<RequestConfig> {
    if (config.requireAuth !== false) {
      try {
        const user = auth.currentUser;
        if (user) {
          const token = await user.getIdToken();
          config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${token}`,
          };
        }
      } catch (error) {
        console.warn('Failed to get auth token:', error);
      }
    }

    // Set default headers
    config.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    return config;
  }

  // Default error interceptor
  private async errorInterceptor(response: Response): Promise<Response> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorDetails: any = null;

      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        errorDetails = errorData;
      } catch {
        // If we can't parse the error response, use the default message
      }

      throw new ApiError(errorMessage, response.status, response.statusText, errorDetails);
    }

    return response;
  }

  // Create request with timeout
  private createRequestWithTimeout(url: string, config: RequestConfig): Promise<Response> {
    const timeout = config.timeout || this.defaultTimeout;
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new ApiError(`Request timeout after ${timeout}ms`, 408, 'TIMEOUT'));
      }, timeout);

      fetch(url, config)
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timeoutId));
    });
  }

  // Main request method
  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Apply request interceptors
    let finalConfig = { ...config };
    for (const interceptor of this.requestInterceptors) {
      finalConfig = await interceptor(finalConfig);
    }

    try {
      // Make the request
      let response = await this.createRequestWithTimeout(url, finalConfig);

      // Apply response interceptors
      for (const interceptor of this.responseInterceptors) {
        response = await interceptor(response);
      }

      // Parse response
      const data = await response.json();
      return data as ApiResponse<T>;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError('Network error - please check your connection', 0, 'NETWORK_ERROR');
      }
      
      throw new ApiError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        0,
        'UNKNOWN_ERROR'
      );
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  // Utility methods
  setBaseURL(url: string): void {
    this.baseURL = url;
  }

  getBaseURL(): string {
    return this.baseURL;
  }

  setTimeout(timeout: number): void {
    this.defaultTimeout = timeout;
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health', { requireAuth: false });
      return response.success;
    } catch {
      return false;
    }
  }

  // Get current auth token
  async getAuthToken(): Promise<string | null> {
    try {
      const user = auth.currentUser;
      return user ? await user.getIdToken() : null;
    } catch {
      return null;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!auth.currentUser;
  }
}

// Create and export the default API client instance
export const apiClient = new ApiClient();

// Export the class for creating custom instances if needed
export { ApiClient };

// Helper function to handle API responses with loading states
export async function withLoading<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  setLoading?: (loading: boolean) => void,
  setError?: (error: string | null) => void
): Promise<T | null> {
  try {
    setLoading?.(true);
    setError?.(null);
    
    const response = await apiCall();
    
    if (response.success && response.data) {
      return response.data;
    } else {
      const errorMessage = response.error || 'Unknown error occurred';
      setError?.(errorMessage);
      throw new ApiError(errorMessage);
    }
  } catch (error) {
    const errorMessage = error instanceof ApiError ? error.message : 'Network error occurred';
    setError?.(errorMessage);
    throw error;
  } finally {
    setLoading?.(false);
  }
}

// Helper function for handling paginated responses
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export async function withPagination<T>(
  apiCall: () => Promise<ApiResponse<PaginatedResponse<T>>>,
  setLoading?: (loading: boolean) => void,
  setError?: (error: string | null) => void
): Promise<PaginatedResponse<T> | null> {
  return withLoading(apiCall, setLoading, setError);
}