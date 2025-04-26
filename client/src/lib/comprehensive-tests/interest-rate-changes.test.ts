/**
 * Interest Rate Change Tests for the Mortgage Calculator Engine
 * 
 * These tests verify scenarios with interest rate changes during
 * the life of the loan, including both simple and complex changes.
 */

import { calculateLoanDetails, calculateComplexScenario } from '../calculationEngine';

describe('Mortgage Calculations with Interest Rate Changes', () => {
  // Test I1: One-Time Interest Rate Change
  test('I1: One-Time Interest Rate Change', async () => {
    // Inputs
    const principal = 300000;
    const termYears = 30;
    const initialRate = 4.5;
    const newRate = 5.5;
    const changeAtMonth = 120; // After 10 years
    
    // Expected values
    const initialMonthlyPayment = 1520.06;
    const newMonthlyPayment = 1702.80;
    const expectedTotalInterest = 308548.32;
    
    // Create LoanDetails object
    const loanDetails = {
      principal: principal,
      loanTerm: termYears,
      overpaymentPlans: [],
      startDate: new Date(),
      name: 'Test Loan',
      interestRatePeriods: [{ startMonth: 1, interestRate: initialRate }]
    };

    // Calculate using complex scenario function
    const results = await calculateComplexScenario(
      loanDetails,
      [{ month: changeAtMonth, newRate: newRate }],
      [] // No overpayments
    );

    // Validate initial monthly payment
    expect(results.monthlyPayment).toBeCloseTo(initialMonthlyPayment, 1);
    
    // Validate payment after rate change (at index changeAtMonth - 1)
    expect(results.amortizationSchedule[changeAtMonth - 1].monthlyPayment).toBeCloseTo(newMonthlyPayment, 1);
    
    // Validate total interest paid
    expect(results.totalInterest).toBeCloseTo(expectedTotalInterest, 0);
    
    // Validate that interest portion increases after the rate change
    const beforeChangeInterestPortion = results.amortizationSchedule[changeAtMonth - 1].interestPayment;
    const afterChangeInterestPortion = results.amortizationSchedule[changeAtMonth].interestPayment;
    expect(afterChangeInterestPortion).toBeGreaterThan(beforeChangeInterestPortion);
  });
  
  // Test I2: Multiple Scheduled Interest Rate Changes
  test('I2: Multiple Scheduled Interest Rate Changes', async () => {
    // Inputs
    const principal = 300000;
    const termYears = 30;
    const initialRate = 3.5;
    
    // Expected values at each rate change
    const expectedPayments = [
      { rate: 3.5, payment: 1347.13 },
      { rate: 4.0, payment: 1454.80 },
      { rate: 4.5, payment: 1567.37 },
      { rate: 5.0, payment: 1680.33 },
      { rate: 4.5, payment: 1623.55 }
    ];
    
    // Define rate changes
    const rateChanges = [
      { month: 60, newRate: 4.0 },   // 5 years
      { month: 120, newRate: 4.5 },  // 10 years
      { month: 180, newRate: 5.0 },  // 15 years
      { month: 240, newRate: 4.5 }   // 20 years
    ];
    // Create LoanDetails object
    const loanDetails = {
      principal: principal,
      loanTerm: termYears,
      overpaymentPlans: [],
      startDate: new Date(),
      name: 'Test Loan',
      interestRatePeriods: [{ startMonth: 1, interestRate: initialRate }]
    };

    // Calculate using complex scenario function
    const results = await calculateComplexScenario(
      loanDetails,
      rateChanges,
      [] // No overpayments
    );

    
    // Validate initial monthly payment
    expect(results.monthlyPayment).toBeCloseTo(expectedPayments[0].payment, 1);
    
    // Validate payments after each rate change
    expect(results.amortizationSchedule[60].monthlyPayment).toBeCloseTo(expectedPayments[1].payment, 1);
    expect(results.amortizationSchedule[120].monthlyPayment).toBeCloseTo(expectedPayments[2].payment, 1);
    expect(results.amortizationSchedule[180].monthlyPayment).toBeCloseTo(expectedPayments[3].payment, 1);
    expect(results.amortizationSchedule[240].monthlyPayment).toBeCloseTo(expectedPayments[4].payment, 1);
    
    // Validate that the final loan balance is $0
    expect(results.amortizationSchedule[results.amortizationSchedule.length - 1].balance).toBeCloseTo(0, 1);
  });
  
  // Test combined rate changes and overpayments
  test('Combined Rate Changes with Overpayments', async () => {
    // Inputs
    const principal = 300000;
    const termYears = 30;
    const initialRate = 4.0;
    
    // Define rate changes
    const rateChanges = [
      { month: 60, newRate: 4.5 }  // Rate change after 5 years
    ];
    
    // Define overpayments - $200 extra per month starting after the rate change
    const overpayments = [
      {
        amount: 200,
        startMonth: 61,
        endMonth: 360,
        isRecurring: true,
        frequency: 'monthly' as 'monthly' | 'quarterly' | 'annual' | 'one-time'
      }
    ];
    // Create LoanDetails object
    const loanDetails = {
      principal: principal,
      loanTerm: termYears,
      overpaymentPlans: [],
      startDate: new Date(),
      name: 'Test Loan',
      interestRatePeriods: [{ startMonth: 1, interestRate: initialRate }]
    };

    // First calculate with just the rate change
    const resultsWithRateChangeOnly = await calculateComplexScenario(
      loanDetails,
      rateChanges,
      [] // No overpayments
    );

    // Then calculate with both rate change and overpayments
    const resultsWithBoth = await calculateComplexScenario(
      loanDetails,
      rateChanges,
      overpayments
    );

    
    // Validate that adding overpayments reduces the term
    expect(resultsWithBoth.actualTerm).toBeLessThan(resultsWithRateChangeOnly.actualTerm);
    
    // Validate that adding overpayments saves interest
    expect(resultsWithBoth.totalInterest).toBeLessThan(resultsWithRateChangeOnly.totalInterest);
    
    // Verify that monthly payments increase after the rate change
    const beforeChangePayment = resultsWithBoth.amortizationSchedule[59].monthlyPayment;
    const afterChangePayment = resultsWithBoth.amortizationSchedule[60].monthlyPayment;
    expect(afterChangePayment).toBeGreaterThan(beforeChangePayment);
    
    // Verify that overpayments are correctly applied after the rate change
    expect(resultsWithBoth.amortizationSchedule[61].overpaymentAmount).toBe(200);
  });
});