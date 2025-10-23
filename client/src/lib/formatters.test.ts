import {
  formatCurrency,
  formatDate,
  formatTimePeriod,
  formatDateLegacy,
  formatPaymentAmount,
  formatInterestRate,
  formatPaymentEntry,
  formatYearlySummary,
  formatLoanSummary,
} from './formatters';
import i18n from '@/i18n';
import { PaymentData, YearlyData } from './types';

// Mock i18n
jest.mock('@/i18n', () => ({
  language: 'en',
  changeLanguage: jest.fn(),
}));

describe('Formatters', () => {
  describe('formatCurrency', () => {
    it('formats currency correctly with default parameters', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('formats currency correctly with specified locale', () => {
      const result = formatCurrency(1234.56, 'pl-PL', 'PLN');
      // Just check for the essential parts rather than exact formatting
      expect(result).toContain('1234,56');
      expect(result).toContain('zł');
    });

    it('formats currency correctly with specified currency', () => {
      expect(formatCurrency(1234.56, 'en-US', 'EUR')).toBe('€1,234.56');
    });

    it('handles negative values correctly', () => {
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
    });

    it('handles zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('uses the correct locale based on i18n language', () => {
      // @ts-ignore - Mocking i18n
      i18n.language = 'pl';
      const plResult = formatCurrency(1234.56);
      expect(plResult).toContain('1234,56');

      // @ts-ignore - Mocking i18n
      i18n.language = 'es';
      expect(formatCurrency(1234.56)).toMatch(/1.*234.*56/);

      // @ts-ignore - Mocking i18n
      i18n.language = 'en';
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });
  });

  describe('formatTimePeriod', () => {
    it('formats time period with years and months', () => {
      expect(formatTimePeriod(15)).toBe('1 year 3 months');
    });

    it('formats time period with only years', () => {
      expect(formatTimePeriod(24)).toBe('2 years');
    });

    it('formats time period with only months', () => {
      expect(formatTimePeriod(5)).toBe('5 months');
    });

    it('formats time period with singular year', () => {
      expect(formatTimePeriod(12)).toBe('1 year');
    });

    it('formats time period with singular month', () => {
      expect(formatTimePeriod(1)).toBe('1 month');
    });

    it('formats time period with singular year and month', () => {
      expect(formatTimePeriod(13)).toBe('1 year 1 month');
    });

    it('handles zero months correctly', () => {
      expect(formatTimePeriod(0)).toBe('');
    });
  });

  describe('formatDate', () => {
    it('formats date correctly with default format', () => {
      const date = new Date(2023, 0, 15); // January 15, 2023
      const result = formatDate(date);
      // Just check that it contains the year, as the format may vary by locale
      expect(result).toContain('2023');
    });

    it('formats date correctly with custom format', () => {
      const date = new Date(2023, 0, 15); // January 15, 2023
      expect(formatDate(date, 'MM/dd/yyyy')).toBe('01/15/2023');
    });

    it('uses the correct locale based on i18n language', () => {
      const date = new Date(2023, 0, 15); // January 15, 2023

      // @ts-ignore - Mocking i18n
      i18n.language = 'pl';
      expect(formatDate(date)).toMatch(/15/);
      expect(formatDate(date)).toMatch(/styczeń|stycznia/i);

      // @ts-ignore - Mocking i18n
      i18n.language = 'es';
      expect(formatDate(date)).toMatch(/15/);
      expect(formatDate(date)).toMatch(/enero/i);

      // @ts-ignore - Mocking i18n
      i18n.language = 'en';
      expect(formatDate(date)).toMatch(/January 15/);
    });
  });

  describe('formatDateLegacy', () => {
    it('formats date correctly in legacy format', () => {
      const date = new Date(2023, 0, 15); // January 15, 2023
      expect(formatDateLegacy(date)).toBe('Jan 15, 2023');
    });
  });

  describe('formatPaymentAmount', () => {
    it('formats payment amount correctly', () => {
      expect(formatPaymentAmount(1234.56)).toBe('$1,234.56');
    });

    it('formats payment amount with specified currency', () => {
      expect(formatPaymentAmount(1234.56, 'EUR')).toBe('€1,234.56');
    });
  });

  describe('formatInterestRate', () => {
    it('formats interest rate correctly', () => {
      expect(formatInterestRate(0.05)).toBe('5.00%');
    });

    it('handles zero correctly', () => {
      expect(formatInterestRate(0)).toBe('0.00%');
    });

    it('handles small values correctly', () => {
      expect(formatInterestRate(0.00125)).toBe('0.13%');
    });
  });

  describe('formatPaymentEntry', () => {
    it('formats payment entry correctly', () => {
      const entry: PaymentData = {
        payment: 1,
        monthlyPayment: 1000,
        principalPayment: 800,
        interestPayment: 200,
        balance: 99000,
        isOverpayment: false,
        overpaymentAmount: 0,
        totalInterest: 200,
        totalPayment: 1000,
      };

      expect(formatPaymentEntry(entry)).toBe(
        'Payment #1: $1,000.00 (Principal: $800.00, Interest: $200.00)'
      );
    });

    it('formats payment entry with specified currency', () => {
      const entry: PaymentData = {
        payment: 1,
        monthlyPayment: 1000,
        principalPayment: 800,
        interestPayment: 200,
        balance: 99000,
        isOverpayment: false,
        overpaymentAmount: 0,
        totalInterest: 200,
        totalPayment: 1000,
      };

      expect(formatPaymentEntry(entry, 'EUR')).toBe(
        'Payment #1: €1,000.00 (Principal: €800.00, Interest: €200.00)'
      );
    });
  });

  describe('formatYearlySummary', () => {
    it('formats yearly summary correctly', () => {
      const yearData: YearlyData = {
        year: 1,
        principal: 10000,
        interest: 2000,
        payment: 12000,
        balance: 90000,
        totalInterest: 2000,
      };

      expect(formatYearlySummary(yearData)).toBe(
        'Year 1: Paid $12,000.00 (Principal: $10,000.00, Interest: $2,000.00)'
      );
    });

    it('formats yearly summary with specified currency', () => {
      const yearData: YearlyData = {
        year: 1,
        principal: 10000,
        interest: 2000,
        payment: 12000,
        balance: 90000,
        totalInterest: 2000,
      };

      expect(formatYearlySummary(yearData, 'EUR')).toBe(
        'Year 1: Paid €12,000.00 (Principal: €10,000.00, Interest: €2,000.00)'
      );
    });
  });

  describe('formatLoanSummary', () => {
    it('formats loan summary correctly', () => {
      const summary = formatLoanSummary(100000, 500, 20000, 30);

      expect(summary).toContain('Loan Amount: $100,000.00');
      expect(summary).toContain('Monthly Payment: $500.00');
      expect(summary).toContain('Total Interest: $20,000.00');
      expect(summary).toContain('Term: 30 years');
    });

    it('formats loan summary with specified currency', () => {
      const summary = formatLoanSummary(100000, 500, 20000, 30, 'EUR');

      expect(summary).toContain('Loan Amount: €100,000.00');
      expect(summary).toContain('Monthly Payment: €500.00');
      expect(summary).toContain('Total Interest: €20,000.00');
      expect(summary).toContain('Term: 30 years');
    });

    it('formats loan summary with non-integer term', () => {
      const summary = formatLoanSummary(100000, 500, 20000, 15.5);

      expect(summary).toContain('Term: 15 years 6 months');
    });
  });
});
