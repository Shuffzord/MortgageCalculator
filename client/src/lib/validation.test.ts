import {
  validateLoanDetails,
  validateAffordabilityParams,
  validateBreakEvenParams,
  normalizeInterestRate,
  normalizeLoanTerm,
  normalizeDate,
  normalizeLoanDetails,
} from './validation';
import { LoanDetails } from './types';

describe('Validation Functions', () => {
  describe('validateLoanDetails', () => {
    it('should validate valid loan details', () => {
      const loanDetails: LoanDetails = {
        principal: 300000,
        interestRatePeriods: [{ startMonth: 1, interestRate: 3.5 }],
        loanTerm: 30,
        overpaymentPlans: [],
        startDate: new Date(),
        name: 'Test Loan',
      };

      const result = validateLoanDetails(loanDetails);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject negative principal', () => {
      const loanDetails: LoanDetails = {
        principal: -100000,
        interestRatePeriods: [{ startMonth: 1, interestRate: 3.5 }],
        loanTerm: 30,
        overpaymentPlans: [],
        startDate: new Date(),
        name: 'Test Loan',
      };

      const result = validateLoanDetails(loanDetails);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Principal amount must be greater than zero');
    });

    it('should reject negative interest rate', () => {
      const loanDetails: LoanDetails = {
        principal: 300000,
        interestRatePeriods: [{ startMonth: 1, interestRate: -2.5 }],
        loanTerm: 30,
        overpaymentPlans: [],
        startDate: new Date(),
        name: 'Test Loan',
      };

      const result = validateLoanDetails(loanDetails);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Interest rate cannot be negative');
    });

    it('should reject zero loan term', () => {
      const loanDetails: LoanDetails = {
        principal: 300000,
        interestRatePeriods: [{ startMonth: 1, interestRate: 3.5 }],
        loanTerm: 0,
        overpaymentPlans: [],
        startDate: new Date(),
        name: 'Test Loan',
      };

      const result = validateLoanDetails(loanDetails);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Loan term must be greater than zero');
    });

    it('should validate overpayment plans', () => {
      const loanDetails: LoanDetails = {
        principal: 300000,
        interestRatePeriods: [{ startMonth: 1, interestRate: 3.5 }],
        loanTerm: 30,
        overpaymentPlans: [
          {
            amount: -100,
            startDate: new Date(),
            isRecurring: true,
            frequency: 'monthly',
          },
        ],
        startDate: new Date(),
        name: 'Test Loan',
      };

      const result = validateLoanDetails(loanDetails, { validateDates: true });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Overpayment plan #1: Amount must be greater than zero');
    });

    it('should respect validation options', () => {
      const loanDetails: LoanDetails = {
        principal: -100000, // Negative principal
        interestRatePeriods: [{ startMonth: 1, interestRate: 15 }], // High interest rate
        loanTerm: 50, // Long term
        overpaymentPlans: [],
        startDate: new Date(),
        name: 'Test Loan',
      };

      // Allow negative principal
      const result1 = validateLoanDetails(loanDetails, { allowNegativePrincipal: true });
      expect(result1.errors).not.toContain('Principal amount must be greater than zero');

      // Set max interest rate
      const result2 = validateLoanDetails(loanDetails, { maxInterestRate: 10 });
      expect(result2.errors).toContain('Interest rate exceeds maximum allowed (10%)');

      // Set max loan term
      const result3 = validateLoanDetails(loanDetails, { maxLoanTerm: 40 });
      expect(result3.errors).toContain('Loan term exceeds maximum allowed (40 years)');
    });
  });

  describe('validateAffordabilityParams', () => {
    it('should validate valid affordability parameters', () => {
      const result = validateAffordabilityParams(5000, 2000, 3.5, 30);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject negative or zero income', () => {
      const result = validateAffordabilityParams(0, 2000, 3.5, 30);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Monthly income must be greater than zero');
    });

    it('should reject negative expenses', () => {
      const result = validateAffordabilityParams(5000, -500, 3.5, 30);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Monthly expenses cannot be negative');
    });

    it('should reject expenses greater than income', () => {
      const result = validateAffordabilityParams(5000, 6000, 3.5, 30);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Monthly expenses must be less than monthly income');
    });

    it('should reject negative interest rate', () => {
      const result = validateAffordabilityParams(5000, 2000, -1.5, 30);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Interest rate must be greater than zero');
    });

    it('should reject zero loan term', () => {
      const result = validateAffordabilityParams(5000, 2000, 3.5, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Loan term must be greater than zero');
    });
  });

  describe('validateBreakEvenParams', () => {
    it('should validate valid break-even parameters', () => {
      const currentLoan: LoanDetails = {
        principal: 300000,
        interestRatePeriods: [{ startMonth: 1, interestRate: 4.5 }],
        loanTerm: 30,
        overpaymentPlans: [],
        startDate: new Date(),
        name: 'Current Loan',
      };

      const newLoan: LoanDetails = {
        principal: 300000,
        interestRatePeriods: [{ startMonth: 1, interestRate: 3.5 }],
        loanTerm: 30,
        overpaymentPlans: [],
        startDate: new Date(),
        name: 'New Loan',
      };

      const result = validateBreakEvenParams(currentLoan, newLoan, 3000);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should warn when new rate is not lower', () => {
      const currentLoan: LoanDetails = {
        principal: 300000,
        interestRatePeriods: [{ startMonth: 1, interestRate: 3.5 }],
        loanTerm: 30,
        overpaymentPlans: [],
        startDate: new Date(),
        name: 'Current Loan',
      };

      const newLoan: LoanDetails = {
        principal: 300000,
        interestRatePeriods: [{ startMonth: 1, interestRate: 4.0 }],
        loanTerm: 30,
        overpaymentPlans: [],
        startDate: new Date(),
        name: 'New Loan',
      };

      const result = validateBreakEvenParams(currentLoan, newLoan, 3000);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Warning: New interest rate is not lower than current rate');
    });

    it('should reject negative refinancing costs', () => {
      const currentLoan: LoanDetails = {
        principal: 300000,
        interestRatePeriods: [{ startMonth: 1, interestRate: 4.5 }],
        loanTerm: 30,
        overpaymentPlans: [],
        startDate: new Date(),
        name: 'Current Loan',
      };

      const newLoan: LoanDetails = {
        principal: 300000,
        interestRatePeriods: [{ startMonth: 1, interestRate: 3.5 }],
        loanTerm: 30,
        overpaymentPlans: [],
        startDate: new Date(),
        name: 'New Loan',
      };

      const result = validateBreakEvenParams(currentLoan, newLoan, -1000);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Refinancing costs cannot be negative');
    });
  });

  describe('Normalization Functions', () => {
    it('should normalize interest rate from decimal to percentage', () => {
      expect(normalizeInterestRate(0.045)).toBe(4.5);
      expect(normalizeInterestRate(0.0375)).toBe(3.75);
    });

    it('should keep percentage interest rates unchanged', () => {
      expect(normalizeInterestRate(4.5)).toBe(4.5);
      expect(normalizeInterestRate(3.75)).toBe(3.75);
    });

    it('should convert loan term from months to years', () => {
      expect(normalizeLoanTerm(360, true)).toBe(30);
      expect(normalizeLoanTerm(180, true)).toBe(15);
    });

    it('should keep loan term in years unchanged', () => {
      expect(normalizeLoanTerm(30, false)).toBe(30);
      expect(normalizeLoanTerm(15, false)).toBe(15);
    });

    it('should convert string dates to Date objects', () => {
      const dateStr = '2025-01-15';
      const result = normalizeDate(dateStr);
      expect(result instanceof Date).toBe(true);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(0); // January is 0
      expect(result.getDate()).toBe(15);
    });

    it('should keep Date objects unchanged', () => {
      const date = new Date(2025, 0, 15);
      const result = normalizeDate(date);
      expect(result).toBe(date);
    });

    it('should normalize all fields in a loan details object', () => {
      // Create an object with string dates for testing normalization
      const loanDetailsInput = {
        principal: 300000,
        interestRatePeriods: [
          { startMonth: 1, interestRate: 0.045 }, // Decimal format
        ],
        loanTerm: 30,
        overpaymentPlans: [
          {
            amount: 10000,
            startDate: '2025-01-15', // String date
            isRecurring: false,
            frequency: 'one-time',
          },
        ],
        startDate: '2024-06-01', // String date
        name: 'Test Loan',
      };

      // Cast to LoanDetails to test normalization
      const loanDetails = loanDetailsInput as unknown as LoanDetails;

      const normalized = normalizeLoanDetails(loanDetails);

      // Check interest rate normalization
      expect(normalized.interestRatePeriods[0].interestRate).toBe(4.5);

      // Check date normalization
      expect(normalized.startDate instanceof Date).toBe(true);
      expect(normalized.overpaymentPlans[0].startDate instanceof Date).toBe(true);
    });
  });
});
