/**
 * Unit tests for the mortgage calculation engine
 */

import {
  aggregateYearlyData,
  applyOverpayment
} from './calculationEngine';
import { calculateMonthlyPayment, generateAmortizationSchedule } from './utils';
import { PaymentData } from './types';
import { convertLegacySchedule } from './mortgage-calculator';

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

describe('Mortgage Calculation Engine', () => {
  describe('calculateMonthlyPayment', () => {
    test('should calculate monthly payment correctly for standard case', () => {
      console.log('Running calculateMonthlyPayment test: standard case');
      // $250,000 loan at 4.5% for 30 years
      const principal = 250000;
      const annualRate = 4.5;
      const monthlyRate = annualRate / 100 / 12;
      const totalMonths = 30 * 12;
      
      const result = calculateMonthlyPayment(principal, monthlyRate, totalMonths);
      expect(result).toBeCloseTo(1266.71, 1);
    });

    test('should handle 0% interest rate', () => {
      console.log('Running calculateMonthlyPayment test: 0% interest rate');
      const principal = 250000;
      const monthlyRate = 0;
      const totalMonths = 30 * 12;
      
      const result = calculateMonthlyPayment(principal, monthlyRate, totalMonths);
      expect(result).toBeCloseTo(694.44, 1);
    });

    test('should handle very high interest rates', () => {
      console.log('Running calculateMonthlyPayment test: very high interest rates');
      const principal = 250000;
      const annualRate = 20;
      const monthlyRate = annualRate / 100 / 12;
      const totalMonths = 30 * 12;
      
      const result = calculateMonthlyPayment(principal, monthlyRate, totalMonths);
      expect(result).toBeGreaterThan(4000);
    });

    test('should handle very short term', () => {
      console.log('Running calculateMonthlyPayment test: very short term');
      const principal = 250000;
      const annualRate = 4.5;
      const termYears = 1;
      
      const monthlyRate = annualRate / 100 / 12;
      const totalMonths = termYears * 12;
      
      const result = calculateMonthlyPayment(principal, monthlyRate, totalMonths);
      expect(result).toBeCloseTo(21344.63, 1);
    });
  });

  describe('generateAmortizationSchedule', () => {
    test('should generate correct schedule length', () => {
      console.log('Running generateAmortizationSchedule test: correct schedule length');
      const schedule = generateAmortizationSchedule(
        250000,
        [{ startMonth: 1, interestRate: 4.5 }],
        30
      );
      expect(schedule.length).toBe(360);
    });

    test('first payment should have more interest than principal', () => {
      console.log('Running generateAmortizationSchedule test: first payment interest > principal');
      const schedule = generateAmortizationSchedule(
        250000,
        [{ startMonth: 1, interestRate: 4.5 }],
        30
      );
      expect(schedule[0].interestPayment).toBeGreaterThan(schedule[0].principalPayment);
    });

    test('last payment should pay off remaining balance', () => {
      console.log('Running generateAmortizationSchedule test: last payment pays off balance');
      const schedule = generateAmortizationSchedule(
        250000,
        [{ startMonth: 1, interestRate: 4.5 }],
        30
      );
      expect(schedule[359].balance).toBeCloseTo(0, 2);
    });
  });

  describe('aggregateYearlyData', () => {
    test('should aggregate data correctly by year', () => {
      console.log('Running aggregateYearlyData test: aggregate data correctly');
      const schedule = generateAmortizationSchedule(
        100000,
        [{ startMonth: 1, interestRate: 5 }],
        10
      );
      const paymentData = convertScheduleToPaymentData(schedule);
      const yearlyData = aggregateYearlyData(paymentData);
      expect(yearlyData.length).toBe(10);
    });

    test('should calculate total interest correctly for each year', () => {
      console.log('Running aggregateYearlyData test: calculate total interest correctly');
      const schedule = generateAmortizationSchedule(100000, [{ startMonth: 1, interestRate: 5 }], 10);
      const paymentData = convertScheduleToPaymentData(schedule);
      const yearlyData = aggregateYearlyData(paymentData);
      let totalInterest = 0;
      schedule.forEach((month) => totalInterest += month.interestPayment);
      let yearlyInterest = 0;
      yearlyData.forEach(year => yearlyInterest += year.interest);
      // Use a lower precision (0) to accommodate floating point differences
      expect(yearlyInterest).toBeCloseTo(totalInterest, 0);
    });
  });

  describe('applyOverpayment', () => {
    test('should reduce loan term with reduceTerm effect', async () => {
      console.log('Running applyOverpayment test: reduce loan term');
      const schedule = generateAmortizationSchedule(100000, [{ startMonth: 1, interestRate: 5 }], 10);
      const paymentData = convertScheduleToPaymentData(schedule);
      const overpaymentResult = await applyOverpayment(paymentData, 10000, 12, 'reduceTerm');
      expect(overpaymentResult.actualTerm).toBeLessThan(10);
    });

    test('should reduce monthly payment with reducePayment effect', async () => {
      console.log('Running applyOverpayment test: reduce monthly payment');
      const schedule = generateAmortizationSchedule(100000, [{ startMonth: 1, interestRate: 5 }], 10);
      const paymentData = convertScheduleToPaymentData(schedule);
      const overpaymentResult = await applyOverpayment(paymentData, 10000, 12, 'reducePayment');
      expect(overpaymentResult.monthlyPayment).toBeLessThan(1060.66);
    });
  });
});
