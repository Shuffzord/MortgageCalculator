/**
 * Very simple test file to verify testing infrastructure
 */

import { calculateBaseMonthlyPayment } from './calculationCore';

describe('Basic Payment Calculation', () => {
  test('calculates monthly payment correctly', () => {
    // Test case: $200,000 at 4% for 30 years
    const principal = 200000;
    const annualRate = 4;
    const termYears = 30;
    const expectedPayment = 954.83;
    
    // Convert annual rate to monthly decimal (4% -> 0.04 / 12)
    const monthlyRate = annualRate / 100 / 12;
    // Convert years to months
    const totalMonths = termYears * 12;
    
    const result = calculateBaseMonthlyPayment(
      principal,
      monthlyRate,
      totalMonths
    );
    
    // Verify result with tolerance
    expect(result).toBeCloseTo(expectedPayment, 2);
    
    console.log(
      'Payment calculation result:',
      result.toFixed(2),
      'Expected:',
      expectedPayment
    );
  });
});