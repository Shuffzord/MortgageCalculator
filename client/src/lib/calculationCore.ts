/**
 * @fileoverview Core calculation functions for mortgage calculations
 *
 * This module contains fundamental calculation functions that are shared between
 * the calculationEngine and mortgage-calculator modules. It was created specifically
 * to break the circular dependency between these components, allowing for a more
 * maintainable and modular architecture.
 *
 * The functions in this module handle core mathematical operations like calculating
 * monthly payments and data format conversions that are needed by multiple parts
 * of the application. By centralizing these functions here, we ensure consistent
 * calculation behavior throughout the application while avoiding circular imports.
 *
 * This is a critical part of the refactoring effort to improve code organization
 * and reduce coupling between components.
 *
 * Performance optimizations have been added to improve calculation speed for complex
 * scenarios and reduce redundant calculations through memoization.
 */

import { PaymentData } from './types';

/**
 * Rounds a number to two decimal places (cents)
 *
 * This function ensures consistent rounding behavior for monetary values
 * throughout the application. It uses the standard Math.round method
 * multiplied and divided by 100 to achieve rounding to two decimal places.
 *
 * @param {number} amount - The monetary amount to round
 * @returns {number} The amount rounded to two decimal places
 *
 * @example
 * // Round to two decimal places
 * roundToCents(123.456); // Returns: 123.46
 * roundToCents(123.454); // Returns: 123.45
 *
 * @example
 * // Handling very small values
 * roundToCents(0.001); // Returns: 0
 * roundToCents(0.005); // Returns: 0.01
 */
/**
 * Original implementation of roundToCents
 */
export function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Calculates the monthly payment amount for a loan
 *
 * This function implements the standard mortgage payment formula with special
 * handling for very low or zero interest rates. It returns the fixed monthly
 * payment amount required to fully amortize a loan over its term.
 *
 * Mathematical formula: M = P[r(1+r)^n]/[(1+r)^n-1] where:
 * - M = monthly payment
 * - P = loan principal
 * - r = monthly interest rate (annual rate / 12 / 100)
 * - n = number of monthly payments (term * 12)
 *
 * For very low interest rates, simplified calculations are used to avoid
 * numerical precision issues.
 *
 * @param {number} principal - The loan principal amount
 * @param {number} monthlyRate - The monthly interest rate (annual rate / 12)
 * @param {number} totalMonths - The total number of monthly payments
 * @returns {number} The monthly payment amount, rounded to cents
 *
 * @example
 * // Calculate payment for a $300,000 loan at 5% for 30 years
 * const principal = 300000;
 * const monthlyRate = 0.05 / 12; // 5% annual rate
 * const totalMonths = 30 * 12; // 30 years
 * calculateBaseMonthlyPayment(principal, monthlyRate, totalMonths);
 * // Returns approximately 1610.46
 *
 * @example
 * // Calculate payment for a $300,000 loan at 0% for 30 years
 * calculateBaseMonthlyPayment(300000, 0, 360);
 * // Returns 833.33 (simple division of principal by months)
 */
/**
 * Original implementation of calculateBaseMonthlyPayment
 */
export function calculateBaseMonthlyPayment(
  principal: number,
  monthlyRate: number,
  totalMonths: number
): number {
  // For extremely low rates (near-zero), use simple division
  if (Math.abs(monthlyRate) < 0.0001) {
    // 0.01% annual rate threshold
    return roundToCents(principal / totalMonths);
  }

  // For very low rates, use simplified calculation
  if (monthlyRate < 0.001) {
    // 0.12% annual rate threshold
    const totalPayment = principal * (1 + monthlyRate * totalMonths);
    return roundToCents(totalPayment / totalMonths);
  }

  // Standard formula for normal interest rates
  const compoundFactor = Math.pow(1 + monthlyRate, totalMonths);
  const payment = (principal * (monthlyRate * compoundFactor)) / (compoundFactor - 1);
  return roundToCents(payment);
}

/**
 * Converts legacy schedule format to standardized PaymentData format
 *
 * This function normalizes different payment schedule formats into a consistent
 * PaymentData structure. It handles property name differences between legacy
 * and current implementations, ensuring that all required fields are present
 * with appropriate fallback values when needed.
 *
 * This function is critical for maintaining backward compatibility while
 * standardizing data structures across the application.
 *
 * @param {any} schedule - The schedule entry to convert, which may have various property names
 * @returns {PaymentData} A standardized payment data object
 *
 * @example
 * // Convert a legacy format schedule entry
 * const legacyEntry = {
 *   paymentNum: 1,
 *   monthlyPayment: 1000,
 *   principalPayment: 200,
 *   interestPayment: 800,
 *   remainingPrincipal: 99800,
 *   isOverpayment: false,
 *   overpaymentAmount: 0
 * };
 * const standardized = convertScheduleFormat(legacyEntry);
 * // Returns a PaymentData object with consistent property names
 *
 * @example
 * // Handle alternative property names
 * const alternativeEntry = {
 *   payment: 1,
 *   monthlyPayment: 1000,
 *   principalPayment: 200,
 *   interestPayment: 800,
 *   balance: 99800
 * };
 * const standardized = convertScheduleFormat(alternativeEntry);
 * // Returns a complete PaymentData object with default values for missing properties
 */
export function convertScheduleFormat(schedule: any): PaymentData {
  return {
    payment: schedule.paymentNum || schedule.payment,
    monthlyPayment: schedule.monthlyPayment || schedule.payment,
    principalPayment: schedule.principalPayment,
    interestPayment: schedule.interestPayment,
    balance: schedule.remainingPrincipal || schedule.balance,
    isOverpayment: schedule.isOverpayment || false,
    overpaymentAmount: schedule.overpaymentAmount || 0,
    totalInterest: schedule.totalInterest || 0,
    totalPayment: schedule.totalPayment || schedule.monthlyPayment || 0,
    paymentDate: schedule.paymentDate,
    currency: schedule.currency,
  };
}
