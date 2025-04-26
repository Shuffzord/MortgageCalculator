/**
 * Direct test script for mortgage calculator functions
 * This script runs without Jest to avoid possible timeout issues
 */

import { calculateLoanDetails } from './calculationEngine';
import { calculateMonthlyPayment } from './utils';

// Simple test cases for payment calculation
function testPaymentCalculation() {
  console.log('Testing payment calculation...');
  
  // Test case 1: $200,000 at 4% for 30 years
  const principal1 = 200000;
  const rate1 = 4;
  const term1 = 30;
  const expectedPayment1 = 954.83;
  const result1 = calculateMonthlyPayment(principal1, rate1, term1);
  console.log(`Test case 1: $${principal1} at ${rate1}% for ${term1} years`);
  console.log(`Expected: $${expectedPayment1}, Calculated: $${result1.toFixed(2)}`);
  console.log(`Success: ${Math.abs(result1 - expectedPayment1) < 1 ? 'YES' : 'NO'}`);
  console.log('---');
  
  // Test case 2: $300,000 at 4.5% for 30 years
  const principal2 = 300000;
  const rate2 = 4.5;
  const term2 = 30;
  const expectedPayment2 = 1520.06;
  const result2 = calculateMonthlyPayment(principal2, rate2, term2);
  console.log(`Test case 2: $${principal2} at ${rate2}% for ${term2} years`);
  console.log(`Expected: $${expectedPayment2}, Calculated: $${result2.toFixed(2)}`);
  console.log(`Success: ${Math.abs(result2 - expectedPayment2) < 1 ? 'YES' : 'NO'}`);
  console.log('---');
}

// Basic validation test for full loan calculation
function testBasicLoanCalculation() {
  console.log('Testing basic loan calculation...');
  
  // Standard Fixed-Rate Mortgage Calculation
  const principal = 300000;
  const termYears = 30;
  const interestRate = 4.5;
  
  // Expected values
  const expectedMonthlyPayment = 1520.06;
  const expectedTotalInterest = 247220.13;
  
  console.log(`Calculating loan: $${principal} at ${interestRate}% for ${termYears} years`);
  
  // Get calculation results
  const startTime = Date.now();
  const results = calculateLoanDetails(principal, interestRate, termYears);
  const endTime = Date.now();
  
  console.log(`Calculation time: ${endTime - startTime}ms`);
  console.log(`Monthly payment: $${results.monthlyPayment.toFixed(2)} (expected: $${expectedMonthlyPayment})`);
  console.log(`Total interest: $${results.totalInterest.toFixed(2)} (expected: $${expectedTotalInterest})`);
  console.log(`Total payments: ${results.amortizationSchedule.length}`);
  console.log(`Final balance: $${results.amortizationSchedule[results.amortizationSchedule.length - 1].balance.toFixed(2)}`);
  
  // Check if the results are close to expected values
  const paymentSuccess = Math.abs(results.monthlyPayment - expectedMonthlyPayment) < 1;
  const interestSuccess = Math.abs(results.totalInterest - expectedTotalInterest) < 100;
  
  console.log(`Payment calculation success: ${paymentSuccess ? 'YES' : 'NO'}`);
  console.log(`Total interest calculation success: ${interestSuccess ? 'YES' : 'NO'}`);
}

// Run tests
console.log('=== MORTGAGE CALCULATOR DIRECT TESTS ===');
testPaymentCalculation();
testBasicLoanCalculation();
console.log('=== TESTS COMPLETE ===');