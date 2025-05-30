import { apiClient, withLoading } from '../client';
import type {
  ApiResponse,
  Scenario,
  CreateScenarioData,
  UpdateScenarioData,
  ScenarioListResponse,
  PaginationParams,
} from '../types';

export class ScenarioService {
  // Create a new scenario
  async createScenario(data: CreateScenarioData): Promise<Scenario> {
    const response = await apiClient.post<Scenario>('/scenarios', data);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create scenario');
    }
    return response.data;
  }

  // Get scenario by ID
  async getScenario(id: string): Promise<Scenario> {
    const response = await apiClient.get<Scenario>(`/scenarios/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get scenario');
    }
    return response.data;
  }

  // Update scenario
  async updateScenario(id: string, data: UpdateScenarioData): Promise<Scenario> {
    const response = await apiClient.put<Scenario>(`/scenarios/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update scenario');
    }
    return response.data;
  }

  // Delete scenario
  async deleteScenario(id: string): Promise<void> {
    const response = await apiClient.delete(`/scenarios/${id}`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete scenario');
    }
  }

  // List user's scenarios
  async listScenarios(params?: PaginationParams): Promise<ScenarioListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/scenarios${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<ScenarioListResponse>(endpoint);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to list scenarios');
    }
    return response.data;
  }

  // Run scenario analysis (calculate all variations)
  async runScenarioAnalysis(id: string): Promise<Scenario> {
    const response = await apiClient.post<Scenario>(`/scenarios/${id}/analyze`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to run scenario analysis');
    }
    return response.data;
  }

  // Add variation to scenario
  async addVariation(scenarioId: string, variation: any): Promise<Scenario> {
    const response = await apiClient.post<Scenario>(`/scenarios/${scenarioId}/variations`, variation);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to add variation');
    }
    return response.data;
  }

  // Update variation in scenario
  async updateVariation(scenarioId: string, variationId: string, variation: any): Promise<Scenario> {
    const response = await apiClient.put<Scenario>(`/scenarios/${scenarioId}/variations/${variationId}`, variation);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update variation');
    }
    return response.data;
  }

  // Remove variation from scenario
  async removeVariation(scenarioId: string, variationId: string): Promise<Scenario> {
    const response = await apiClient.delete<Scenario>(`/scenarios/${scenarioId}/variations/${variationId}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to remove variation');
    }
    return response.data;
  }

  // Get scenario results (comparison of all variations)
  async getScenarioResults(id: string): Promise<any> {
    const response = await apiClient.get(`/scenarios/${id}/results`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get scenario results');
    }
    return response.data;
  }

  // Duplicate scenario
  async duplicateScenario(id: string, title?: string): Promise<Scenario> {
    const response = await apiClient.post<Scenario>(`/scenarios/${id}/duplicate`, {
      title,
    });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to duplicate scenario');
    }
    return response.data;
  }

  // Search scenarios
  async searchScenarios(query: string, params?: PaginationParams): Promise<ScenarioListResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('q', query);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiClient.get<ScenarioListResponse>(`/scenarios/search?${queryParams.toString()}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to search scenarios');
    }
    return response.data;
  }

  // Helper methods with loading states
  async createScenarioWithLoading(
    data: CreateScenarioData,
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<Scenario | null> {
    return withLoading(() => apiClient.post<Scenario>('/scenarios', data), setLoading, setError);
  }

  async getScenarioWithLoading(
    id: string,
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<Scenario | null> {
    return withLoading(() => apiClient.get<Scenario>(`/scenarios/${id}`), setLoading, setError);
  }

  async listScenariosWithLoading(
    params?: PaginationParams,
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<ScenarioListResponse | null> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/scenarios${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return withLoading(() => apiClient.get<ScenarioListResponse>(endpoint), setLoading, setError);
  }

  async updateScenarioWithLoading(
    id: string,
    data: UpdateScenarioData,
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<Scenario | null> {
    return withLoading(() => apiClient.put<Scenario>(`/scenarios/${id}`, data), setLoading, setError);
  }

  async deleteScenarioWithLoading(
    id: string,
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<boolean> {
    const result = await withLoading(() => apiClient.delete(`/scenarios/${id}`), setLoading, setError);
    return !!result;
  }

  async runScenarioAnalysisWithLoading(
    id: string,
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<Scenario | null> {
    return withLoading(() => apiClient.post<Scenario>(`/scenarios/${id}/analyze`), setLoading, setError);
  }

  async getScenarioResultsWithLoading(
    id: string,
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<any> {
    return withLoading(() => apiClient.get(`/scenarios/${id}/results`), setLoading, setError);
  }
}

// Export singleton instance
export const scenarioService = new ScenarioService();