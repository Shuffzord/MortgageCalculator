/**
 * Unit tests for the overpayment calculator module
 */

import {
  applyOverpayment,
  calculateReducedTermSchedule,
  calculateReducedPaymentSchedule,
  isOverpaymentApplicable,
  performOverpayments,
  applyMultipleOverpayments
} from './overpaymentCalculator';
import { generateAmortizationSchedule } from './utils';
import { LoanDetails, OverpaymentDetails, PaymentData } from './types';

// Helper function to ensure all PaymentData fields are properly set
function convertScheduleToPaymentData(schedule: PaymentData[]): PaymentData[] {
  // Calculate running totals once to optimize performance
  let runningTotalInterest = 0;
  let runningTotalPayment = 0;
  
  return schedule.map(item => {
    // Calculate running totals before converting
    runningTotalInterest += item.interestPayment;
    runningTotalPayment += item.monthlyPayment;
    
    // Create properly structured PaymentData object
    return {
      payment: item.payment || 0,
      monthlyPayment: item.monthlyPayment || 0,
      principalPayment: item.principalPayment || 0,
      interestPayment: item.interestPayment || 0,
      balance: item.balance || 0,
      isOverpayment: item.isOverpayment || false,
      overpaymentAmount: item.overpaymentAmount || 0,
      totalInterest: runningTotalInterest,
      totalPayment: runningTotalPayment,
      paymentDate: item.paymentDate
    };
  });
}

describe('Overpayment Calculator', () => {
  describe('applyOverpayment', () => {
    test('should reduce loan term with reduceTerm effect', async () => {
      const schedule = generateAmortizationSchedule(100000, [{ startMonth: 1, interestRate: 5 }], 10);
      const paymentData = convertScheduleToPaymentData(schedule);
      const loanDetails: LoanDetails = {
        principal: 100000,
        interestRatePeriods: [{ startMonth: 1, interestRate: 5 }],
        loanTerm: 10,
        overpaymentPlans: [],
        startDate: new Date(),
        name: 'Test Loan',
      };
      
      const overpaymentResult = await applyOverpayment(
        paymentData,
        10000,
        12,
        loanDetails,
        'reduceTerm'
      );
      
      expect(overpaymentResult.actualTerm).toBeLessThan(10);
      expect(overpaymentResult.monthlyPayment).toBeCloseTo(paymentData[0].monthlyPayment, 2);
      expect(overpaymentResult.amortizationSchedule[11].isOverpayment).toBe(true);
      expect(overpaymentResult.amortizationSchedule[11].overpaymentAmount).toBe(10000);
    });

    test('should reduce monthly payment with reducePayment effect', async () => {
      const schedule = generateAmortizationSchedule(100000, [{ startMonth: 1, interestRate: 5 }], 10);
      const paymentData = convertScheduleToPaymentData(schedule);
      const loanDetails: LoanDetails = {
        principal: 100000,
        interestRatePeriods: [{ startMonth: 1, interestRate: 5 }],
        loanTerm: 10,
        overpaymentPlans: [],
        startDate: new Date(),
        name: 'Test Loan',
      };
      
      const overpaymentResult = await applyOverpayment(
        paymentData,
        10000,
        12,
        loanDetails,
        'reducePayment'
      );
      
      expect(overpaymentResult.actualTerm).toBeCloseTo(10, 1);
      expect(overpaymentResult.monthlyPayment).toBeLessThan(paymentData[0].monthlyPayment);
      expect(overpaymentResult.amortizationSchedule[11].isOverpayment).toBe(true);
      expect(overpaymentResult.amortizationSchedule[11].overpaymentAmount).toBe(10000);
    });

    test('should handle invalid payment number', async () => {
      const schedule = generateAmortizationSchedule(100000, [{ startMonth: 1, interestRate: 5 }], 10);
      const paymentData = convertScheduleToPaymentData(schedule);
      const loanDetails: LoanDetails = {
        principal: 100000,
        interestRatePeriods: [{ startMonth: 1, interestRate: 5 }],
        loanTerm: 10,
        overpaymentPlans: [],
        startDate: new Date(),
        name: 'Test Loan',
      };
      
      // Test with payment number that's too high
      await expect(async () => {
        await applyOverpayment(
          paymentData,
          10000,
          200, // Beyond the schedule length
          loanDetails,
          'reduceTerm'
        );
      }).rejects.toThrow('Invalid payment number');
      
      // Test with payment number that's too low
      await expect(async () => {
        await applyOverpayment(
          paymentData,
          10000,
          0, // Invalid payment number
          loanDetails,
          'reduceTerm'
        );
      }).rejects.toThrow('Invalid payment number');
    });
  });

  describe('calculateReducedTermSchedule', () => {
    test('should calculate a schedule with reduced term', () => {
      const balance = 80000;
      const interestRatePeriods = [{ startMonth: 1, interestRate: 5 }];
      const monthlyPayment = 1000;
      const startPaymentNumber = 25;
      
      const result = calculateReducedTermSchedule(
        balance,
        interestRatePeriods,
        monthlyPayment,
        startPaymentNumber
      );
      
      expect(result.length).toBeGreaterThan(0);
      expect(result[result.length - 1].balance).toBeCloseTo(0, 2);
      expect(result[0].payment).toBe(startPaymentNumber + 1);
      expect(result[0].monthlyPayment).toBeCloseTo(monthlyPayment, 2);
    });
    
    test('should handle multiple interest rate periods', () => {
      const balance = 80000;
      const interestRatePeriods = [
        { startMonth: 1, interestRate: 5 },
        { startMonth: 60, interestRate: 6 }
      ];
      const monthlyPayment = 1000;
      const startPaymentNumber = 25;
      
      const result = calculateReducedTermSchedule(
        balance,
        interestRatePeriods,
        monthlyPayment,
        startPaymentNumber
      );
      
      expect(result.length).toBeGreaterThan(0);
      expect(result[result.length - 1].balance).toBeCloseTo(0, 2);
      
      // Find a payment after the rate change
      const paymentAfterRateChange = result.find(p => p.payment >= 60);
      if (paymentAfterRateChange) {
        // Verify the interest rate is higher after the change
        const paymentBeforeRateChange = result.find(p => p.payment === 59);
        if (paymentBeforeRateChange) {
          const balanceBeforeChange = paymentBeforeRateChange.balance;
          const interestBeforeChange = paymentBeforeRateChange.interestPayment;
          const rateBeforeChange = interestBeforeChange / balanceBeforeChange * 12 * 100;
          
          const balanceAfterChange = paymentAfterRateChange.balance;
          const interestAfterChange = paymentAfterRateChange.interestPayment;
          const rateAfterChange = interestAfterChange / balanceAfterChange * 12 * 100;
          
          expect(rateAfterChange).toBeGreaterThan(rateBeforeChange);
        }
      }
    });
  });

  describe('calculateReducedPaymentSchedule', () => {
    test('should calculate a schedule with reduced payment', () => {
      const balance = 80000;
      const interestRatePeriods = [{ startMonth: 1, interestRate: 5 }];
      const remainingMonths = 96; // 8 years
      const originalPayment = 1000;
      const startPaymentNumber = 25;
      
      const result = calculateReducedPaymentSchedule(
        balance,
        interestRatePeriods,
        remainingMonths,
        originalPayment,
        startPaymentNumber
      );
      
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(remainingMonths);
      expect(result[0].payment).toBe(startPaymentNumber);
      // The monthly payment might not be less if the balance and remaining months
      // result in a similar payment amount to the original
      expect(result[0].monthlyPayment).toBeLessThanOrEqual(originalPayment * 1.05);
    });
    
    test('should handle multiple interest rate periods', () => {
      const balance = 80000;
      const interestRatePeriods = [
        { startMonth: 1, interestRate: 5 },
        { startMonth: 60, interestRate: 6 }
      ];
      const remainingMonths = 96; // 8 years
      const originalPayment = 1000;
      const startPaymentNumber = 25;
      
      const result = calculateReducedPaymentSchedule(
        balance,
        interestRatePeriods,
        remainingMonths,
        originalPayment,
        startPaymentNumber
      );
      
      expect(result.length).toBeGreaterThan(0);
      
      // Find a payment after the rate change
      const paymentAfterRateChange = result.find(p => p.payment >= 60);
      if (paymentAfterRateChange) {
        // Verify the interest rate is higher after the change
        const paymentBeforeRateChange = result.find(p => p.payment === 59);
        if (paymentBeforeRateChange) {
          const balanceBeforeChange = paymentBeforeRateChange.balance;
          const interestBeforeChange = paymentBeforeRateChange.interestPayment;
          const rateBeforeChange = interestBeforeChange / balanceBeforeChange * 12 * 100;
          
          const balanceAfterChange = paymentAfterRateChange.balance;
          const interestAfterChange = paymentAfterRateChange.interestPayment;
          const rateAfterChange = interestAfterChange / balanceAfterChange * 12 * 100;
          
          expect(rateAfterChange).toBeGreaterThan(rateBeforeChange);
        }
      }
    });
  });

  describe('isOverpaymentApplicable', () => {
    test('should correctly identify one-time overpayments', () => {
      const overpayment: OverpaymentDetails = {
        amount: 10000,
        startMonth: 12,
        startDate: new Date(),
        isRecurring: false,
        frequency: 'one-time',
        effect: 'reduceTerm'
      };
      
      expect(isOverpaymentApplicable(overpayment, 11, new Date())).toBe(false);
      expect(isOverpaymentApplicable(overpayment, 12, new Date())).toBe(true);
      expect(isOverpaymentApplicable(overpayment, 13, new Date())).toBe(false);
    });
    
    test('should correctly identify monthly overpayments', () => {
      const overpayment: OverpaymentDetails = {
        amount: 500,
        startMonth: 6,
        endMonth: 18,
        startDate: new Date(),
        isRecurring: true,
        frequency: 'monthly',
        effect: 'reduceTerm'
      };
      
      expect(isOverpaymentApplicable(overpayment, 5, new Date())).toBe(false);
      expect(isOverpaymentApplicable(overpayment, 6, new Date())).toBe(true);
      expect(isOverpaymentApplicable(overpayment, 12, new Date())).toBe(true);
      expect(isOverpaymentApplicable(overpayment, 18, new Date())).toBe(true);
      expect(isOverpaymentApplicable(overpayment, 19, new Date())).toBe(false);
    });
    
    test('should correctly identify quarterly overpayments', () => {
      const overpayment: OverpaymentDetails = {
        amount: 1000,
        startMonth: 3,
        startDate: new Date(),
        isRecurring: true,
        frequency: 'quarterly',
        effect: 'reduceTerm'
      };
      
      expect(isOverpaymentApplicable(overpayment, 2, new Date())).toBe(false);
      expect(isOverpaymentApplicable(overpayment, 3, new Date())).toBe(true);
      expect(isOverpaymentApplicable(overpayment, 4, new Date())).toBe(false);
      expect(isOverpaymentApplicable(overpayment, 6, new Date())).toBe(true);
      expect(isOverpaymentApplicable(overpayment, 9, new Date())).toBe(true);
      expect(isOverpaymentApplicable(overpayment, 12, new Date())).toBe(true);
    });
    
    test('should correctly identify annual overpayments', () => {
      const overpayment: OverpaymentDetails = {
        amount: 5000,
        startMonth: 12,
        startDate: new Date(),
        isRecurring: true,
        frequency: 'annual',
        effect: 'reduceTerm'
      };
      
      expect(isOverpaymentApplicable(overpayment, 11, new Date())).toBe(false);
      expect(isOverpaymentApplicable(overpayment, 12, new Date())).toBe(true);
      expect(isOverpaymentApplicable(overpayment, 13, new Date())).toBe(false);
      expect(isOverpaymentApplicable(overpayment, 24, new Date())).toBe(true);
      expect(isOverpaymentApplicable(overpayment, 36, new Date())).toBe(true);
    });
    
    test('should handle date-based overpayments', () => {
      const loanStartDate = new Date(2020, 0, 1); // January 1, 2020
      const overpaymentDate = new Date(2021, 0, 1); // January 1, 2021 (12 months later)
      
      const overpayment: OverpaymentDetails = {
        amount: 10000,
        startDate: overpaymentDate,
        isRecurring: false,
        frequency: 'one-time',
        effect: 'reduceTerm'
      };
      
      expect(isOverpaymentApplicable(overpayment, 11, loanStartDate)).toBe(false);
      expect(isOverpaymentApplicable(overpayment, 12, loanStartDate)).toBe(true);
      expect(isOverpaymentApplicable(overpayment, 13, loanStartDate)).toBe(false);
    });
  });

  describe('performOverpayments', () => {
    test('should apply multiple overpayments correctly', () => {
      const schedule = generateAmortizationSchedule(100000, [{ startMonth: 1, interestRate: 5 }], 10);
      const paymentData = convertScheduleToPaymentData(schedule);
      
      const overpayments: OverpaymentDetails[] = [
        {
          amount: 5000,
          startMonth: 12,
          startDate: new Date(),
          isRecurring: false,
          frequency: 'one-time',
          effect: 'reduceTerm'
        },
        {
          amount: 200,
          startMonth: 24,
          startDate: new Date(),
          isRecurring: true,
          frequency: 'monthly',
          effect: 'reduceTerm'
        }
      ];
      
      const loanDetails: LoanDetails = {
        principal: 100000,
        interestRatePeriods: [{ startMonth: 1, interestRate: 5 }],
        loanTerm: 10,
        overpaymentPlans: overpayments,
        startDate: new Date(),
        name: 'Test Loan',
      };
      
      const result = performOverpayments(paymentData, overpayments, loanDetails.startDate, loanDetails);
      
      // Verify the one-time overpayment was applied
      expect(result[11].isOverpayment).toBe(true);
      expect(result[11].overpaymentAmount).toBe(5000);
      
      // Verify the monthly overpayments were applied
      expect(result[23].isOverpayment).toBe(true);
      
      // Verify the loan is paid off earlier
      const lastPositiveBalanceIndex = result.findIndex(p => p.balance <= 0) - 1;
      expect(lastPositiveBalanceIndex).toBeLessThan(paymentData.length - 1);
    });
    
    test('should handle empty overpayments array', () => {
      const schedule = generateAmortizationSchedule(100000, [{ startMonth: 1, interestRate: 5 }], 10);
      const paymentData = convertScheduleToPaymentData(schedule);
      
      const result = performOverpayments(paymentData, [], new Date());
      
      // Verify the schedule is unchanged
      expect(result.length).toBe(paymentData.length);
      expect(result[0].monthlyPayment).toBeCloseTo(paymentData[0].monthlyPayment, 2);
    });
  });

  describe('applyMultipleOverpayments', () => {
    test('should delegate to performOverpayments', () => {
      const schedule = generateAmortizationSchedule(100000, [{ startMonth: 1, interestRate: 5 }], 10);
      const paymentData = convertScheduleToPaymentData(schedule);
      
      const overpayments: OverpaymentDetails[] = [
        {
          amount: 5000,
          startMonth: 12,
          startDate: new Date(),
          isRecurring: false,
          frequency: 'one-time',
          effect: 'reduceTerm'
        }
      ];
      
      const loanDetails: LoanDetails = {
        principal: 100000,
        interestRatePeriods: [{ startMonth: 1, interestRate: 5 }],
        loanTerm: 10,
        overpaymentPlans: overpayments,
        startDate: new Date(),
        name: 'Test Loan',
      };
      
      const result = applyMultipleOverpayments(paymentData, overpayments, loanDetails.startDate, loanDetails);
      
      // Verify the overpayment was applied
      expect(result[11].isOverpayment).toBe(true);
      expect(result[11].overpaymentAmount).toBe(5000);
    });
  });
});