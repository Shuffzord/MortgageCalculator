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
    
    // Expected payment breakdown for specific months
    const expectedBreakdowns = [
      { month: 1, total: 1429.77, interest: 583.33, principal: 846.44 },
      { month: 60, total: 1429.77, interest: 422.26, principal: 1007.51 },
      { month: 120, total: 1429.77, interest: 235.19, principal: 1194.58 },
      { month: 179, total: 1429.77, interest: 6.96, principal: 1422.81 }
    ];
    
    // Calculate loan details
    const results = calculateLoanDetails(principal, interestRate, termYears);
    const schedule = results.amortizationSchedule;
    
    // Test total payment amount is consistent throughout the schedule
    schedule.forEach(payment => {
      expect(Math.round(payment.monthlyPayment * 100) / 100).toBeCloseTo(expectedBreakdowns[0].total, 2);
    });
    
    // Test specific payment breakdowns
    for (const expected of expectedBreakdowns) {
      const actual = schedule[expected.month - 1];
      
      expect(actual.monthlyPayment).toBeCloseTo(expected.total, 2);
      expect(actual.interestPayment).toBeCloseTo(expected.interest, 2);
      expect(actual.principalPayment).toBeCloseTo(expected.principal, 2);
    }
    
    // Verify the final balance is zero
    expect(schedule[schedule.length - 1].balance).toBeCloseTo(0, 2);
    
    // Verify the sum of principal payments equals the original loan amount
    const principalSum = schedule.reduce((sum, payment) => sum + payment.principalPayment, 0);
    expect(principalSum).toBeCloseTo(principal, 0);
    
    // Verify the sum of interest payments equals total interest paid
    const interestSum = schedule.reduce((sum, payment) => sum + payment.interestPayment, 0);
    expect(interestSum).toBeCloseTo(results.totalInterest, 0);
    
    // Verify each payment breakdown adds up correctly
    schedule.forEach(payment => {
      expect(payment.principalPayment + payment.interestPayment).toBeCloseTo(payment.monthlyPayment, 2);
    });
  });
  
  // Test A3: Round-Off Error Accumulation Test
  test('A3: Round-Off Error Accumulation Test', () => {
    // Inputs with non-round numbers to test for rounding issues
    const principal = 333333.33;
    const termYears = 30;
    const interestRate = 4.33;
    
    // Expected monthly payment
    const expectedMonthlyPayment = 1654.55;
    
    // Calculate loan details
    const results = calculateLoanDetails(principal, interestRate, termYears);
    const schedule = results.amortizationSchedule;
    
    // Verify monthly payment calculation
    expect(results.monthlyPayment).toBeCloseTo(expectedMonthlyPayment, 2);
    
    // Verify the final balance is zero
    expect(schedule[schedule.length - 1].balance).toBeCloseTo(0, 2);
    
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
      expect(payment.balance).toBeCloseTo(runningBalance, 2);
    }
  });
});