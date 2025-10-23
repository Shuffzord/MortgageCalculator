import { generateAmortizationSchedule } from './calculationEngine';
import { OverpaymentDetails, PaymentData } from './types';
import { calculateBaseMonthlyPayment } from './calculationCore';

describe('Mortgage Calculator', () => {
  describe('calculateBaseMonthlyPayment', () => {
    it('should calculate the monthly payment correctly', () => {
      console.log('Running calculateMonthlyPayment test in mortgage-calculator.test.ts');

      // Test inputs
      const principal = 100000;
      const annualRate = 5;
      const termYears = 30;

      // Convert inputs for the function
      const monthlyRate = annualRate / 100 / 12; // Convert 5% annual to monthly decimal
      const totalMonths = termYears * 12; // Convert years to months

      const expectedMonthlyPayment = 536.82;

      const monthlyPayment = calculateBaseMonthlyPayment(
        principal,
        monthlyRate, // Now passing monthly rate as decimal
        totalMonths // Now passing total months
      );

      expect(monthlyPayment).toBeCloseTo(expectedMonthlyPayment, 2);
    });
  });
});
