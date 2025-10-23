import { calculateLoanDetails } from '../calculationEngine';
import { LoanDetails, RepaymentModel } from '../types';

describe('Repayment Model Tests', () => {
  test('RM1: Equal Installments Model (Annuity)', () => {
    // Inputs
    const principal = 200000;
    const termYears = 15;
    const interestRate = 3.5;

    const loanDetails: LoanDetails = {
      principal,
      interestRatePeriods: [{ startMonth: 1, interestRate }],
      loanTerm: termYears,
      overpaymentPlans: [],
      startDate: new Date(),
      name: 'Test Loan',
      repaymentModel: 'equalInstallments',
    };

    // Calculate loan details
    const results = calculateLoanDetails(
      loanDetails.principal,
      loanDetails.interestRatePeriods,
      loanDetails.loanTerm,
      undefined,
      loanDetails.repaymentModel
    );

    const schedule = results.amortizationSchedule;

    // 1) First payment should be equal to last payment (except for rounding differences)
    expect(
      Math.abs(schedule[0].monthlyPayment - schedule[schedule.length - 2].monthlyPayment)
    ).toBeLessThan(0.1);

    // 2) Principal portion should increase over time
    expect(schedule[1].principalPayment).toBeGreaterThan(schedule[0].principalPayment);
    expect(schedule[schedule.length / 2].principalPayment).toBeGreaterThan(
      schedule[0].principalPayment
    );

    // 3) Interest portion should decrease over time
    expect(schedule[1].interestPayment).toBeLessThan(schedule[0].interestPayment);
    expect(schedule[schedule.length / 2].interestPayment).toBeLessThan(schedule[0].interestPayment);
  });

  test('RM2: Decreasing Installments Model', () => {
    // Inputs
    const principal = 200000;
    const termYears = 15;
    const interestRate = 3.5;

    const loanDetails: LoanDetails = {
      principal,
      interestRatePeriods: [{ startMonth: 1, interestRate }],
      loanTerm: termYears,
      overpaymentPlans: [],
      startDate: new Date(),
      name: 'Test Loan',
      repaymentModel: 'decreasingInstallments',
    };

    // Calculate loan details
    const results = calculateLoanDetails(
      loanDetails.principal,
      loanDetails.interestRatePeriods,
      loanDetails.loanTerm,
      undefined,
      loanDetails.repaymentModel
    );

    const schedule = results.amortizationSchedule;

    // 1) First payment should be higher than last payment
    expect(schedule[0].monthlyPayment).toBeGreaterThan(
      schedule[schedule.length - 2].monthlyPayment
    );

    // 2) Principal portion should be constant (except for rounding differences)
    const principalPortion = principal / (termYears * 12);
    expect(Math.abs(schedule[0].principalPayment - principalPortion)).toBeLessThan(0.1);
    expect(Math.abs(schedule[1].principalPayment - principalPortion)).toBeLessThan(0.1);
    expect(
      Math.abs(schedule[schedule.length / 2].principalPayment - principalPortion)
    ).toBeLessThan(0.1);

    // 3) Interest portion should decrease over time
    expect(schedule[1].interestPayment).toBeLessThan(schedule[0].interestPayment);
    expect(schedule[schedule.length / 2].interestPayment).toBeLessThan(schedule[0].interestPayment);

    // 4) Total payment should decrease over time
    expect(schedule[1].monthlyPayment).toBeLessThan(schedule[0].monthlyPayment);
    expect(schedule[schedule.length / 2].monthlyPayment).toBeLessThan(schedule[0].monthlyPayment);
  });

  test('RM3: Compare Equal vs Decreasing Installments', () => {
    // Inputs
    const principal = 200000;
    const termYears = 15;
    const interestRate = 3.5;

    // Calculate equal installments
    const equalResults = calculateLoanDetails(
      principal,
      [{ startMonth: 1, interestRate }],
      termYears,
      undefined,
      'equalInstallments'
    );

    // Calculate decreasing installments
    const decreasingResults = calculateLoanDetails(
      principal,
      [{ startMonth: 1, interestRate }],
      termYears,
      undefined,
      'decreasingInstallments'
    );

    // 1) Initial payment should be higher for decreasing installments
    expect(decreasingResults.amortizationSchedule[0].monthlyPayment).toBeGreaterThan(
      equalResults.amortizationSchedule[0].monthlyPayment
    );

    // 2) Total interest should be lower for decreasing installments
    expect(decreasingResults.totalInterest).toBeLessThan(equalResults.totalInterest);

    // 3) Both should have the same term
    expect(decreasingResults.actualTerm).toEqual(equalResults.actualTerm);
  });
});
