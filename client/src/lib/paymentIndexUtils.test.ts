import {
  paymentMonthToIndex,
  indexToPaymentMonth,
  monthsBetweenDates,
  addMonthsToDate,
  dateToPaymentMonth,
  paymentMonthToDate,
} from './paymentIndexUtils';

describe('Payment Index Utilities', () => {
  describe('paymentMonthToIndex', () => {
    it('should convert payment month to zero-based index', () => {
      expect(paymentMonthToIndex(1)).toBe(0);
      expect(paymentMonthToIndex(61)).toBe(60);
      expect(paymentMonthToIndex(360)).toBe(359);
    });

    it('should throw error for invalid payment months', () => {
      expect(() => paymentMonthToIndex(0)).toThrow('Invalid payment month');
      expect(() => paymentMonthToIndex(-5)).toThrow('Invalid payment month');
    });
  });

  describe('indexToPaymentMonth', () => {
    it('should convert zero-based index to payment month', () => {
      expect(indexToPaymentMonth(0)).toBe(1);
      expect(indexToPaymentMonth(60)).toBe(61);
      expect(indexToPaymentMonth(359)).toBe(360);
    });

    it('should throw error for invalid indices', () => {
      expect(() => indexToPaymentMonth(-1)).toThrow('Invalid index');
    });
  });

  describe('monthsBetweenDates', () => {
    it('should calculate months between dates correctly', () => {
      // Same month
      expect(
        monthsBetweenDates(
          new Date(2025, 4, 15), // May 15, 2025
          new Date(2025, 4, 30) // May 30, 2025
        )
      ).toBe(0);

      // Different months same year
      expect(
        monthsBetweenDates(
          new Date(2025, 4, 15), // May 15, 2025
          new Date(2025, 7, 15) // August 15, 2025
        )
      ).toBe(3);

      // Different years
      expect(
        monthsBetweenDates(
          new Date(2025, 4, 15), // May 15, 2025
          new Date(2026, 4, 15) // May 15, 2026
        )
      ).toBe(12);

      // Different years and months
      expect(
        monthsBetweenDates(
          new Date(2025, 4, 15), // May 15, 2025
          new Date(2030, 10, 15) // November 15, 2030
        )
      ).toBe(66);
    });
  });

  describe('addMonthsToDate', () => {
    it('should add months to date correctly', () => {
      const startDate = new Date(2025, 4, 15); // May 15, 2025

      // Add 0 months
      const sameDate = addMonthsToDate(startDate, 0);
      expect(sameDate.getFullYear()).toBe(2025);
      expect(sameDate.getMonth()).toBe(4); // May (0-based)

      // Add 3 months
      const plus3Months = addMonthsToDate(startDate, 3);
      expect(plus3Months.getFullYear()).toBe(2025);
      expect(plus3Months.getMonth()).toBe(7); // August (0-based)

      // Add 12 months
      const plus1Year = addMonthsToDate(startDate, 12);
      expect(plus1Year.getFullYear()).toBe(2026);
      expect(plus1Year.getMonth()).toBe(4); // May (0-based)

      // Add 60 months (5 years)
      const plus5Years = addMonthsToDate(startDate, 60);
      expect(plus5Years.getFullYear()).toBe(2030);
      expect(plus5Years.getMonth()).toBe(4); // May (0-based)
    });
  });

  describe('dateToPaymentMonth and paymentMonthToDate', () => {
    it('should convert between dates and payment months correctly', () => {
      const loanStartDate = new Date(2025, 4, 1); // May 1, 2025 (payment month 1)

      // Test payment month 1 (loan start date)
      expect(dateToPaymentMonth(loanStartDate, loanStartDate)).toBe(1);

      // Test payment month 2
      const month2Date = new Date(2025, 5, 1); // June 1, 2025
      expect(dateToPaymentMonth(month2Date, loanStartDate)).toBe(2);

      // Test payment month 61 (rate change boundary)
      const month61Date = new Date(2030, 4, 1); // May 1, 2030
      expect(dateToPaymentMonth(month61Date, loanStartDate)).toBe(61);

      // Test round trip conversion
      for (const month of [1, 2, 12, 36, 61, 360]) {
        const date = paymentMonthToDate(month, loanStartDate);
        expect(dateToPaymentMonth(date, loanStartDate)).toBe(month);
      }
    });
  });

  describe('Real-world scenario test', () => {
    it('should handle a mortgage starting on May 20, 2025 correctly', () => {
      const loanStartDate = new Date(2025, 4, 20); // May 20, 2025

      // First payment (month 1)
      expect(paymentMonthToDate(1, loanStartDate).getMonth()).toBe(4); // May
      expect(paymentMonthToDate(1, loanStartDate).getFullYear()).toBe(2025);

      // Payment at 5 years (month 61) - rate change boundary
      const rateChangeDate = paymentMonthToDate(61, loanStartDate);
      expect(rateChangeDate.getMonth()).toBe(4); // May
      expect(rateChangeDate.getFullYear()).toBe(2030);

      // Convert back to payment month
      expect(dateToPaymentMonth(rateChangeDate, loanStartDate)).toBe(61);

      // Array index for month 61
      expect(paymentMonthToIndex(61)).toBe(60);
    });
  });
});
