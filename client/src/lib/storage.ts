/**
 * This file handles client-side storage of mortgage calculations
 * using localStorage for persistence between sessions.
 */

import { LoanDetails } from "./mortgage-calculator";

const STORAGE_KEY = "mortgage-calculator-saved";

/**
 * Save a calculation to localStorage
 * @param calculation The loan details to save
 */
export function saveCalculation(calculation: LoanDetails): void {
  // Get existing calculations
  const savedCalculations = getSavedCalculations();
  
  // Check if calculation with the same name exists
  const existingIndex = savedCalculations.findIndex(calc => calc.name === calculation.name);
  
  if (existingIndex >= 0) {
    // Update existing calculation
    savedCalculations[existingIndex] = calculation;
  } else {
    // Add new calculation
    savedCalculations.push(calculation);
  }
  
  // Save to localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedCalculations));
}

/**
 * Load all saved calculations from localStorage
 * @returns Array of saved LoanDetails objects
 */
export function getSavedCalculations(): LoanDetails[] {
  try {
    const savedJSON = localStorage.getItem(STORAGE_KEY);
    if (!savedJSON) return [];
    
    const parsed = JSON.parse(savedJSON);
    if (!Array.isArray(parsed)) return [];
    
    return parsed;
  } catch (error) {
    console.error("Error loading saved calculations:", error);
    return [];
  }
}

/**
 * Load a specific calculation by name
 * @param name Name of the calculation to load
 * @returns The loan details object or undefined if not found
 */
export function loadCalculation(name: string): LoanDetails | undefined {
  const savedCalculations = getSavedCalculations();
  return savedCalculations.find(calc => calc.name === name);
}

/**
 * Delete a calculation from localStorage
 * @param name Name of the calculation to delete
 * @returns true if deletion was successful, false otherwise
 */
export function deleteCalculation(name: string): boolean {
  const savedCalculations = getSavedCalculations();
  const initialLength = savedCalculations.length;
  
  const filteredCalculations = savedCalculations.filter(calc => calc.name !== name);
  
  if (filteredCalculations.length !== initialLength) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredCalculations));
    return true;
  }
  
  return false;
}
