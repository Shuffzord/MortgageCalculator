/**
 * Unit tests for the mortgage calculation engine
 */

import {
  aggregateYearlyData,
  calculateLoanDetails,
  applyOverpayment
} from './calculationEngine';
import { calculateMonthlyPayment, generateAmortizationSchedule } from './utils';

describe('Mortgage Calculation Engine', () => {
  describe('calculateMonthlyPayment', () => {
    test('should calculate monthly payment correctly for standard case', () => {
      // $250,000 loan at 4.5% for 30 years should be $1,266.71 monthly
      const result = calculateMonthlyPayment(250000, 4.5, 30);
      expect(result).toBeCloseTo(1266.71, 1);
    });

    test('should handle 0% interest rate', () => {
      // $250,000 loan at 0% for 30 years should be $694.44 monthly
      const result = calculateMonthlyPayment(250000, 0, 30);
      expect(result).toBeCloseTo(694.44, 1);
    });

    test('should handle very high interest rates', () => {
      // $250,000 loan at 20% for 30 years
      const result = calculateMonthlyPayment(250000, 20, 30);
      expect(result).toBeGreaterThan(4000); // Should be much higher with high interest
    });

    test('should handle very short term', () => {
      // $250,000 loan at 4.5% for 1 year
      const result = calculateMonthlyPayment(250000, 4.5, 1);
      expect(result).toBeCloseTo(21344.63, 1);
    });
  });

  describe('generateAmortizationSchedule', () => {
    test('should generate correct schedule length', () => {
      const schedule = generateAmortizationSchedule(250000, 4.5, 30);
      expect(schedule.length).toBe(360); // 30 years * 12 months
    });

    test('first payment should have more interest than principal', () => {
      const schedule = generateAmortizationSchedule(250000, 4.5, 30);
      expect(schedule[0].interestPayment).toBeGreaterThan(schedule[0].principalPayment);
    });

    test('last payment should pay off remaining balance', () => {
      const schedule = generateAmortizationSchedule(250000, 4.5, 30);
      expect(schedule[359].balance).toBeCloseTo(0);
    });
  });

  describe('aggregateYearlyData', () => {
    test('should aggregate data correctly by year', () => {
      const schedule = generateAmortizationSchedule(100000, 5, 10);
      const yearlyData = aggregateYearlyData(schedule);
      expect(yearlyData.length).toBe(10);
    });

    test('should calculate total interest correctly for each year', () => {
      const schedule = generateAmortizationSchedule(100000, 5, 10);
      const yearlyData = aggregateYearlyData(schedule);
      let totalInterest = 0;
      schedule.forEach((month: any) => totalInterest += month.interestPayment);
      let yearlyInterest = 0;
      yearlyData.forEach(year => yearlyInterest += year.interest);
      expect(yearlyInterest).toBeCloseTo(totalInterest);
    });
  });

  describe('calculateLoanDetails', () => {
    test('should calculate correct loan details', () => {
      const loanDetails = calculateLoanDetails(100000, 5, 10);
      expect(loanDetails.originalTerm).toBe(10);
      expect(loanDetails.monthlyPayment).toBeCloseTo(1060.66, 1);
    });
  });

  describe('applyOverpayment', () => {
    test('should reduce loan term with reduceTerm effect', () => {
      const schedule = generateAmortizationSchedule(100000, 5, 10);
      const overpaymentResult = applyOverpayment(schedule, 10000, 12, 'reduceTerm');
      expect(overpaymentResult.newCalculation.actualTerm).toBeLessThan(10);
    });

    test('should reduce monthly payment with reducePayment effect', () => {
      const schedule = generateAmortizationSchedule(100000, 5, 10);
      const overpaymentResult = applyOverpayment(schedule, 10000, 12, 'reducePayment');
      expect(overpaymentResult.newCalculation.monthlyPayment).toBeLessThan(1060.66);
    });
  });
});
