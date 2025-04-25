/**
 * Unit tests for the mortgage calculation engine
 */

import { 
  calculateMonthlyPayment,
  generateAmortizationSchedule,
  aggregateYearlyData,
  calculateLoanDetails,
  applyOverpayment,
  formatCurrency,
  formatTimePeriod
} from './calculationEngine';

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
      expect(result).toBeCloseTo(21233.97, 1);
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

    test('last payment should have more principal than interest', () => {
      const schedule = generateAmortizationSchedule(250000, 4.5, 30);
      const lastPayment = schedule[schedule.length - 1];
      expect(lastPayment.principalPayment).toBeGreaterThan(lastPayment.interestPayment);
    });

    test('final balance should be 0 or very close to 0', () => {
      const schedule = generateAmortizationSchedule(250000, 4.5, 30);
      const lastPayment = schedule[schedule.length - 1];
      expect(lastPayment.balance).toBeLessThan(0.01);
    });
  });

  describe('aggregateYearlyData', () => {
    test('should aggregate monthly data correctly', () => {
      const monthlySchedule = generateAmortizationSchedule(250000, 4.5, 30);
      const yearlyData = aggregateYearlyData(monthlySchedule);
      
      expect(yearlyData.length).toBe(30); // 30 years
      
      // First year check
      expect(yearlyData[0].year).toBe(1);
      // Total annual payment should be monthly payment * 12
      expect(yearlyData[0].payment).toBeCloseTo(monthlySchedule[0].monthlyPayment * 12, 1);
    });

    test('should handle partial years', () => {
      // 15 months schedule
      const monthlySchedule = generateAmortizationSchedule(250000, 4.5, 30).slice(0, 15);
      const yearlyData = aggregateYearlyData(monthlySchedule);
      
      expect(yearlyData.length).toBe(2); // 1 full year + 3 months
      expect(yearlyData[1].year).toBe(2);
    });
  });

  describe('applyOverpayment', () => {
    test('reduce term option should decrease the number of payments', () => {
      const schedule = generateAmortizationSchedule(250000, 4.5, 30);
      const originalLength = schedule.length;
      
      const result = applyOverpayment(
        schedule,
        10000, // $10,000 overpayment
        12,    // After 1 year
        'reduceTerm'
      );
      
      expect(result.newCalculation.amortizationSchedule.length).toBeLessThan(originalLength);
      expect(typeof result.timeOrPaymentSaved).toBe('number');
      expect(result.timeOrPaymentSaved).toBeGreaterThan(0);
    });

    test('reduce payment option should maintain schedule length but reduce payment amount', () => {
      const schedule = generateAmortizationSchedule(250000, 4.5, 30);
      const originalPayment = schedule[0].monthlyPayment;
      
      const result = applyOverpayment(
        schedule,
        10000, // $10,000 overpayment
        12,    // After 1 year
        'reducePayment'
      );
      
      // Last payment may be different, so check a middle payment after the overpayment
      const newPayment = result.newCalculation.amortizationSchedule[13].monthlyPayment;
      
      expect(newPayment).toBeLessThan(originalPayment);
      expect(typeof result.timeOrPaymentSaved).toBe('number');
      expect(result.timeOrPaymentSaved).toBeGreaterThan(0);
    });

    test('should handle overpayment that pays off the loan', () => {
      const schedule = generateAmortizationSchedule(10000, 4.5, 30);
      
      const result = applyOverpayment(
        schedule,
        9000, // Almost paying off the loan
        2,    // After 2 payments
        'reduceTerm'
      );
      
      // Should end shortly after the overpayment
      expect(result.newCalculation.amortizationSchedule.length).toBeLessThan(5);
    });
  });

  describe('formatting functions', () => {
    test('formatCurrency should format values correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
    });

    test('formatTimePeriod should handle various month periods', () => {
      expect(formatTimePeriod(0)).toBe('0 months');
      expect(formatTimePeriod(1)).toBe('1 month');
      expect(formatTimePeriod(12)).toBe('1 year');
      expect(formatTimePeriod(15)).toBe('1 year 3 months');
      expect(formatTimePeriod(24)).toBe('2 years');
      expect(formatTimePeriod(25)).toBe('2 years 1 month');
    });
  });
});
