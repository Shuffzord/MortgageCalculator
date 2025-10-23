/**
 * Simple test suite to verify fixed issues
 */

import { calculateLoanDetails } from './calculationEngine';

describe('Fixed Calculation Issues', () => {
  test('Schedule length should be exact for term length', async () => {
    // 30-year loan should have exactly 360 payments
    const results = await calculateLoanDetails(300000, [{ startMonth: 1, interestRate: 4.5 }], 30);
    expect(results.amortizationSchedule.length).toBe(30 * 12);

    // 5-year loan should have exactly 60 payments
    const shortResults = await calculateLoanDetails(
      50000,
      [{ startMonth: 1, interestRate: 12 }],
      5
    );
    expect(shortResults.amortizationSchedule.length).toBe(5 * 12);

    // 1-year loan should have exactly 12 payments
    const veryShortResults = await calculateLoanDetails(
      100000,
      [{ startMonth: 1, interestRate: 5 }],
      1
    );
    expect(veryShortResults.amortizationSchedule.length).toBe(1 * 12);
  });

  test('Zero principal should be handled gracefully', async () => {
    const results = await calculateLoanDetails(0, [{ startMonth: 1, interestRate: 4.5 }], 30);

    expect(results.monthlyPayment).toBe(0);
    expect(results.totalInterest).toBe(0);
    expect(results.amortizationSchedule.length).toBe(0);
  });

  test('Near-zero rate should calculate correctly', async () => {
    const principal = 300000;
    const termYears = 30;
    const interestRate = 0.1;

    // For near-zero rates, payment should be approximately principal / term in months
    const expectedMonthlyPayment = principal / (termYears * 12);

    const results = await calculateLoanDetails(
      principal,
      [{ startMonth: 1, interestRate: interestRate }],
      termYears
    );
    expect(results.monthlyPayment).toBeCloseTo(expectedMonthlyPayment, 1);
  });
});
