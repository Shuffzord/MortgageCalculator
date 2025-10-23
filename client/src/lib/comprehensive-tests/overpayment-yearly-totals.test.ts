import { calculateLoanDetails } from '../calculationEngine';
import { aggregateYearlyData } from '../overpaymentCalculator';
import { LoanDetails, OverpaymentDetails } from '../types';

describe('Overpayment Yearly Totals', () => {
  test('Yearly totals balance correctly with monthly overpayments', () => {
    // Setup initial loan parameters
    const principal = 250000;
    const interestRate = 4.5;
    const termYears = 30;
    const monthlyOverpayment = 1000;

    // Create overpayment plan for monthly overpayments
    const overpaymentPlan: OverpaymentDetails = {
      startMonth: 1,
      endMonth: termYears * 12,
      amount: monthlyOverpayment,
      frequency: 'monthly',
      isRecurring: true,
      startDate: new Date(),
    };

    // Create loan details
    const loanDetails: LoanDetails = {
      principal,
      interestRatePeriods: [{ startMonth: 1, interestRate }],
      loanTerm: termYears,
      overpaymentPlans: [overpaymentPlan],
      startDate: new Date(),
      name: 'Test Loan',
    };

    // Calculate loan with overpayments
    const results = calculateLoanDetails(
      principal,
      [{ startMonth: 1, interestRate }],
      termYears,
      undefined,
      'equalInstallments',
      undefined,
      [overpaymentPlan]
    );

    // Get yearly data
    const yearlyData = results.yearlyData;

    // Test first year's totals
    const firstYear = yearlyData[0];
    expect(firstYear.payment).toBeCloseTo(firstYear.principal + firstYear.interest, 2);

    // Verify all yearly totals balance
    yearlyData.forEach((year, index) => {
      // Payment should equal principal + interest
      expect(year.payment).toBeCloseTo(year.principal + year.interest, 2);

      // Log the values for analysis
      console.log(`Year ${year.year}:`, {
        payment: year.payment,
        principal: year.principal,
        interest: year.interest,
        sum: year.principal + year.interest,
        difference: Math.abs(year.payment - (year.principal + year.interest)),
      });
    });

    // Calculate loan without overpayments for comparison
    const standardResults = calculateLoanDetails(
      principal,
      [{ startMonth: 1, interestRate }],
      termYears
    );

    // Verify overpayment reduces total interest
    expect(results.totalInterest).toBeLessThan(standardResults.totalInterest);

    // Verify loan term is reduced with overpayments
    expect(results.actualTerm).toBeLessThan(termYears);
  });
});
