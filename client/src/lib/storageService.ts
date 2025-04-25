import { 
  LoanDetails, 
  OverpaymentDetails, 
  SavedCalculation 
} from './types';

const STORAGE_KEY = 'mortgageCalculations';

/**
 * Save a mortgage calculation to localStorage
 */
export function saveCalculation(
  loanDetails: LoanDetails,
  overpaymentDetails: OverpaymentDetails
): SavedCalculation {
  // Get existing calculations from localStorage
  const savedCalculations = getSavedCalculations();
  
  // Create a new calculation object
  const newCalculation: SavedCalculation = {
    id: Date.now(),
    name: `Mortgage - $${loanDetails.principal.toLocaleString()} at ${loanDetails.interestRate}%`,
    date: new Date().toISOString(),
    loanDetails: { ...loanDetails },
    overpayment: { ...overpaymentDetails }
  };
  
  // Add to list of saved calculations
  savedCalculations.push(newCalculation);
  
  // Save back to localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedCalculations));
  
  return newCalculation;
}

/**
 * Get all saved mortgage calculations from localStorage
 */
export function getSavedCalculations(): SavedCalculation[] {
  const savedData = localStorage.getItem(STORAGE_KEY);
  
  if (!savedData) return [];
  
  try {
    const parsedData = JSON.parse(savedData);
    if (Array.isArray(parsedData)) {
      return parsedData;
    }
  } catch (error) {
    console.error('Error parsing saved calculations:', error);
  }
  
  return [];
}

/**
 * Delete a saved calculation by ID
 */
export function deleteCalculation(id: number): boolean {
  const savedCalculations = getSavedCalculations();
  const updatedCalculations = savedCalculations.filter(calc => calc.id !== id);
  
  if (updatedCalculations.length === savedCalculations.length) {
    return false; // Nothing was deleted
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCalculations));
  return true;
}

/**
 * Clear all saved calculations
 */
export function clearAllCalculations(): void {
  localStorage.removeItem(STORAGE_KEY);
}
