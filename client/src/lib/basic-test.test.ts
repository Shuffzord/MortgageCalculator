/**
 * Very simple test file to verify testing infrastructure
 */

import { calculateMonthlyPayment } from './utils';

describe('Basic Payment Calculation', () => {
  test('calculates monthly payment correctly', () => {
    // Test case: $200,000 at 4% for 30 years
    const principal = 200000;
    const rate = 4;
    const term = 30;
    const expectedPayment = 954.83;
    
    const result = calculateMonthlyPayment(principal, rate, term);
    
    // Verify result with tolerance
    expect(result).toBeCloseTo(expectedPayment, 1);
    
    console.log('Payment calculation result:', result.toFixed(2), 'Expected:', expectedPayment);
  });
});