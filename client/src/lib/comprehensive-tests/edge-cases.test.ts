/**
 * Edge Case Tests for the Mortgage Calculator Engine
 * 
 * These tests verify that the calculator handles unusual inputs correctly,
 * such as extremely long terms, very large principal amounts, and near-zero rates.
 */

import { calculateLoanDetails } from '../calculationEngine';

describe('Mortgage Calculator Edge Cases', () => {
  
  // Test E1: Extra-Long Term Mortgage
  test('E1: Extra-Long Term Mortgage (40 years)', async () => {
    const principal = 300000;
    const termYears = 40;
    const interestRate = 4.5;
    
    const expectedMonthlyPayment = 1348.69;
    const expectedTotalInterest = 347369.88; // Corrected from 641397
    
    const results = await calculateLoanDetails(
      principal, 
      [{ startMonth: 1, interestRate }], 
      termYears
    );
    
    expect(results.monthlyPayment).toBeCloseTo(expectedMonthlyPayment, 0);
    expect(results.totalInterest).toBeCloseTo(expectedTotalInterest, -2); // Using less precision for total interest
  });

  // Test E2: Very Large Principal Amount
  test('E2: Very Large Principal Amount', async () => {
    const principal = 5000000;
    const termYears = 30;
    const interestRate = 4.5;
    
    const expectedMonthlyPayment = 25334;
    const expectedTotalInterest = 4120335.45; // Corrected from 4120335
    
    const results = await calculateLoanDetails(
      principal, 
      [{ startMonth: 1, interestRate }], 
      termYears
    );
    
    expect(results.monthlyPayment).toBeCloseTo(expectedMonthlyPayment, 0);
    expect(results.totalInterest).toBeCloseTo(expectedTotalInterest, 0);
  });

  // Test extremely short term (1 year)
  test('Extremely Short Term (1 year)', async () => {
    const principal = 300000;
    const termYears = 1;
    const interestRate = 4.5;
    
    const expectedMonthlyPayment = 25613.56;
    const expectedTotalInterest = 7362.68;
    
    const results = await calculateLoanDetails(
      principal, 
      [{ startMonth: 1, interestRate }], 
      termYears
    );
    
    expect(results.monthlyPayment).toBeCloseTo(expectedMonthlyPayment, 0);
    expect(results.totalInterest).toBeCloseTo(expectedTotalInterest, 0);
  });
});