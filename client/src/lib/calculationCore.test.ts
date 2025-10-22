import { roundToCents, calculateBaseMonthlyPayment, convertScheduleFormat } from './calculationCore';

describe('calculationCore', () => {
  describe('roundToCents', () => {
    test('rounds to two decimal places', () => {
      expect(roundToCents(123.456)).toBe(123.46);
      expect(roundToCents(123.454)).toBe(123.45);
      expect(roundToCents(0.001)).toBe(0);
      expect(roundToCents(0.005)).toBe(0.01);
    });
  });

  describe('calculateBaseMonthlyPayment', () => {
    test('calculates payment for standard interest rate', () => {
      // $300,000 loan at 5% for 30 years
      const principal = 300000;
      const monthlyRate = 0.05 / 12; // 5% annual rate
      const totalMonths = 30 * 12; // 30 years
      
      const result = calculateBaseMonthlyPayment(principal, monthlyRate, totalMonths);
      expect(result).toBeCloseTo(1610.46, 2);
    });

    test('calculates payment for very low interest rate', () => {
      // $300,000 loan at 0.1% for 30 years
      const principal = 300000;
      const monthlyRate = 0.001 / 12; // 0.1% annual rate
      const totalMonths = 30 * 12; // 30 years
      
      const result = calculateBaseMonthlyPayment(principal, monthlyRate, totalMonths);
      expect(result).toBeCloseTo(833.33, 2);
    });

    test('calculates payment for zero interest rate', () => {
      // $300,000 loan at 0% for 30 years
      const principal = 300000;
      const monthlyRate = 0;
      const totalMonths = 30 * 12; // 30 years
      
      const result = calculateBaseMonthlyPayment(principal, monthlyRate, totalMonths);
      expect(result).toBeCloseTo(833.33, 2);
    });
  });

  describe('convertScheduleFormat', () => {
    test('converts legacy format to PaymentData', () => {
      const legacySchedule = {
        paymentNum: 1,
        monthlyPayment: 1000,
        principalPayment: 200,
        interestPayment: 800,
        remainingPrincipal: 99800,
        isOverpayment: false,
        overpaymentAmount: 0
      };
      
      const result = convertScheduleFormat(legacySchedule);
      
      expect(result).toEqual({
        payment: 1,
        monthlyPayment: 1000,
        principalPayment: 200,
        interestPayment: 800,
        balance: 99800,
        isOverpayment: false,
        overpaymentAmount: 0,
        totalInterest: 0,
        totalPayment: 1000,
        paymentDate: undefined,
        currency: undefined
      });
    });

    test('handles alternative property names', () => {
      const alternativeSchedule = {
        payment: 1,
        monthlyPayment: 1000,
        principalPayment: 200,
        interestPayment: 800,
        balance: 99800
      };
      
      const result = convertScheduleFormat(alternativeSchedule);
      
      expect(result.payment).toBe(1);
      expect(result.monthlyPayment).toBe(1000);
      expect(result.balance).toBe(99800);
      expect(result.isOverpayment).toBe(false);
    });
  });
});