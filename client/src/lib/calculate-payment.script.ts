/**
 * Simple script to verify payment calculation
 */

// Monthly payment calculation formula
function calculateMonthlyPayment(principal: number, annualRate: number, termYears: number): number {
  // Handle edge case: 0% interest rate
  if (annualRate === 0) {
    return principal / (termYears * 12);
  }
  
  // Convert annual interest rate to monthly decimal rate
  const monthlyRate = annualRate / 100 / 12;
  
  // Calculate number of payments
  const payments = termYears * 12;
  
  // Calculate monthly payment using the formula: M = P[r(1+r)^n]/[(1+r)^n-1]
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, payments)) / 
         (Math.pow(1 + monthlyRate, payments) - 1);
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
  console.log(`Loan: $${testCase.principal.toLocaleString()} at ${testCase.rate}% for ${testCase.term} years`);
  console.log(`Calculated payment: $${result.toFixed(2)}`);
  console.log(`Expected payment: $${testCase.expected}`);
  const difference = Math.abs(result - testCase.expected);
  console.log(`Difference: $${difference.toFixed(2)}`);
  console.log('-------------------');
});