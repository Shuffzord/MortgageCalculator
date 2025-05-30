import { apiClient, withLoading } from '../client';
import type {
  ApiResponse,
  Comparison,
  CreateComparisonData,
  UpdateComparisonData,
  ComparisonListResponse,
  PaginationParams,
} from '../types';

export class ComparisonService {
  // Create a new comparison
  async createComparison(data: CreateComparisonData): Promise<Comparison> {
    const response = await apiClient.post<Comparison>('/comparisons', data);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create comparison');
    }
    return response.data;
  }

  // Get comparison by ID
  async getComparison(id: string): Promise<Comparison> {
    const response = await apiClient.get<Comparison>(`/comparisons/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get comparison');
    }
    return response.data;
  }

  // Update comparison
  async updateComparison(id: string, data: UpdateComparisonData): Promise<Comparison> {
    const response = await apiClient.put<Comparison>(`/comparisons/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update comparison');
    }
    return response.data;
  }

  // Delete comparison
  async deleteComparison(id: string): Promise<void> {
    const response = await apiClient.delete(`/comparisons/${id}`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete comparison');
    }
  }

  // List user's comparisons
  async listComparisons(params?: PaginationParams): Promise<ComparisonListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/comparisons${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<ComparisonListResponse>(endpoint);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to list comparisons');
    }
    return response.data;
  }

  // Add calculation to comparison
  async addCalculationToComparison(comparisonId: string, calculationId: string): Promise<Comparison> {
    const response = await apiClient.post<Comparison>(`/comparisons/${comparisonId}/calculations`, {
      calculationId,
    });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to add calculation to comparison');
    }
    return response.data;
  }

  // Remove calculation from comparison
  async removeCalculationFromComparison(comparisonId: string, calculationId: string): Promise<Comparison> {
    const response = await apiClient.delete<Comparison>(`/comparisons/${comparisonId}/calculations/${calculationId}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to remove calculation from comparison');
    }
    return response.data;
  }

  // Get comparison results (calculated differences)
  async getComparisonResults(id: string): Promise<any> {
    const response = await apiClient.get(`/comparisons/${id}/results`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get comparison results');
    }
    return response.data;
  }

  // Duplicate comparison
  async duplicateComparison(id: string, title?: string): Promise<Comparison> {
    const response = await apiClient.post<Comparison>(`/comparisons/${id}/duplicate`, {
      title,
    });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to duplicate comparison');
    }
    return response.data;
  }

  // Search comparisons
  async searchComparisons(query: string, params?: PaginationParams): Promise<ComparisonListResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('q', query);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiClient.get<ComparisonListResponse>(`/comparisons/search?${queryParams.toString()}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to search comparisons');
    }
    return response.data;
  }

  // Helper methods with loading states
  async createComparisonWithLoading(
    data: CreateComparisonData,
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<Comparison | null> {
    return withLoading(() => apiClient.post<Comparison>('/comparisons', data), setLoading, setError);
  }

  async getComparisonWithLoading(
    id: string,
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<Comparison | null> {
    return withLoading(() => apiClient.get<Comparison>(`/comparisons/${id}`), setLoading, setError);
  }

  async listComparisonsWithLoading(
    params?: PaginationParams,
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<ComparisonListResponse | null> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/comparisons${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return withLoading(() => apiClient.get<ComparisonListResponse>(endpoint), setLoading, setError);
  }

  async updateComparisonWithLoading(
    id: string,
    data: UpdateComparisonData,
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<Comparison | null> {
    return withLoading(() => apiClient.put<Comparison>(`/comparisons/${id}`, data), setLoading, setError);
  }

  async deleteComparisonWithLoading(
    id: string,
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<boolean> {
    const result = await withLoading(() => apiClient.delete(`/comparisons/${id}`), setLoading, setError);
    return !!result;
  }

  async getComparisonResultsWithLoading(
    id: string,
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<any> {
    return withLoading(() => apiClient.get(`/comparisons/${id}/results`), setLoading, setError);
  }
}

// Export singleton instance
export const comparisonService = new ComparisonService();