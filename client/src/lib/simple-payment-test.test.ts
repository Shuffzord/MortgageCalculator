/**
 * Very simple test for payment calculation only
 */

import { calculateMonthlyPayment } from './utils';

describe('Payment Calculation', () => {
  test('should calculate correct monthly payment amount', () => {
    // Test case 1: $1,000,000 at 3% for 30 years
    const principal1 = 1000000;
    const rate1 = 3;
    const term1 = 30;
    const expectedPayment1 = 4216.04;
    const result1 = calculateMonthlyPayment(principal1, rate1, term1);
    expect(result1).toBeCloseTo(expectedPayment1, 1);
    
    // Test case 2: $500,000 at 5% for 30 years
    const principal2 = 500000;
    const rate2 = 5;
    const term2 = 30;
    const expectedPayment2 = 2684.11;
    const result2 = calculateMonthlyPayment(principal2, rate2, term2);
    expect(result2).toBeCloseTo(expectedPayment2, 1);
    
    // Test case 3: $300,000 at 2.5% for 15 years
    const principal3 = 300000;
    const rate3 = 2.5;
    const term3 = 15;
    const expectedPayment3 = 2000.72;
    const result3 = calculateMonthlyPayment(principal3, rate3, term3);
    expect(result3).toBeCloseTo(expectedPayment3, 1);
    
    // Print results for verification
    console.log('Test case 1 result:', result1.toFixed(2), 'Expected:', expectedPayment1);
    console.log('Test case 2 result:', result2.toFixed(2), 'Expected:', expectedPayment2);
    console.log('Test case 3 result:', result3.toFixed(2), 'Expected:', expectedPayment3);
  });
});