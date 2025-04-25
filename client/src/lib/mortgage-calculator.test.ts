import { calculateMonthlyPayment, generateAmortizationSchedule } from './utils';
import { OverpaymentDetails } from './types';

describe('Mortgage Calculator', () => {
  describe('calculateMonthlyPayment', () => {
    it('should calculate the monthly payment correctly', () => {
      const principal = 100000;
      const annualRate = 5;
      const termYears = 30;
      const expectedMonthlyPayment = 536.82;
      const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termYears);
      expect(monthlyPayment).toBeCloseTo(expectedMonthlyPayment, 2);
    });
  });

  describe('generateAmortizationSchedule', () => {
    it('should generate the amortization schedule correctly', () => {
      const principal = 100000;
      const annualRate = 5;
      const termYears = 30;
      const overpaymentPlan: OverpaymentDetails = {
        amount: 100,
        startMonth: 60,
        isRecurring: false,
        frequency: 'one-time'
      };
      const schedule = generateAmortizationSchedule(principal, annualRate, termYears, overpaymentPlan);
      expect(schedule.length).toBeGreaterThan(0);
    });
  });
});