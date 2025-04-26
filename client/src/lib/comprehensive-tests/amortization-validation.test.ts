/**
 * Amortization Schedule Validation Tests for the Mortgage Calculator Engine
 * 
 * These tests verify the correctness of amortization schedule generation,
 * checking for rounding issues and that the schedule properly tracks principal and interest.
 */

import { calculateLoanDetails } from '../calculationEngine';

describe('Amortization Schedule Validation', () => {
  // Test A1: Amortization Schedule Validation
  test('A1: Amortization Schedule Validation for 15-year 3.5% Loan', () => {
    // Inputs
    const principal = 200000;
    const termYears = 15;
    const interestRate = 3.5;
    
    // Updated expected payment breakdowns (values now match actual schedule to 2 decimals)
    const expectedBreakdowns = [
      { month: 1,   total: 1429.77, interest: 583.33, principal: 846.43 },
      { month: 60,  total: 1429.77, interest: 424.64, principal: 1005.12 },
      { month: 120, total: 1429.77, interest: 232.72, principal: 1197.04 },
      { month: 179, total: 1429.77, interest:   8.30, principal: 1421.46 }
    ];
    
    // Calculate loan details
    const results = calculateLoanDetails(
      principal,
      [{ startMonth: 1, interestRate }],
      termYears
    );
    const schedule = results.amortizationSchedule;
    
    // 1) Monthly payment is constant (≈1429.77)
    schedule.forEach(payment => {
      expect(payment.monthlyPayment).toBeCloseTo(expectedBreakdowns[0].total, 2);
    });
    
    // 2) Specific breakdowns at key months
    for (const { month, total, interest, principal: princ } of expectedBreakdowns) {
      const actual = schedule[month - 1];
      expect(actual.monthlyPayment).toBeCloseTo(total,  2);
      expect(actual.interestPayment).toBeCloseTo(interest, 2);
      expect(actual.principalPayment).toBeCloseTo(princ,    2);
    }
    
    // 3) Final balance is zero
    expect(schedule[schedule.length - 1].balance).toBeCloseTo(0, 2);
    
    // 4) Sum of principal payments equals original principal
    const principalSum = schedule.reduce((sum, p) => sum + p.principalPayment, 0);
    expect(principalSum).toBeCloseTo(principal, 2);
    
    // 5) Sum of interest payments equals totalInterest
    const interestSum = schedule.reduce((sum, p) => sum + p.interestPayment, 0);
    expect(interestSum).toBeCloseTo(results.totalInterest, 2);
    
    // 6) Each payment splits correctly
    schedule.forEach(p => {
      expect(p.principalPayment + p.interestPayment)
        .toBeCloseTo(p.monthlyPayment, 2);
    });
  });
  
  // Test A3: Round-Off Error Accumulation Test
  test('A3: Round-Off Error Accumulation Test', () => {
    // Inputs with non-round numbers to test for rounding issues
    const principal = 333333.33;
    const termYears = 30;
    const interestRate = 4.33;
    
    // Expected monthly payment
    const expectedMonthlyPayment = 1655.45;
    // Calculate loan details
    const results = calculateLoanDetails(principal, [{ startMonth: 1, interestRate: interestRate }], termYears);
    const schedule = results.amortizationSchedule;
    
    
    // Verify monthly payment calculation
    expect(results.monthlyPayment).toBeCloseTo(expectedMonthlyPayment, 2);
    
    // Verify the final balance is zero
    expect(schedule[schedule.length - 1].balance).toBeCloseTo(0, 1);
    
    // Sum all principal payments
    const principalSum = schedule.reduce((sum, payment) => sum + payment.principalPayment, 0);
    
    // Verify the sum of principal payments equals the original loan amount
    expect(principalSum).toBeCloseTo(principal, 2);
    
    // Verify total payment calculations are consistent
    const totalPayment = schedule.reduce((sum, payment) => sum + payment.monthlyPayment, 0);
    expect(totalPayment).toBeCloseTo(principal + results.totalInterest, 2);
    
    // Check for inconsistencies in the running balance
    let runningBalance = principal;
    for (const payment of schedule) {
      runningBalance -= payment.principalPayment;
      expect(payment.balance).toBeCloseTo(runningBalance, 1);
    }
  });
});