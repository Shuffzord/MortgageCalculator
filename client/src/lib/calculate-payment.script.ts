/** 
 * Simple script to verify payment calculation 
 */

import { calculateBaseMonthlyPayment } from './calculationCore';

// Monthly payment calculation wrapper function
function calculateMonthlyPayment(principal: number, annualRate: number, termYears: number): number {
  // Convert annual interest rate to monthly decimal rate
  const monthlyRate = annualRate / 100 / 12;
  
  // Calculate number of payments
  const payments = termYears * 12;
  
  // Use the core calculation function
  return calculateBaseMonthlyPayment(principal, monthlyRate, payments);
}

// Test cases
const testCases = [
  { principal: 1000000, rate: 3, term: 30, expected: 4216.04 },
  { principal: 500000, rate: 5, term: 30, expected: 2684.11 },
  { principal: 300000, rate: 2.5, term: 15, expected: 2000.72 }
];

// Run tests
testCases.forEach(testCase => {
  const result = calculateMonthlyPayment(testCase.principal, testCase.rate, testCase.term);
  const difference = Math.abs(result - testCase.expected);
});