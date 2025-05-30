import { useState, useEffect, useCallback } from 'react';
import { calculationService } from '../services/calculationService';
import type {
  Calculation,
  CreateCalculationData,
  UpdateCalculationData,
  CalculationListResponse,
  ShareCalculationResponse,
  UsageStats,
  PaginationParams,
} from '../types';

// Hook for managing calculations list
export function useCalculations(params?: PaginationParams) {
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCalculations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await calculationService.listCalculations(params);
      setCalculations(response.calculations);
      setTotal(response.total);
      setHasMore(response.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch calculations');
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchCalculations();
  }, [fetchCalculations]);

  const createCalculation = useCallback(async (data: CreateCalculationData): Promise<Calculation | null> => {
    try {
      setError(null);
      const newCalculation = await calculationService.createCalculation(data);
      setCalculations(prev => [newCalculation, ...prev]);
      setTotal(prev => prev + 1);
      return newCalculation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create calculation');
      return null;
    }
  }, []);

  const updateCalculation = useCallback(async (id: string, data: UpdateCalculationData): Promise<Calculation | null> => {
    try {
      setError(null);
      const updatedCalculation = await calculationService.updateCalculation(id, data);
      setCalculations(prev => prev.map(calc => calc.id === id ? updatedCalculation : calc));
      return updatedCalculation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update calculation');
      return null;
    }
  }, []);

  const deleteCalculation = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      await calculationService.deleteCalculation(id);
      setCalculations(prev => prev.filter(calc => calc.id !== id));
      setTotal(prev => prev - 1);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete calculation');
      return false;
    }
  }, []);

  const shareCalculation = useCallback(async (id: string): Promise<ShareCalculationResponse | null> => {
    try {
      setError(null);
      const shareResponse = await calculationService.shareCalculation(id);
      // Update the calculation in the list to mark it as public
      setCalculations(prev => prev.map(calc => 
        calc.id === id ? { ...calc, isPublic: true, publicToken: shareResponse.publicToken } : calc
      ));
      return shareResponse;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share calculation');
      return null;
    }
  }, []);

  const unshareCalculation = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      await calculationService.unshareCalculation(id);
      // Update the calculation in the list to mark it as private
      setCalculations(prev => prev.map(calc => 
        calc.id === id ? { ...calc, isPublic: false, publicToken: undefined } : calc
      ));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unshare calculation');
      return false;
    }
  }, []);

  const duplicateCalculation = useCallback(async (id: string, title?: string): Promise<Calculation | null> => {
    try {
      setError(null);
      const duplicatedCalculation = await calculationService.duplicateCalculation(id, title);
      setCalculations(prev => [duplicatedCalculation, ...prev]);
      setTotal(prev => prev + 1);
      return duplicatedCalculation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate calculation');
      return null;
    }
  }, []);

  const refresh = useCallback(() => {
    fetchCalculations();
  }, [fetchCalculations]);

  return {
    calculations,
    total,
    hasMore,
    isLoading,
    error,
    createCalculation,
    updateCalculation,
    deleteCalculation,
    shareCalculation,
    unshareCalculation,
    duplicateCalculation,
    refresh,
  };
}

// Hook for managing a single calculation
export function useCalculation(id: string | null) {
  const [calculation, setCalculation] = useState<Calculation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCalculation = useCallback(async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const calc = await calculationService.getCalculation(id);
      setCalculation(calc);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch calculation');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCalculation();
  }, [fetchCalculation]);

  const updateCalculation = useCallback(async (data: UpdateCalculationData): Promise<Calculation | null> => {
    if (!id) return null;
    
    try {
      setError(null);
      const updatedCalculation = await calculationService.updateCalculation(id, data);
      setCalculation(updatedCalculation);
      return updatedCalculation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update calculation');
      return null;
    }
  }, [id]);

  const refresh = useCallback(() => {
    fetchCalculation();
  }, [fetchCalculation]);

  return {
    calculation,
    isLoading,
    error,
    updateCalculation,
    refresh,
  };
}

// Hook for usage statistics
export function useUsageStats() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const usageStats = await calculationService.getUsageStats();
      setStats(usageStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch usage statistics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refresh = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refresh,
  };
}

// Hook for searching calculations
export function useCalculationSearch() {
  const [results, setResults] = useState<Calculation[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, params?: PaginationParams) => {
    if (!query.trim()) {
      setResults([]);
      setTotal(0);
      setHasMore(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await calculationService.searchCalculations(query, params);
      setResults(response.calculations);
      setTotal(response.total);
      setHasMore(response.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setTotal(0);
    setHasMore(false);
    setError(null);
  }, []);

  return {
    results,
    total,
    hasMore,
    isLoading,
    error,
    search,
    clearResults,
  };
}