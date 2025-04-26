/**
 * Unit tests for the mortgage calculation engine
 */

import {
  aggregateYearlyData,
  applyOverpayment
} from './calculationEngine';
import { calculateMonthlyPayment, generateAmortizationSchedule } from './utils';
import { MonthlyData } from './types';
import { Schedule } from './mortgage-calculator';

// Helper function to convert Schedule to PaymentData/MonthlyData
function convertScheduleToMonthlyData(schedule: Schedule[]): MonthlyData[] {
  return schedule.map(item => {
    // Use the convertLegacySchedule function from mortgage-calculator.ts
    const converted = convertLegacySchedule(item);
    
    // Calculate totalInterest if needed (accumulate it in a loop after conversion)
    return {
      ...converted,
      // Ensure non-optional fields have proper values
      payment: converted.payment || 0,
      balance: converted.balance || 0,
      totalInterest: converted.totalInterest || 0,
      totalPayment: converted.totalPayment || 0
    };
  });
}

describe('Mortgage Calculation Engine', () => {
  describe('calculateMonthlyPayment', () => {
    test('should calculate monthly payment correctly for standard case', () => {
      console.log('Running calculateMonthlyPayment test: standard case');
      // $250,000 loan at 4.5% for 30 years should be $1,266.71 monthly
      const result = calculateMonthlyPayment(250000, 4.5, 30);
      expect(result).toBeCloseTo(1266.71, 1);
    });

    test('should handle 0% interest rate', () => {
      console.log('Running calculateMonthlyPayment test: 0% interest rate');
      // $250,000 loan at 0% for 30 years should be $694.44 monthly
      const result = calculateMonthlyPayment(250000, 0, 30);
      expect(result).toBeCloseTo(694.44, 1);
    });

    test('should handle very high interest rates', () => {
      console.log('Running calculateMonthlyPayment test: very high interest rates');
      // $250,000 loan at 20% for 30 years
      const result = calculateMonthlyPayment(250000, 20, 30);
      expect(result).toBeGreaterThan(4000); // Should be much higher with high interest
    });

    test('should handle very short term', () => {
      console.log('Running calculateMonthlyPayment test: very short term');
      // $250,000 loan at 4.5% for 1 year
      const result = calculateMonthlyPayment(250000, 4.5, 1);
      expect(result).toBeCloseTo(21344.63, 1);
    });
  });

  describe('generateAmortizationSchedule', () => {
    test('should generate correct schedule length', () => {
      console.log('Running generateAmortizationSchedule test: correct schedule length');
      const schedule = generateAmortizationSchedule(250000, 4.5, 30);
      expect(schedule.length).toBe(360); // 30 years * 12 months
    });

    test('first payment should have more interest than principal', () => {
      console.log('Running generateAmortizationSchedule test: first payment interest > principal');
      const schedule = generateAmortizationSchedule(250000, 4.5, 30);
      expect(schedule[0].interestPayment).toBeGreaterThan(schedule[0].principalPayment);
    });

    test('last payment should pay off remaining balance', () => {
      console.log('Running generateAmortizationSchedule test: last payment pays off balance');
      const schedule = generateAmortizationSchedule(250000, 4.5, 30);
      // Uses the remainingPrincipal property from Schedule
      expect(schedule[359].remainingPrincipal).toBeCloseTo(0);
    });
  });

  describe('aggregateYearlyData', () => {
    test('should aggregate data correctly by year', () => {
      console.log('Running aggregateYearlyData test: aggregate data correctly');
      const schedule = generateAmortizationSchedule(100000, 5, 10);
      const monthlyData = convertScheduleToMonthlyData(schedule);
      const yearlyData = aggregateYearlyData(monthlyData);
      expect(yearlyData.length).toBe(10);
    });

    test('should calculate total interest correctly for each year', () => {
      console.log('Running aggregateYearlyData test: calculate total interest correctly');
      const schedule = generateAmortizationSchedule(100000, 5, 10);
      const monthlyData = convertScheduleToMonthlyData(schedule);
      const yearlyData = aggregateYearlyData(monthlyData);
      let totalInterest = 0;
      schedule.forEach((month) => totalInterest += month.interestPayment);
      let yearlyInterest = 0;
      yearlyData.forEach(year => yearlyInterest += year.interest);
      expect(yearlyInterest).toBeCloseTo(totalInterest);
    });
  });

  describe('applyOverpayment', () => {
    test('should reduce loan term with reduceTerm effect', async () => {
      console.log('Running applyOverpayment test: reduce loan term');
      const schedule = generateAmortizationSchedule(100000, 5, 10);
      const monthlyData = convertScheduleToMonthlyData(schedule);
      const overpaymentResult = await applyOverpayment(monthlyData, 10000, 12, 'reduceTerm');
      expect(overpaymentResult.newCalculation.actualTerm).toBeLessThan(10);
    });

    test('should reduce monthly payment with reducePayment effect', async () => {
      console.log('Running applyOverpayment test: reduce monthly payment');
      const schedule = generateAmortizationSchedule(100000, 5, 10);
      const monthlyData = convertScheduleToMonthlyData(schedule);
      const overpaymentResult = await applyOverpayment(monthlyData, 10000, 12, 'reducePayment');
      expect(overpaymentResult.newCalculation.monthlyPayment).toBeLessThan(1060.66);
    });
  });
});
