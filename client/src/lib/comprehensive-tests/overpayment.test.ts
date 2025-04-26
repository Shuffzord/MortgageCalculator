/**
 * Overpayment Tests for the Mortgage Calculator Engine
 * 
 * These tests verify various scenarios with different types of overpayments,
 * including one-time lump sums and regular recurring payments.
 */

import { calculateLoanDetails, applyOverpayment } from '../calculationEngine';
import { OverpaymentDetails } from '../types';

describe('Mortgage Overpayment Calculations', () => {
  // Test O1: One-Time Overpayment with Term Reduction
  test('O1: One-Time Overpayment with Term Reduction', async () => {
    // Inputs
    const principal = 300000;
    const termYears = 30;
    const interestRate = 4.5;
    const overpaymentMonth = 60; // After 5 years
    const overpaymentAmount = 50000;
    
    // Expected values
    const expectedNewTerm = 23 * 12; // ~22 years 8 months (rounded to 23 years for easier testing)
    const expectedInterestSaved = 71500; // Approximate value
    
    // First calculate the standard loan
    const standardResults = await calculateLoanDetails(principal, [{ startMonth: 1, interestRate: interestRate }], termYears);
    const standardTotalInterest = standardResults.totalInterest;
    
    // Apply overpayment with term reduction
    const overpaymentResults = await applyOverpayment(
      standardResults.amortizationSchedule, 
      overpaymentAmount, 
      overpaymentMonth,
      'reduceTerm'
    );
    
    // Validate the new term is shorter than the original
    expect(overpaymentResults.newCalculation.actualTerm).toBeLessThan(termYears);
    
    // Verify that the new term is close to the expected term
    expect(overpaymentResults.newCalculation.actualTerm * 12).toBeLessThanOrEqual(expectedNewTerm);
    
    // Verify interest savings
    const interestSavings = standardTotalInterest - overpaymentResults.newCalculation.totalInterest;
    expect(interestSavings).toBeGreaterThan(expectedInterestSaved * 0.8); // Allow 20% tolerance
    
    // Verify monthly payment remains the same
    expect(overpaymentResults.newCalculation.monthlyPayment).toBeCloseTo(standardResults.monthlyPayment, 0);
  });
  
  // Test O2: One-Time Overpayment with Payment Reduction
  test('O2: One-Time Overpayment with Payment Reduction', async () => {
    // Inputs
    const principal = 300000;
    const termYears = 30;
    const interestRate = 4.5;
    const overpaymentMonth = 60; // After 5 years
    const overpaymentAmount = 50000;
    
    // Expected values
    const originalMonthlyPayment = 1520.06;
    const expectedNewMonthlyPayment = 1266.72; // Approximate value
    const expectedInterestSaved = 38220; // Approximate value
    
    // First calculate the standard loan
    const standardResults = await calculateLoanDetails(principal, [{ startMonth: 1, interestRate: interestRate }], termYears);
    const standardTotalInterest = standardResults.totalInterest;
    
    // Apply overpayment with payment reduction
    const overpaymentResults = await applyOverpayment(
      standardResults.amortizationSchedule, 
      overpaymentAmount, 
      overpaymentMonth,
      'reducePayment'
    );
    
    // Validate the term stays the same
    expect(Math.round(overpaymentResults.newCalculation.actualTerm)).toBe(termYears);
    
    // Verify the new monthly payment is lower
    expect(overpaymentResults.newCalculation.monthlyPayment).toBeLessThan(originalMonthlyPayment);
    
    // Verify the new monthly payment is close to expected
    expect(overpaymentResults.newCalculation.monthlyPayment).toBeCloseTo(expectedNewMonthlyPayment, 1);
    
    // Verify interest savings
    const interestSavings = standardTotalInterest - overpaymentResults.newCalculation.totalInterest;
    expect(interestSavings).toBeGreaterThan(expectedInterestSaved * 0.8); // Allow 20% tolerance
  });

  test('O3: Regular Monthly Overpayments', async () => {
    // Inputs
    const principal = 300000;
    const termYears = 30;
    const interestRate = 4.5;
    
    // Define a regular monthly overpayment
    const overpaymentPlan: OverpaymentDetails = {
      amount: 200,
      startMonth: 1,
      endMonth: 360, // Full term
      isRecurring: true,
      frequency: 'monthly'
    };
    
    // Expected values
    const expectedNewTermMonths = 25 * 12; // ~25 years (300 months)
    const expectedInterestSaved = 53420; // Approximate value
    
    // Calculate with monthly overpayments
    const results = await calculateLoanDetails(principal, [{ startMonth: 1, interestRate: interestRate }], termYears, overpaymentPlan);
    
    // Calculate standard loan for comparison
    const standardResults = await calculateLoanDetails(principal, [{ startMonth: 1, interestRate: interestRate }], termYears);
    
    // 1) Validate the new term is shorter than the original term
    expect(results.actualTerm).toBeLessThan(termYears);
    
    // 2) Verify that the new term is close to the expected term
    expect(results.actualTerm * 12).toBeCloseTo(expectedNewTermMonths, 0); // Allow exact matching
    
    // 3) Verify interest savings within a reasonable tolerance (e.g., 20% tolerance)
    const interestSavings = standardResults.totalInterest - results.totalInterest;
    expect(interestSavings).toBeGreaterThan(expectedInterestSaved * 0.8); // Allow 20% tolerance
    expect(interestSavings).toBeLessThan(expectedInterestSaved * 1.2); // Ensure savings do not exceed 120% of expected
    
    // Optionally log values to verify
    console.log('Original Term:', standardResults.actualTerm, 'years');
    console.log('New Term with Overpayment:', results.actualTerm, 'years');
    console.log('Interest Saved:', interestSavings);
  });
});