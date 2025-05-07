import { calculateLoanDetails, performOverpayments } from './calculationEngine';
import { OverpaymentDetails, PaymentData } from './types';

describe('Overpayment Fixes', () => {
  test('Recurring overpayments correctly adjust total interest', () => {
    // Setup a basic loan
    const principal = 200000;
    const interestRatePeriods = [{ startMonth: 0, interestRate: 4.5 }];
    const loanTerm = 30;
    
    // Create a recurring monthly overpayment
    const overpaymentPlans: OverpaymentDetails[] = [
      {
        amount: 200,
        startMonth: 12, // Start after 1 year
        isRecurring: true,
        frequency: 'monthly',
        effect: 'reduceTerm'
      }
    ];
    
    // Calculate loan details with the overpayment
    const results = calculateLoanDetails(
      principal,
      interestRatePeriods,
      loanTerm,
      undefined,
      'equalInstallments',
      undefined,
      overpaymentPlans
    );
    
    // Verify the results
    expect(results).toBeDefined();
    expect(results.amortizationSchedule.length).toBeLessThan(loanTerm * 12);
    
    // Check that total interest is correctly calculated
    const totalInterestFromSchedule = results.amortizationSchedule.reduce(
      (sum, payment) => sum + payment.interestPayment, 
      0
    );
    
    // The total interest in the result should match the sum of all interest payments
    expect(results.totalInterest).toBeCloseTo(totalInterestFromSchedule, 2);
    
    // Verify that the last payment's totalInterest matches the overall totalInterest
    const lastPayment = results.amortizationSchedule[results.amortizationSchedule.length - 1];
    expect(lastPayment.totalInterest).toBeCloseTo(results.totalInterest, 2);
  });
  
  test('Multiple overpayments are correctly applied', () => {
    // Setup a basic loan
    const principal = 200000;
    const interestRatePeriods = [{ startMonth: 0, interestRate: 4.5 }];
    const loanTerm = 30;
    
    // Create multiple overpayments
    const overpaymentPlans: OverpaymentDetails[] = [
      {
        amount: 5000,
        startMonth: 12, // One-time payment after 1 year
        isRecurring: false,
        frequency: 'one-time',
        effect: 'reduceTerm'
      },
      {
        amount: 200,
        startMonth: 24, // Monthly payment starting after 2 years
        isRecurring: true,
        frequency: 'monthly',
        effect: 'reduceTerm'
      }
    ];
    
    // Calculate loan details with the overpayments
    const results = calculateLoanDetails(
      principal,
      interestRatePeriods,
      loanTerm,
      undefined,
      'equalInstallments',
      undefined,
      overpaymentPlans
    );
    
    // Verify the results
    expect(results).toBeDefined();
    
    // Check that the first overpayment is applied at month 12
    const month12Payment = results.amortizationSchedule[11];
    expect(month12Payment.isOverpayment).toBe(true);
    expect(month12Payment.overpaymentAmount).toBeCloseTo(5000, 2);
    
    // Check that the recurring overpayment starts at month 24
    const month24Payment = results.amortizationSchedule[23];
    expect(month24Payment.isOverpayment).toBe(true);
    
    // Verify that total interest is correctly calculated
    const totalInterestFromSchedule = results.amortizationSchedule.reduce(
      (sum, payment) => sum + payment.interestPayment, 
      0
    );
    
    expect(results.totalInterest).toBeCloseTo(totalInterestFromSchedule, 2);
  });
  
  test('APR is calculated correctly', () => {
    // Setup a basic loan
    const principal = 200000;
    const interestRatePeriods = [{ startMonth: 0, interestRate: 4.5 }];
    const loanTerm = 30;
    
    // Calculate loan details
    const results = calculateLoanDetails(
      principal,
      interestRatePeriods,
      loanTerm
    );
    
    // Verify APR is calculated and is greater than or equal to the interest rate
    expect(results.apr).toBeDefined();
    expect(results.apr).toBeGreaterThanOrEqual(4.5);
  });
});