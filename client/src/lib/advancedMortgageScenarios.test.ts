/**
 * Advanced test scenarios for the mortgage calculation engine
 * Testing complex real-world scenarios with rate changes and multiple overpayments
 */

import {
  calculateComplexScenario
} from './calculationEngine';
import { formatCurrency, formatTimePeriod } from './formatters';
import { calculateBaseMonthlyPayment } from './calculationCore';
import { OverpaymentDetails } from './types';

describe('Advanced Mortgage Scenarios', () => {
  test('Scenario 1: Check initial payment calculation only', async () => {
    // Initial setup: $1,000,000 at 3% for 30 years
    const initialPrincipal = 1000000;
    const initialRate = 3;
    const initialTerm = 30;
    
    // Calculate the expected monthly payment using the standard formula
    const monthlyRate = initialRate / 100 / 12;
    const totalMonths = initialTerm * 12;
    const expectedInitialPayment = calculateBaseMonthlyPayment(initialPrincipal, monthlyRate, totalMonths);
    
    // Set a fixed start date for consistency
    const loanStartDate = new Date(2023, 0, 1); // January 1, 2023
    
    // Create LoanDetails object
    const loanDetails = {
      principal: initialPrincipal,
      loanTerm: initialTerm,
      overpaymentPlans: [],
      startDate: loanStartDate,
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
    const initialPrincipal = 500000;
    const initialRate = 5;
    const initialTerm = 30;
  
    const rateChanges = [
      { month: 36, newRate: 4 } // After month 36 → rate drops starting month 37
    ];
  
    const loanStartDate = new Date(2023, 0, 1); // January 1, 2023
    
    const overpayments: OverpaymentDetails[] = [
      {
        amount: 50000,
        startDate: new Date(2028, 0, 1), // January 1, 2028 (5 years after start)
        startMonth: 60,
        isRecurring: false,
        frequency: 'one-time',
        endMonth: 60
      }
    ];
  
    const loanDetails = {
      principal: initialPrincipal,
      loanTerm: initialTerm,
      overpaymentPlans: [],
      startDate: loanStartDate,
      name: 'Test Loan',
      interestRatePeriods: [{ startMonth: 1, interestRate: initialRate }]
    };
  
    const resultWithOverpayment = await calculateComplexScenario(loanDetails, rateChanges, overpayments);
    const resultWithoutOverpayment = await calculateComplexScenario(loanDetails, rateChanges, []);
  
    // 1) Overpayment applied correctly at month 60 (zero-based: index 59)
    const overpaymentEntry = resultWithOverpayment.amortizationSchedule[59];
    expect(overpaymentEntry.overpaymentAmount).toBeGreaterThan(0);
  
    // 2) Interest savings ≥5%
    expect(resultWithOverpayment.totalInterest).toBeLessThan(resultWithoutOverpayment.totalInterest * 0.95);
  
    // 3) New monthly payment after rate drop (month 37 → index 36)
    const paymentAfterDrop = resultWithoutOverpayment.amortizationSchedule[36].monthlyPayment;
    expect(paymentAfterDrop).toBeCloseTo(2404.89, 0);
  
    // 4) New loan term after overpayment should be reduced
    // The exact value may vary based on implementation details, but should be around 25 years
    expect(resultWithOverpayment.actualTerm).toBeLessThan(resultWithoutOverpayment.actualTerm);
    expect(resultWithOverpayment.actualTerm).toBeGreaterThan(20); // Sanity check
    expect(resultWithOverpayment.actualTerm).toBeLessThan(26); // Sanity check
  
    // Optional: log savings
    console.log('Original term:', resultWithoutOverpayment.actualTerm.toFixed(2), 'years');
    console.log('New term after overpayment:', resultWithOverpayment.actualTerm.toFixed(2), 'years');
    console.log('Interest saved:', 
      (resultWithoutOverpayment.totalInterest - resultWithOverpayment.totalInterest).toFixed(2));
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
    const monthlyRate = initialRate / 100 / 12;
    const totalMonths = initialTerm * 12;
    const baseMonthlyPayment = calculateBaseMonthlyPayment(initialPrincipal, monthlyRate, totalMonths);
    
    // Add extra payment in middle of each year starting from year 5
    const loanStartDate = new Date(2023, 0, 1); // January 1, 2023
    
    for (let year = 5; year < 15; year++) {
      // Calculate the date for this overpayment (middle of the year)
      const overpaymentDate = new Date(loanStartDate);
      overpaymentDate.setFullYear(loanStartDate.getFullYear() + year);
      overpaymentDate.setMonth(loanStartDate.getMonth() + 6);
      
      overpayments.push({
        amount: baseMonthlyPayment,
        startDate: overpaymentDate,
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
      startDate: loanStartDate,
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