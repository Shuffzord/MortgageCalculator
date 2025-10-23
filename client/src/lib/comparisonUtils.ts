import { CalculationResults } from './types';

/**
 * Compares two CalculationResults objects and returns key savings metrics.
 * @param baseCalculation The base loan calculation results
 * @param calculationWithoutOverpayments The calculation results WITHOUT overpayments.
 * @returns An object containing interest saved, time saved, and percentage saved.
 */
export function compareCalculations(
  baseCalculation: CalculationResults,
  calculationWithoutOverpayments: CalculationResults
): { interestSaved: number; timeSaved: number; percentageSaved: number } {
  const interestSaved =
    Number(baseCalculation.totalInterest) - Number(calculationWithoutOverpayments.totalInterest);
  // Convert timeSaved from years to months for proper formatting
  const timeSavedYears =
    Number(baseCalculation.actualTerm) - Number(calculationWithoutOverpayments.actualTerm);
  const timeSavedMonths = Math.round(timeSavedYears * 12);

  const percentageSaved =
    Number(baseCalculation.totalInterest) > 0
      ? (interestSaved / Number(baseCalculation.totalInterest)) * 100
      : 0;

  return {
    interestSaved,
    timeSaved: timeSavedMonths, // Store as months, not years
    percentageSaved,
  };
}
