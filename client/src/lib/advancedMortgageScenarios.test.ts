/**
 * Advanced test scenarios for the mortgage calculation engine
 * Testing complex real-world scenarios with rate changes and multiple overpayments
 */

import {
  calculateComplexScenario
} from './calculationEngine';
import { calculateMonthlyPayment } from './utils';
import { formatCurrency, formatTimePeriod } from './utils';
import { OverpaymentDetails } from './types';

describe('Advanced Mortgage Scenarios', () => {
  test('Scenario 1: Check initial payment calculation only', async () => {
    // Initial setup: $1,000,000 at 3% for 30 years
    const initialPrincipal = 1000000;
    const initialRate = 3;
    const initialTerm = 30;
    
    // Calculate the expected monthly payment using the standard formula
    const expectedInitialPayment = calculateMonthlyPayment(initialPrincipal, initialRate, initialTerm);
    
    // Create LoanDetails object
    const loanDetails = {
      principal: initialPrincipal,
      loanTerm: initialTerm,
      overpaymentPlans: [],
      startDate: new Date(),
      name: 'Test Loan',
      interestRatePeriods: [{ startMonth: 1, interestRate: initialRate }]
    };

    // Calculate the complex scenario with minimal settings - no rate changes or overpayments
    const result = await calculateComplexScenario(
      loanDetails,
      [],
      []
    );

    // Verify initial monthly payment
    expect(result.monthlyPayment).toBeCloseTo(4216.04, 1);
    expect(result.amortizationSchedule[0].monthlyPayment).toBeCloseTo(4216.04, 1);
  });

  test('Scenario 2: Decreasing rate with lump sum payment', async () => {
    // Initial setup: $500,000 at 5% for 30 years
    const initialPrincipal = 500000;
    const initialRate = 5;
    const initialTerm = 30;
    
    // Rate drops to 4% after 36 months
    const rateChanges = [
      { month: 36, newRate: 4 }
    ];
    
    // One-time $50k overpayment at month 60
    const overpayments: OverpaymentDetails[] = [
      {
        amount: 50000,
        startMonth: 60,
        isRecurring: false,
        frequency: 'one-time',
        endMonth: 60
      }
    ];
    
    // Base loan details
    const loanDetails = {
      principal: initialPrincipal,
      loanTerm: initialTerm,
      overpaymentPlans: [] as OverpaymentDetails[],
      startDate: new Date(),
      name: 'Test Loan',
      interestRatePeriods: [{ startMonth: 1, interestRate: initialRate }]
    };
  
    // Run with and without the lump sum
    const result = await calculateComplexScenario(loanDetails, rateChanges, overpayments);
    const resultNo = await calculateComplexScenario(loanDetails, rateChanges, []);
    
    // 1) Overpayment applied at month 60?
    const hasOverpayment = result.amortizationSchedule.some(p =>
      p.month >= 59 && p.month <= 61 && p.overpaymentAmount > 0
    );
    expect(hasOverpayment).toBe(true);
  
    // 2) ≥5% interest saving
    expect(result.totalInterest).toBeLessThan(resultNo.totalInterest * 0.95);
  
    // — new assertions —
  
    // 3) Payment after rate drop (month 37) ≈ $2,407.80
    const payAfterDrop = resultNo.amortizationSchedule.find(p => p.month === 37)!.monthlyPayment;
    expect(payAfterDrop).toBeCloseTo(2407.80, 2);
  
    // 4) New term ≈ 25.75 years
    expect(result.actualTerm).toBeCloseTo(25.75, 2);
  
    // Optional: log detailed savings
    console.log('Original term:', resultNo.actualTerm.toFixed(2), 'years');
    console.log('New term:', result.actualTerm.toFixed(2), 'years');
    console.log('Interest saved:', 
      (resultNo.totalInterest - result.totalInterest).toFixed(2));
  });
  

  test('Scenario 3: Increasing rate with bi-weekly payments', async () => {
    // Initial setup: $300,000 at 2.5% for 15 years
    const initialPrincipal = 300000;
    const initialRate = 2.5;
    const initialTerm = 15;
    
    // Define rate increase after 5 years (60 months)
    const rateChanges = [
      { month: 60, newRate: 4.5 }
    ];
    
    // Simulate bi-weekly payments by adding an extra monthly payment per year
    // (26 bi-weekly payments = 13 monthly payments, so 1 extra per year)
    const overpayments: OverpaymentDetails[] = [];
    
    // Calculate the base monthly payment
    const baseMonthlyPayment = calculateMonthlyPayment(initialPrincipal, initialRate, initialTerm);
    
    // Add extra payment in middle of each year starting from year 5
    for (let year = 5; year < 15; year++) {
      overpayments.push({
        amount: baseMonthlyPayment,
        startMonth: year * 12 + 6, // Middle of each year
        isRecurring: false,
        frequency: 'one-time',
        endMonth: year * 12 + 6
      });
    }
    // Create LoanDetails object
    const loanDetails = {
      principal: initialPrincipal,
      loanTerm: initialTerm,
      overpaymentPlans: [],
      startDate: new Date(),
      name: 'Test Loan',
      interestRatePeriods: [{ startMonth: 1, interestRate: initialRate }]
    };

    // Calculate the complex scenario
    const result = await calculateComplexScenario(
      loanDetails,
      rateChanges,
      overpayments
    );

    // Calculate scenario with only rate change for comparison
    const resultWithoutExtraPayments = await calculateComplexScenario(
      loanDetails,
      rateChanges,
      []
    );

    
    // Verify loan term is reduced due to extra payments or total interest is less
    expect(result.totalInterest).toBeLessThanOrEqual(resultWithoutExtraPayments.totalInterest);
    
    // Verify total interest is less than it would be with just the rate increase
    expect(result.totalInterest).toBeLessThan(resultWithoutExtraPayments.totalInterest);
    
    // Log the time and interest savings
    console.log('Bi-weekly payment scenario:');
    console.log('Term with rate change only:', formatTimePeriod(resultWithoutExtraPayments.actualTerm * 12));
    console.log('Term with bi-weekly payments:', formatTimePeriod(result.actualTerm * 12));
    console.log('Time saved:', formatTimePeriod((resultWithoutExtraPayments.actualTerm - result.actualTerm) * 12));
    console.log('Interest saved:', formatCurrency(resultWithoutExtraPayments.totalInterest - result.totalInterest));
  });
});