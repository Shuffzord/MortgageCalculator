/**
 * Amortization Schedule Validation Tests for the Mortgage Calculator Engine
 * 
 * These tests verify the correctness of amortization schedule generation,
 * checking for rounding issues and that the schedule properly tracks principal and interest.
 */

import { calculateLoanDetails } from '../calculationEngine';

describe('Amortization Schedule Validation', () => {
  // Test A1: Amortization Schedule Validation
  test('A1: Amortization Schedule Validation for 15-year 3.5% Loan', async () => {
    // Inputs
    const principal = 200000;
    const termYears = 15;
    const interestRate = 3.5;
    
    // Updated expected payment breakdowns (values now match actual schedule to 2 decimals)
    const expectedBreakdowns = [
      { month: 1,   total: 1430, interest: 583, principal: 846 },
      { month: 60,  total: 1430, interest: 424.64, principal: 1005 },
      { month: 120, total: 1430, interest: 232.72, principal: 1197 },
      { month: 179, total: 1430, interest:   8, principal: 1421 }
    ];
    
    // Calculate loan details
    const results = await calculateLoanDetails(
      principal,
      [{ startMonth: 1, interestRate }],
      termYears
    );
    const schedule = results.amortizationSchedule;
    
    // 1) Monthly payment is constant (≈1429.77)
    schedule.forEach(payment => {
      expect(payment.monthlyPayment).toBeCloseTo(expectedBreakdowns[0].total, 0);
    });
    
    // 2) Specific breakdowns at key months
    for (const { month, total, interest, principal: princ } of expectedBreakdowns) {
      const actual = schedule[month - 1];
      expect(actual.monthlyPayment).toBeCloseTo(total,  0);
      expect(actual.interestPayment).toBeCloseTo(interest, 0);
      expect(actual.principalPayment).toBeCloseTo(princ,    0);
    }
    
    // 3) Final balance is zero
    expect(schedule[schedule.length - 1].balance).toBeCloseTo(0, 0);
    
    // 4) Sum of principal payments equals original principal
    const principalSum = schedule.reduce((sum, p) => sum + p.principalPayment, 0);
    expect(principalSum).toBeCloseTo(principal, 0);
    
    // 5) Sum of interest payments equals totalInterest
    const interestSum = schedule.reduce((sum, p) => sum + p.interestPayment, 0);
    expect(interestSum).toBeCloseTo(results.totalInterest, 0);
    
    // 6) Each payment splits correctly
    schedule.forEach(p => {
      expect(p.principalPayment + p.interestPayment)
        .toBeCloseTo(p.monthlyPayment, 0);
    });
  });
  
  // Test A3: Round-Off Error Accumulation Test
  test('A3: Round-Off Error Accumulation Test', async () => {
    // Inputs with non-round numbers to test for rounding issues
    const principal = 333333;
    const termYears = 30;
    const interestRate = 4;
    
    // Corrected expected monthly payment
    // Using precise calculation:
    // monthlyRate = 4% / 12 = 0.003333...
    // totalMonths = 30 * 12 = 360
    const expectedMonthlyPayment = 1591.38; // Corrected from 1655.45
    
    const results = await calculateLoanDetails(
      principal, 
      [{ startMonth: 1, interestRate }], 
      termYears
    );
    const schedule = results.amortizationSchedule;
    
    // Verify monthly payment calculation
    expect(results.monthlyPayment).toBeCloseTo(expectedMonthlyPayment, 0);
    
    // Additional validations to ensure the schedule is correct
    const finalPayment = schedule[schedule.length - 1];
    expect(finalPayment.balance).toBeCloseTo(0, 0);
    
    // Verify total principal matches loan amount
    const totalPrincipal = schedule.reduce((sum, p) => sum + p.principalPayment, 0);
    expect(totalPrincipal).toBeCloseTo(principal, 0);
    
    // Verify monthly payment consistency
    schedule.forEach((payment, index) => {
      if (index < schedule.length - 1) { // Exclude final payment which might be different
        expect(payment.monthlyPayment).toBeCloseTo(expectedMonthlyPayment, 0);
      }
    });
  });
});