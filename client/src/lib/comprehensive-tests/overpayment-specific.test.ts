import { calculateLoanDetails } from '../calculationEngine';
import { applyOverpayment } from '../overpaymentCalculator';
import { LoanDetails } from '../types';

describe('Specific Overpayment Scenarios', () => {
  test('One-time $10,000 overpayment on a $250,000 loan with 5% interest rate', () => {
    // Setup the loan
    const principal = 250000;
    const interestRate = 5;
    const termYears = 30;
    const overpaymentAmount = 10000;
    const overpaymentMonth = 60; // After 5 years
    
    // Create loan details
    const loanDetails: LoanDetails = {
      principal,
      interestRatePeriods: [{ startMonth: 1, interestRate }],
      loanTerm: termYears,
      overpaymentPlans: [],
      startDate: new Date(),
      name: 'Test Loan'
    };
    
    // Calculate standard loan without overpayment
    const standardResults = calculateLoanDetails(
      principal,
      [{ startMonth: 1, interestRate }],
      termYears
    );
    
    // Calculate with term reduction
    const termReductionResults = applyOverpayment(
      standardResults.amortizationSchedule,
      overpaymentAmount,
      overpaymentMonth,
      loanDetails,
      'reduceTerm'
    );
    
    // Calculate with payment reduction
    const paymentReductionResults = applyOverpayment(
      standardResults.amortizationSchedule,
      overpaymentAmount,
      overpaymentMonth,
      loanDetails,
      'reducePayment'
    );
    
    // Verify standard loan calculations
    expect(standardResults.monthlyPayment).toBeCloseTo(1342.05, 2);
    expect(standardResults.totalInterest).toBeGreaterThan(230000);
    expect(standardResults.totalInterest).toBeLessThan(235000);
    
    // Verify term reduction results
    // 1. Term should be reduced
    expect(termReductionResults.actualTerm).toBeLessThan(termYears);
    // 2. Monthly payment should remain the same
    expect(termReductionResults.monthlyPayment).toBeCloseTo(standardResults.monthlyPayment, 2);
    // 3. Interest saved should be significant
    const termReductionInterestSaved = standardResults.totalInterest - termReductionResults.totalInterest;
    expect(termReductionInterestSaved).toBeGreaterThan(14000); // Should save at least $14,000
    
    // Verify payment reduction results
    // 1. Term should remain the same
    expect(Math.round(paymentReductionResults.actualTerm)).toBe(termYears);
    // 2. Monthly payment should be reduced
    expect(paymentReductionResults.monthlyPayment).toBeLessThan(standardResults.monthlyPayment);
    // 3. Interest saved should be less than with term reduction
    const paymentReductionInterestSaved = standardResults.totalInterest - paymentReductionResults.totalInterest;
    expect(paymentReductionInterestSaved).toBeGreaterThan(7500); // Should save at least $7,500
    expect(paymentReductionInterestSaved).toBeLessThan(termReductionInterestSaved); // But less than term reduction
    
    // Verify the overpayment was correctly applied
    const overpaymentPayment = termReductionResults.amortizationSchedule[overpaymentMonth - 1];
    expect(overpaymentPayment.isOverpayment).toBe(true);
    expect(overpaymentPayment.overpaymentAmount).toBe(overpaymentAmount);
    
    // Print results for analysis
    console.log('Standard Loan:', {
      monthlyPayment: standardResults.monthlyPayment,
      totalInterest: standardResults.totalInterest,
      term: standardResults.actualTerm
    });
    
    console.log('Term Reduction:', {
      monthlyPayment: termReductionResults.monthlyPayment,
      totalInterest: termReductionResults.totalInterest,
      term: termReductionResults.actualTerm,
      interestSaved: termReductionInterestSaved
    });
    
    console.log('Payment Reduction:', {
      monthlyPayment: paymentReductionResults.monthlyPayment,
      totalInterest: paymentReductionResults.totalInterest,
      term: paymentReductionResults.actualTerm,
      interestSaved: paymentReductionInterestSaved
    });
  });
});