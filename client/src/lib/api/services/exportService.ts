import { apiClient, withLoading } from '../client';
import type {
  ApiResponse,
  ExportRequest,
  ExportResponse,
} from '../types';

export class ExportService {
  // Export calculation to PDF
  async exportToPdf(calculationId: string, options?: any): Promise<ExportResponse> {
    const response = await apiClient.post<ExportResponse>('/exports/pdf', {
      calculationId,
      options,
    });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to export to PDF');
    }
    return response.data;
  }

  // Export calculation to CSV
  async exportToCsv(calculationId: string, options?: any): Promise<ExportResponse> {
    const response = await apiClient.post<ExportResponse>('/exports/csv', {
      calculationId,
      options,
    });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to export to CSV');
    }
    return response.data;
  }

  // Export calculation to Excel
  async exportToExcel(calculationId: string, options?: any): Promise<ExportResponse> {
    const response = await apiClient.post<ExportResponse>('/exports/excel', {
      calculationId,
      options,
    });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to export to Excel');
    }
    return response.data;
  }

  // Generic export method
  async exportCalculation(request: ExportRequest): Promise<ExportResponse> {
    const endpoint = `/exports/${request.format}`;
    const response = await apiClient.post<ExportResponse>(endpoint, request);
    if (!response.success || !response.data) {
      throw new Error(response.error || `Failed to export to ${request.format.toUpperCase()}`);
    }
    return response.data;
  }

  // Export comparison
  async exportComparison(comparisonId: string, format: 'pdf' | 'csv' | 'excel', options?: any): Promise<ExportResponse> {
    const response = await apiClient.post<ExportResponse>(`/exports/comparison/${format}`, {
      comparisonId,
      options,
    });
    if (!response.success || !response.data) {
      throw new Error(response.error || `Failed to export comparison to ${format.toUpperCase()}`);
    }
    return response.data;
  }

  // Export scenario
  async exportScenario(scenarioId: string, format: 'pdf' | 'csv' | 'excel', options?: any): Promise<ExportResponse> {
    const response = await apiClient.post<ExportResponse>(`/exports/scenario/${format}`, {
      scenarioId,
      options,
    });
    if (!response.success || !response.data) {
      throw new Error(response.error || `Failed to export scenario to ${format.toUpperCase()}`);
    }
    return response.data;
  }

  // Get export status
  async getExportStatus(exportId: string): Promise<any> {
    const response = await apiClient.get(`/exports/${exportId}/status`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get export status');
    }
    return response.data;
  }

  // Download export file
  async downloadExport(downloadUrl: string): Promise<Blob> {
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }
      return await response.blob();
    } catch (error) {
      throw new Error(`Failed to download export: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper method to trigger download in browser
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Combined export and download method
  async exportAndDownload(
    request: ExportRequest,
    filename?: string,
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<void> {
    try {
      setLoading?.(true);
      setError?.(null);

      // Export the file
      const exportResponse = await this.exportCalculation(request);
      
      // Download the file
      const blob = await this.downloadExport(exportResponse.downloadUrl);
      
      // Generate filename if not provided
      const finalFilename = filename || `calculation-${request.calculationId}.${request.format}`;
      
      // Trigger download
      this.downloadFile(blob, finalFilename);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      setError?.(errorMessage);
      throw error;
    } finally {
      setLoading?.(false);
    }
  }

  // Helper methods with loading states
  async exportToPdfWithLoading(
    calculationId: string,
    options?: any,
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<ExportResponse | null> {
    return withLoading(() => apiClient.post<ExportResponse>('/exports/pdf', {
      calculationId,
      options,
    }), setLoading, setError);
  }

  async exportToCsvWithLoading(
    calculationId: string,
    options?: any,
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<ExportResponse | null> {
    return withLoading(() => apiClient.post<ExportResponse>('/exports/csv', {
      calculationId,
      options,
    }), setLoading, setError);
  }

  async exportToExcelWithLoading(
    calculationId: string,
    options?: any,
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<ExportResponse | null> {
    return withLoading(() => apiClient.post<ExportResponse>('/exports/excel', {
      calculationId,
      options,
    }), setLoading, setError);
  }

  async exportCalculationWithLoading(
    request: ExportRequest,
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<ExportResponse | null> {
    const endpoint = `/exports/${request.format}`;
    return withLoading(() => apiClient.post<ExportResponse>(endpoint, request), setLoading, setError);
  }

  async exportComparisonWithLoading(
    comparisonId: string,
    format: 'pdf' | 'csv' | 'excel',
    options?: any,
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<ExportResponse | null> {
    return withLoading(() => apiClient.post<ExportResponse>(`/exports/comparison/${format}`, {
      comparisonId,
      options,
    }), setLoading, setError);
  }

  async exportScenarioWithLoading(
    scenarioId: string,
    format: 'pdf' | 'csv' | 'excel',
    options?: any,
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<ExportResponse | null> {
    return withLoading(() => apiClient.post<ExportResponse>(`/exports/scenario/${format}`, {
      scenarioId,
      options,
    }), setLoading, setError);
  }
}

// Export singleton instance
export const exportService = new ExportService();