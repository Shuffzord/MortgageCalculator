/**
 * Basic Validation Tests for the Mortgage Calculator Engine
 * 
 * These tests verify the core functionality of the mortgage calculator
 * using standard scenarios and fixed-rate mortgages.
 */

import { calculateLoanDetails } from '../calculationEngine';
import { calculateMonthlyPayment } from '../utils';

describe('Basic Mortgage Calculation Validation', () => {
  // Test B1: Standard Fixed-Rate Mortgage Calculation
  test('B1: Standard Fixed-Rate Mortgage Calculation', () => {
    // Inputs
    const principal = 300000;
    const termYears = 30;
    const interestRate = 4.5;
    
    // Calculate
    const expectedMonthlyPayment = 1520.06;
    const expectedTotalInterest = 247218.51;
    const expectedTotalPaid = principal + expectedTotalInterest;
    
    // Get calculation results
    const results = calculateLoanDetails(principal, [{ startMonth: 1, interestRate: interestRate }], termYears);
    
    // Validate monthly payment
    expect(results.monthlyPayment).toBeCloseTo(expectedMonthlyPayment, 1);
    
    // Validate total interest paid
    expect(results.totalInterest).toBeCloseTo(247219, 0);
    
    // Validate total amount paid
    const calculatedTotalPaid = principal + results.totalInterest;
    expect(calculatedTotalPaid).toBeCloseTo(expectedTotalPaid, 0);
    
    // Validate number of payments
    expect(results.amortizationSchedule.length).toBe(termYears * 12);
    
    // Validate last payment pays off the loan
    expect(results.amortizationSchedule[results.amortizationSchedule.length - 1].balance).toBeCloseTo(0, 1);
  });

  // Test B3: Short-Term High-Interest Loan
  test('B3: Short-Term High-Interest Loan', () => {
    // Inputs
    const principal = 50000;
    const termYears = 5;
    const interestRate = 12;
    
    // Expected values
    const expectedMonthlyPayment = 1112.22;
    const expectedTotalInterest = 16733.20;
    const expectedTotalPaid = principal + expectedTotalInterest;
    
    // Get calculation results
    const results = calculateLoanDetails(principal, [{ startMonth: 1, interestRate: interestRate }], termYears);
    
    // Validate monthly payment
    expect(results.monthlyPayment).toBeCloseTo(1112.22, 1);
    
    // Validate total interest paid
    expect(results.totalInterest).toBeCloseTo(16733.20, 1);
    
    // Validate total amount paid
    const calculatedTotalPaid = principal + results.totalInterest;
    expect(calculatedTotalPaid).toBeCloseTo(expectedTotalPaid, 0);
    
    // Validate number of payments
    expect(results.amortizationSchedule.length).toBe(termYears * 12);
    
    // Validate last payment pays off the loan
    expect(results.amortizationSchedule[results.amortizationSchedule.length - 1].balance).toBeCloseTo(0, 1);
  });

  // Test E3: Near-Zero Interest Rate
  test('E3: Near-Zero Interest Rate', () => {
    // Inputs
    const principal = 300000;
    const termYears = 30;
    const interestRate = 0.1;
    
    // Calculate expected monthly payment for near-zero interest rate
    // This is approximately principal / term in months
    const expectedMonthlyPayment = principal / (termYears * 12);
    const expectedTotalInterest = 0; // This will be very small for near-zero rates
    const expectedTotalPaid = principal + expectedTotalInterest;
    
    // Get calculation results
    const results = calculateLoanDetails(principal, [{ startMonth: 1, interestRate: interestRate }], termYears);
    
    // Validate monthly payment - for near-zero cases, it should be close to principal / term in months
    expect(results.monthlyPayment).toBeCloseTo(expectedMonthlyPayment, 1);
    
    // Validate total interest paid (this will be very small for near-zero rates)
    expect(results.totalInterest).toBeCloseTo(0, 0);
    
    // Validate total amount paid
    const calculatedTotalPaid = principal + results.totalInterest;
    expect(calculatedTotalPaid).toBeCloseTo(principal, 0);
    
    // Validate number of payments
    expect(results.amortizationSchedule.length).toBe(termYears * 12);
    
    // Validate last payment pays off the loan
    expect(results.amortizationSchedule[results.amortizationSchedule.length - 1].balance).toBeCloseTo(0, 1);
  });
});