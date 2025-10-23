import { calculateLoanDetails } from '../calculationEngine';
import { OverpaymentDetails, LoanDetails } from '../types';

describe('Overpayment Fix Verification', () => {
  test('$250,000 loan with 5% interest and $10,000 overpayment in year 5', () => {
    // Setup the loan
    const principal = 250000;
    const interestRate = 5;
    const termYears = 30;

    // Create loan details without overpayment
    const loanDetailsWithoutOverpayment: LoanDetails = {
      principal,
      interestRatePeriods: [{ startMonth: 1, interestRate }],
      loanTerm: termYears,
      overpaymentPlans: [],
      startDate: new Date(),
      name: 'Standard Loan',
    };

    // Calculate standard loan
    const standardResults = calculateLoanDetails(
      principal,
      [{ startMonth: 1, interestRate }],
      termYears
    );

    // Create overpayment plan - $10,000 after 5 years (month 60)
    const overpaymentPlan: OverpaymentDetails = {
      amount: 10000,
      startMonth: 60,
      startDate: new Date(),
      isRecurring: false,
      frequency: 'one-time',
      effect: 'reduceTerm',
    };

    // Create loan details with term reduction overpayment
    const loanDetailsWithTermReduction: LoanDetails = {
      ...loanDetailsWithoutOverpayment,
      overpaymentPlans: [overpaymentPlan],
    };

    // Calculate with term reduction
    const termReductionResults = calculateLoanDetails(
      principal,
      [{ startMonth: 1, interestRate }],
      termYears,
      undefined,
      'equalInstallments',
      undefined,
      [overpaymentPlan]
    );

    // Create payment reduction overpayment
    const paymentReductionPlan: OverpaymentDetails = {
      ...overpaymentPlan,
      effect: 'reducePayment',
    };

    // Calculate with payment reduction
    const paymentReductionResults = calculateLoanDetails(
      principal,
      [{ startMonth: 1, interestRate }],
      termYears,
      undefined,
      'equalInstallments',
      undefined,
      [paymentReductionPlan]
    );

    // Verify standard loan calculations
    expect(standardResults.monthlyPayment).toBeCloseTo(1342.05, 2);
    expect(standardResults.totalInterest).toBeGreaterThan(230000);
    expect(standardResults.totalInterest).toBeLessThan(235000);

    // Verify term reduction results
    console.log('Standard loan term:', standardResults.actualTerm.toFixed(2), 'years');
    console.log('Term reduction term:', termReductionResults.actualTerm.toFixed(2), 'years');
    console.log(
      'Term reduction interest saved:',
      (standardResults.totalInterest - termReductionResults.totalInterest).toFixed(2)
    );

    // 1. Term should be reduced
    expect(termReductionResults.actualTerm).toBeLessThan(termYears);
    // 2. Monthly payment should remain the same
    expect(termReductionResults.monthlyPayment).toBeCloseTo(standardResults.monthlyPayment, 2);
    // 3. Interest saved should be significant (at least $14,000)
    const termReductionInterestSaved =
      standardResults.totalInterest - termReductionResults.totalInterest;
    expect(termReductionInterestSaved).toBeGreaterThan(14000);

    // Verify payment reduction results
    console.log('Payment reduction payment:', paymentReductionResults.monthlyPayment.toFixed(2));
    console.log(
      'Payment reduction interest saved:',
      (standardResults.totalInterest - paymentReductionResults.totalInterest).toFixed(2)
    );

    // 1. Term should remain the same
    expect(Math.round(paymentReductionResults.actualTerm)).toBe(termYears);
    // 2. Monthly payment should be reduced or at least not increased
    expect(paymentReductionResults.monthlyPayment).toBeLessThanOrEqual(
      standardResults.monthlyPayment
    );
    // 3. Interest saved should be less than with term reduction
    const paymentReductionInterestSaved =
      standardResults.totalInterest - paymentReductionResults.totalInterest;
    expect(paymentReductionInterestSaved).toBeGreaterThan(7500);
    expect(paymentReductionInterestSaved).toBeLessThan(termReductionInterestSaved);

    // Verify the overpayment was correctly applied
    const overpaymentPayment = termReductionResults.amortizationSchedule[59]; // Month 60 (index 59)
    expect(overpaymentPayment.isOverpayment).toBe(true);
    expect(overpaymentPayment.overpaymentAmount).toBe(10000);
  });
});
