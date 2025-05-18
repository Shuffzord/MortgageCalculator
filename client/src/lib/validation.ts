/**
 * @fileoverview Validation utilities for mortgage calculations
 * 
 * This file contains functions for validating input parameters for mortgage calculations.
 * It provides comprehensive validation for loan details, interest rates, terms, and other
 * parameters to ensure that calculations are performed with valid inputs.
 */

import { LoanDetails, ValidationOptions, OverpaymentDetails } from './types';

/**
 * Validates loan details and returns validation results
 * 
 * @param loanDetails - The loan details to validate
 * @param options - Optional validation options
 * @returns Validation results with isValid flag and array of error messages
 */
export function validateLoanDetails(
  loanDetails: LoanDetails,
  options: ValidationOptions = {}
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate principal
  if (loanDetails.principal <= 0 && !options.allowNegativePrincipal) {
    errors.push('Principal amount must be greater than zero');
  }
  
  // Validate interest rates
  if (!loanDetails.interestRatePeriods || loanDetails.interestRatePeriods.length === 0) {
    errors.push('At least one interest rate period is required');
  } else {
    for (const period of loanDetails.interestRatePeriods) {
      if (period.interestRate < 0) {
        errors.push('Interest rate cannot be negative');
      }
      
      if (options.maxInterestRate && period.interestRate > options.maxInterestRate) {
        errors.push(`Interest rate exceeds maximum allowed (${options.maxInterestRate}%)`);
      }
      
      if (options.minInterestRate && period.interestRate < options.minInterestRate) {
        errors.push(`Interest rate is below minimum allowed (${options.minInterestRate}%)`);
      }
    }
  }
  
  // Validate loan term
  if (loanDetails.loanTerm <= 0) {
    errors.push('Loan term must be greater than zero');
  }
  
  if (options.maxLoanTerm && loanDetails.loanTerm > options.maxLoanTerm) {
    errors.push(`Loan term exceeds maximum allowed (${options.maxLoanTerm} years)`);
  }
  
  if (options.minLoanTerm && loanDetails.loanTerm < options.minLoanTerm) {
    errors.push(`Loan term is below minimum allowed (${options.minLoanTerm} years)`);
  }
  
  // Validate dates if requested
  if (options.validateDates) {
    if (!(loanDetails.startDate instanceof Date) || isNaN(loanDetails.startDate.getTime())) {
      errors.push('Start date is invalid');
    }
    
    // Validate overpayment dates
    if (loanDetails.overpaymentPlans && loanDetails.overpaymentPlans.length > 0) {
      loanDetails.overpaymentPlans.forEach((plan, index) => {
        validateOverpaymentPlan(plan, index, errors);
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates an overpayment plan
 * 
 * @param plan - The overpayment plan to validate
 * @param index - The index of the plan in the array (for error messages)
 * @param errors - Array to collect error messages
 */
function validateOverpaymentPlan(
  plan: OverpaymentDetails,
  index: number,
  errors: string[]
): void {
  if (plan.amount <= 0) {
    errors.push(`Overpayment plan #${index + 1}: Amount must be greater than zero`);
  }
  
  if (plan.startDate && !(plan.startDate instanceof Date)) {
    errors.push(`Overpayment plan #${index + 1}: Start date is invalid`);
  }
  
  if (plan.endDate && !(plan.endDate instanceof Date)) {
    errors.push(`Overpayment plan #${index + 1}: End date is invalid`);
  }
  
  if (plan.startDate && plan.endDate && plan.startDate > plan.endDate) {
    errors.push(`Overpayment plan #${index + 1}: End date must be after start date`);
  }
  
  if (plan.isRecurring && !plan.frequency) {
    errors.push(`Overpayment plan #${index + 1}: Frequency is required for recurring overpayments`);
  }
}

/**
 * Validates affordability calculation parameters
 * 
 * @param monthlyIncome - Monthly income
 * @param monthlyExpenses - Monthly expenses
 * @param interestRate - Annual interest rate
 * @param loanTerm - Loan term in years
 * @returns Validation results with isValid flag and array of error messages
 */
export function validateAffordabilityParams(
  monthlyIncome: number,
  monthlyExpenses: number,
  interestRate: number,
  loanTerm: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (monthlyIncome <= 0) {
    errors.push('Monthly income must be greater than zero');
  }
  
  if (monthlyExpenses < 0) {
    errors.push('Monthly expenses cannot be negative');
  }
  
  if (monthlyExpenses >= monthlyIncome) {
    errors.push('Monthly expenses must be less than monthly income');
  }
  
  if (interestRate <= 0) {
    errors.push('Interest rate must be greater than zero');
  }
  
  if (loanTerm <= 0) {
    errors.push('Loan term must be greater than zero');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates break-even calculation parameters
 * 
 * @param currentLoan - Current loan details
 * @param newLoan - New loan details
 * @param refinancingCosts - Refinancing costs
 * @returns Validation results with isValid flag and array of error messages
 */
export function validateBreakEvenParams(
  currentLoan: LoanDetails,
  newLoan: LoanDetails,
  refinancingCosts: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate both loans
  const currentLoanValidation = validateLoanDetails(currentLoan);
  const newLoanValidation = validateLoanDetails(newLoan);
  
  if (!currentLoanValidation.isValid) {
    errors.push('Current loan: ' + currentLoanValidation.errors.join(', '));
  }
  
  if (!newLoanValidation.isValid) {
    errors.push('New loan: ' + newLoanValidation.errors.join(', '));
  }
  
  if (refinancingCosts < 0) {
    errors.push('Refinancing costs cannot be negative');
  }
  
  // Check if refinancing makes sense
  if (currentLoanValidation.isValid && newLoanValidation.isValid) {
    const currentRate = currentLoan.interestRatePeriods[0].interestRate;
    const newRate = newLoan.interestRatePeriods[0].interestRate;
    
    if (newRate >= currentRate) {
      errors.push('Warning: New interest rate is not lower than current rate');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Normalizes interest rate input
 * 
 * Handles both percentage format (e.g., 5.5) and decimal format (e.g., 0.055)
 * 
 * @param rate - The interest rate to normalize
 * @returns Normalized interest rate as a percentage
 */
export function normalizeInterestRate(rate: number): number {
  // If rate is very small (likely in decimal format), convert to percentage
  if (rate > 0 && rate < 0.1) {
    return rate * 100;
  }
  return rate;
}

/**
 * Normalizes loan term input
 * 
 * Handles both years and months
 * 
 * @param term - The loan term to normalize
 * @param inMonths - Whether the input is in months
 * @returns Normalized loan term in years
 */
export function normalizeLoanTerm(term: number, inMonths: boolean = false): number {
  if (inMonths) {
    return term / 12;
  }
  return term;
}

/**
 * Normalizes date input
 * 
 * Converts string dates to Date objects
 * 
 * @param date - The date to normalize
 * @returns Normalized date as a Date object
 */
export function normalizeDate(date: string | Date): Date {
  if (typeof date === 'string') {
    return new Date(date);
  }
  return date;
}

/**
 * Normalizes loan details object
 * 
 * Applies normalization to all relevant fields
 * 
 * @param loanDetails - The loan details to normalize
 * @returns Normalized loan details
 */
export function normalizeLoanDetails(loanDetails: LoanDetails): LoanDetails {
  const normalized = { ...loanDetails };
  
  // Normalize interest rates
  normalized.interestRatePeriods = loanDetails.interestRatePeriods.map(period => ({
    ...period,
    interestRate: normalizeInterestRate(period.interestRate)
  }));
  
  // Normalize dates
  if (loanDetails.startDate) {
    normalized.startDate = normalizeDate(loanDetails.startDate);
  }
  
  // Normalize overpayment plans
  if (loanDetails.overpaymentPlans) {
    normalized.overpaymentPlans = loanDetails.overpaymentPlans.map(plan => ({
      ...plan,
      startDate: plan.startDate ? normalizeDate(plan.startDate) : plan.startDate,
      endDate: plan.endDate ? normalizeDate(plan.endDate) : plan.endDate
    }));
  }
  
  return normalized;
}

/**
 * Validates inputs for loan calculation
 *
 * @param principal - The loan principal amount
 * @param interestRatePeriods - Array of interest rate periods
 * @param loanTerm - The loan term in years
 * @param overpaymentPlan - Optional overpayment plan
 * @returns True if inputs are valid, throws an error otherwise
 */
export function validateInputs(
  principal: number,
  interestRatePeriods: { startMonth: number; interestRate: number; }[],
  loanTerm: number,
  overpaymentPlan?: OverpaymentDetails
): boolean {
  if (principal <= 0) {
    throw new Error('Principal amount must be greater than zero');
  }
  
  if (!interestRatePeriods || interestRatePeriods.length === 0) {
    throw new Error('At least one interest rate period is required');
  }
  
  for (const period of interestRatePeriods) {
    if (period.interestRate < 0) {
      throw new Error('Interest rate cannot be negative');
    }
  }
  
  if (loanTerm <= 0) {
    throw new Error('Loan term must be greater than zero');
  }
  
  if (overpaymentPlan && overpaymentPlan.amount <= 0) {
    throw new Error('Overpayment amount must be greater than zero');
  }
  
  return true;
}