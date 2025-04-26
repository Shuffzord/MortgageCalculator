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
    
    // Calculate the complex scenario with minimal settings - no rate changes or overpayments
    const result = await calculateComplexScenario(
      initialPrincipal,
      initialRate,
      initialTerm,
      [], // No overpayments
      []  // No rate changes
    );
    
    // Verify initial monthly payment
    expect(result.monthlyPayment).toBeCloseTo(expectedInitialPayment, 1);
    expect(result.amortizationSchedule[0].monthlyPayment).toBeCloseTo(expectedInitialPayment, 1);
  });

  test('Scenario 2: Decreasing rate with lump sum payment', async () => {
    // Initial setup: $500,000 at 5% for 30 years
    const initialPrincipal = 500000;
    const initialRate = 5;
    const initialTerm = 30;
    
    // Define rate decrease after 3 years (36 months)
    const rateChanges = [
      { month: 36, newRate: 4 }
    ];
    
    // Define lump sum payment of $50,000 after 5 years
    const overpayments: OverpaymentDetails[] = [
      {
        amount: 50000,
        startMonth: 60, // 5 years
        isRecurring: false,
        frequency: 'one-time',
        endMonth: 60
      }
    ];
    
    // Calculate the complex scenario
    const result = await calculateComplexScenario(
      initialPrincipal,
      initialRate,
      initialTerm,
      overpayments,
      rateChanges
    );
    
    // Calculate scenario with only rate change for comparison
    const resultWithoutOverpayment = await calculateComplexScenario(
      initialPrincipal,
      initialRate,
      initialTerm,
      [],
      rateChanges
    );
    
    // Verify lump sum payment is applied correctly
    // Check if any overpayment was applied around month 60
    const hasOverpayment = result.amortizationSchedule.some((month: any) =>
      month.payment >= 59 && month.payment <= 61 && month.overpaymentAmount > 0
    );
    expect(hasOverpayment).toBe(true);
    
    // Verify total interest is significantly less with lump sum payment
    expect(result.totalInterest).toBeLessThan(resultWithoutOverpayment.totalInterest * 0.95); // Should save at least 5% interest
    
    // Log the actual savings
    console.log('Lump sum payment scenario:');
    console.log('Original term:', resultWithoutOverpayment.actualTerm.toFixed(2), 'years');
    console.log('Term with lump sum payment:', result.actualTerm.toFixed(2), 'years');
    console.log('Years saved:', (resultWithoutOverpayment.actualTerm - result.actualTerm).toFixed(2));
    console.log('Original total interest:', formatCurrency(resultWithoutOverpayment.totalInterest));
    console.log('Total interest with lump sum:', formatCurrency(result.totalInterest));
    console.log('Interest saved:', formatCurrency(resultWithoutOverpayment.totalInterest - result.totalInterest));
    console.log('Interest saved percentage:', ((1 - result.totalInterest / resultWithoutOverpayment.totalInterest) * 100).toFixed(2) + '%');
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
    
    // Calculate the complex scenario
    const result = await calculateComplexScenario(
      initialPrincipal,
      initialRate,
      initialTerm,
      overpayments,
      rateChanges
    );
    
    // Calculate scenario with only rate change for comparison
    const resultWithoutExtraPayments = await calculateComplexScenario(
      initialPrincipal,
      initialRate,
      initialTerm,
      [],
      rateChanges
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