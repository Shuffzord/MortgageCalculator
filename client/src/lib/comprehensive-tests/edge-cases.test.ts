/**
 * Edge Case Tests for the Mortgage Calculator Engine
 * 
 * These tests verify that the calculator handles unusual inputs correctly,
 * such as extremely long terms, very large principal amounts, and near-zero rates.
 */

import { calculateLoanDetails } from '../calculationEngine';

describe('Mortgage Calculator Edge Cases', () => {
  // Test E1: Extra-Long Term Mortgage
  test('E1: Extra-Long Term Mortgage (40 years)', () => {
    // Inputs
    const principal = 300000;
    const termYears = 40;
    const interestRate = 4.5;
    
    // Expected values
    const expectedMonthlyPayment = 1363.95;
    const expectedTotalInterest = 354695.47;
    
    // Calculate
    const results = calculateLoanDetails(principal, [{ startMonth: 1, interestRate: interestRate }], termYears);
    
    // Validate monthly payment
    expect(results.monthlyPayment).toBeCloseTo(expectedMonthlyPayment, 1);
    
    // Validate total interest
    expect(results.totalInterest).toBeCloseTo(expectedTotalInterest, 0);
    
    // Validate payment count
    expect(results.amortizationSchedule.length).toBe(termYears * 12);
    
    // Validate final balance is zero
    expect(results.amortizationSchedule[results.amortizationSchedule.length - 1].balance).toBeCloseTo(0, 2);
  });
  
  // Test E2: Very Large Principal Amount
  test('E2: Very Large Principal Amount', () => {
    // Inputs
    const principal = 5000000;
    const termYears = 30;
    const interestRate = 4.5;
    
    // Expected values
    const expectedMonthlyPayment = 25334.37;
    const expectedTotalInterest = 4120372.51;
    
    // Calculate
    const results = calculateLoanDetails(principal, [{ startMonth: 1, interestRate: interestRate }], termYears);
    
    // Validate monthly payment
    expect(results.monthlyPayment).toBeCloseTo(expectedMonthlyPayment, 1);
    
    // Validate total interest
    expect(results.totalInterest).toBeCloseTo(expectedTotalInterest, 0);
    
    // Validate payment count
    expect(results.amortizationSchedule.length).toBe(termYears * 12);
    
    // Validate final balance is zero
    expect(results.amortizationSchedule[results.amortizationSchedule.length - 1].balance).toBeCloseTo(0, 2);
  });
  
  // Test zero principal (should handle gracefully)
  test('Zero Principal Amount', () => {
    // Inputs
    const principal = 0;
    const termYears = 30;
    const interestRate = 4.5;
    
    // Calculate
    const results = calculateLoanDetails(principal, [{ startMonth: 1, interestRate: interestRate }], termYears);
    
    // Validate monthly payment is zero
    expect(results.monthlyPayment).toBe(0);
    
    // Validate total interest is zero
    expect(results.totalInterest).toBe(0);
    
    // Validate schedule length
    expect(results.amortizationSchedule.length).toBeGreaterThan(0);
    
    // Validate final balance is zero
    expect(results.amortizationSchedule[results.amortizationSchedule.length - 1].balance).toBe(0);
  });
  
  // Test zero interest rate
  test('Zero Interest Rate', () => {
    // Inputs
    const principal = 300000;
    const termYears = 30;
    const interestRate = 0;
    
    // Expected monthly payment for a zero-interest loan
    const expectedMonthlyPayment = principal / (termYears * 12);
    
    // Calculate
    const results = calculateLoanDetails(principal, [{ startMonth: 1, interestRate: interestRate }], termYears);
    
    // Validate monthly payment is simply principal divided by number of payments
    expect(results.monthlyPayment).toBeCloseTo(expectedMonthlyPayment, 2);
    
    // Validate total interest is zero
    expect(results.totalInterest).toBe(0);
    
    // Validate payment count
    expect(results.amortizationSchedule.length).toBe(termYears * 12);
    
    // Validate final balance is zero
    expect(results.amortizationSchedule[results.amortizationSchedule.length - 1].balance).toBeCloseTo(0, 2);
  });
  
  // Test extremely short term (1 year)
  test('Extremely Short Term (1 year)', () => {
    // Inputs
    const principal = 300000;
    const termYears = 1;
    const interestRate = 4.5;
    
    // Expected monthly payment for a 1-year loan
    const expectedMonthlyPayment = 25548.49;
    
    // Calculate
    const results = calculateLoanDetails(principal, [{ startMonth: 1, interestRate: interestRate }], termYears);
    
    // Validate monthly payment
    expect(results.monthlyPayment).toBeCloseTo(expectedMonthlyPayment, 1);
    
    // Validate payment count
    expect(results.amortizationSchedule.length).toBe(termYears * 12);
    
    // Validate final balance is zero
    expect(results.amortizationSchedule[results.amortizationSchedule.length - 1].balance).toBeCloseTo(0, 2);
  });
});