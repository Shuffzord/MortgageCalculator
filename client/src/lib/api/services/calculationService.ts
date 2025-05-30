import { apiClient, withLoading, withPagination } from '../client';
import type {
  ApiResponse,
  Calculation,
  CreateCalculationData,
  UpdateCalculationData,
  CalculationListResponse,
  ShareCalculationResponse,
  UsageStats,
  PaginationParams,
} from '../types';

export class CalculationService {
  // Create a new calculation
  async createCalculation(data: CreateCalculationData): Promise<Calculation> {
    const response = await apiClient.post<Calculation>('/calculations', data);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create calculation');
    }
    return response.data;
  }

  // Get calculation by ID
  async getCalculation(id: string): Promise<Calculation> {
    const response = await apiClient.get<Calculation>(`/calculations/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get calculation');
    }
    return response.data;
  }

  // Get public calculation by token
  async getPublicCalculation(token: string): Promise<Calculation> {
    const response = await apiClient.get<Calculation>(`/calculations/public/${token}`, {
      requireAuth: false,
    });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get public calculation');
    }
    return response.data;
  }

  // Update calculation
  async updateCalculation(id: string, data: UpdateCalculationData): Promise<Calculation> {
    const response = await apiClient.put<Calculation>(`/calculations/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update calculation');
    }
    return response.data;
  }

  // Delete calculation
  async deleteCalculation(id: string): Promise<void> {
    const response = await apiClient.delete(`/calculations/${id}`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete calculation');
    }
  }

  // List user's calculations
  async listCalculations(params?: PaginationParams): Promise<CalculationListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/calculations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<CalculationListResponse>(endpoint);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to list calculations');
    }
    return response.data;
  }

  // Share calculation (make it public)
  async shareCalculation(id: string): Promise<ShareCalculationResponse> {
    const response = await apiClient.post<ShareCalculationResponse>(`/calculations/${id}/share`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to share calculation');
    }
    return response.data;
  }

  // Unshare calculation (make it private)
  async unshareCalculation(id: string): Promise<void> {
    const response = await apiClient.delete(`/calculations/${id}/share`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to unshare calculation');
    }
  }

  // Get usage statistics
  async getUsageStats(): Promise<UsageStats> {
    const response = await apiClient.get<UsageStats>('/calculations/usage');
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get usage statistics');
    }
    return response.data;
  }

  // Duplicate calculation
  async duplicateCalculation(id: string, title?: string): Promise<Calculation> {
    const response = await apiClient.post<Calculation>(`/calculations/${id}/duplicate`, {
      title,
    });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to duplicate calculation');
    }
    return response.data;
  }

  // Batch operations
  async deleteMultipleCalculations(ids: string[]): Promise<void> {
    const response = await apiClient.delete('/calculations/batch', {
      body: JSON.stringify({ ids }),
    });
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete calculations');
    }
  }

  // Search calculations
  async searchCalculations(query: string, params?: PaginationParams): Promise<CalculationListResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('q', query);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiClient.get<CalculationListResponse>(`/calculations/search?${queryParams.toString()}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to search calculations');
    }
    return response.data;
  }

  // Helper methods with loading states
  async createCalculationWithLoading(
    data: CreateCalculationData,
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<Calculation | null> {
    return withLoading(() => apiClient.post<Calculation>('/calculations', data), setLoading, setError);
  }

  async getCalculationWithLoading(
    id: string,
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<Calculation | null> {
    return withLoading(() => apiClient.get<Calculation>(`/calculations/${id}`), setLoading, setError);
  }

  async listCalculationsWithLoading(
    params?: PaginationParams,
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<CalculationListResponse | null> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/calculations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return withLoading(() => apiClient.get<CalculationListResponse>(endpoint), setLoading, setError);
  }

  async updateCalculationWithLoading(
    id: string,
    data: UpdateCalculationData,
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<Calculation | null> {
    return withLoading(() => apiClient.put<Calculation>(`/calculations/${id}`, data), setLoading, setError);
  }

  async deleteCalculationWithLoading(
    id: string,
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<boolean> {
    const result = await withLoading(() => apiClient.delete(`/calculations/${id}`), setLoading, setError);
    return !!result;
  }

  async shareCalculationWithLoading(
    id: string,
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<ShareCalculationResponse | null> {
    return withLoading(() => apiClient.post<ShareCalculationResponse>(`/calculations/${id}/share`), setLoading, setError);
  }

  async getUsageStatsWithLoading(
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<UsageStats | null> {
    return withLoading(() => apiClient.get<UsageStats>('/calculations/usage'), setLoading, setError);
  }
}

// Export singleton instance
export const calculationService = new CalculationService();