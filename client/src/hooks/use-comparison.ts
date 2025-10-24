import { useState, useEffect, useCallback } from 'react';
import { comparisonService } from '../lib/services/comparisonService';
import { CalculationResults, ComparisonResults } from '../lib/types';

/**
 * Custom hook for comparing loan calculations
 *
 * @param baseCalculation The base loan calculation results WITH overpayments
 * @param calculationWithoutOverpayments The calculation results WITHOUT overpayments
 * @param autoCompare Whether to automatically run the comparison when inputs change
 * @returns Comparison results and a function to manually trigger comparison
 */
export function useComparison(
  baseCalculation: CalculationResults | null,
  calculationWithoutOverpayments: CalculationResults | null,
  autoCompare = true
) {
  const [comparisonResults, setComparisonResults] = useState<ComparisonResults & { isLoading: boolean }>({
    interestSaved: 0,
    timeSaved: 0,
    percentageSaved: 0,
    isLoading: false
  });
  
  const [error, setError] = useState<string | null>(null);

  const runComparison = useCallback(() => {
    
    // If there's no calculation with overpayments or they're the same object, there are no overpayments to compare
    if (!baseCalculation || !calculationWithoutOverpayments) {
      setComparisonResults({
        interestSaved: 0,
        timeSaved: 0,
        percentageSaved: 0,
        isLoading: false
      });
      setError(null);
      return;
    }

    // Set loading state
    setComparisonResults(prev => ({ ...prev, isLoading: true }));
    setError(null);

    // Use setTimeout to ensure the loading state doesn't get stuck
    setTimeout(() => {
      try {
        const results = comparisonService.compareLoanResults(
          baseCalculation,
          calculationWithoutOverpayments
        );
        
        setComparisonResults({
          ...results,
          isLoading: false
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred during comparison');
        setComparisonResults(prev => ({ ...prev, isLoading: false }));
      }
    }, 0);
  }, [baseCalculation, calculationWithoutOverpayments]);

  // Auto-run comparison when inputs change (if autoCompare is true)
  useEffect(() => {
    if (autoCompare) {
      runComparison();
    }
  }, [baseCalculation, calculationWithoutOverpayments, autoCompare, runComparison]);

  return {
    ...comparisonResults,
    error,
    runComparison
  };
}