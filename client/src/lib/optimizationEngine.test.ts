import { analyzeOverpaymentImpact } from './optimizationEngine';
import { calculateLoanDetails } from './calculationEngine';
import { LoanDetails, OverpaymentDetails } from './types';

// Mock the calculationEngine's calculateLoanDetails function
jest.mock('./calculationEngine', () => ({
  calculateLoanDetails: jest.fn(),
}));

describe('analyzeOverpaymentImpact', () => {
  // Setup common test data
  const mockLoanDetails: LoanDetails = {
    principal: 300000,
    interestRatePeriods: [{ startMonth: 1, interestRate: 4 }],
    loanTerm: 30,
    overpaymentPlans: [],
    startDate: new Date('2025-01-01'),
    name: 'Test Loan',
    currency: 'USD',
  };

  // Mock baseline calculation results
  const mockBaselineResults = {
    monthlyPayment: 1432.25,
    totalInterest: 215610.0,
    totalCost: 515610.0,
    apr: 4.0,
    originalTerm: 30,
    actualTerm: 30,
    amortizationSchedule: [],
    yearlyData: [],
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup default mock implementation for calculateLoanDetails
    (calculateLoanDetails as jest.Mock).mockReturnValue(mockBaselineResults);
  });

  test('should return impact data for monthly overpayments', () => {
    // Arrange
    const maxMonthlyAmount = 200;
    const steps = 5;

    // Mock overpayment results with decreasing interest and term
    (calculateLoanDetails as jest.Mock).mockImplementation(
      (principal, interestRatePeriods, loanTerm, overpayment) => {
        if (overpayment) {
          const amount = overpayment.amount;
          // Calculate a proportional reduction in interest and term based on overpayment amount
          const interestReduction = amount * 500; // Simplified calculation for test
          const termReduction = amount / 100; // Simplified calculation for test

          return {
            monthlyPayment: 1432.25,
            totalInterest: 215610.0 - interestReduction,
            totalCost: 515610.0 - interestReduction,
            apr: 4.0,
            originalTerm: 30,
            actualTerm: 30 - termReduction,
            amortizationSchedule: [],
            yearlyData: [],
          };
        }
        return mockBaselineResults;
      }
    );

    // Act
    const result = analyzeOverpaymentImpact(mockLoanDetails, maxMonthlyAmount, steps);

    // Assert
    expect(result).toHaveLength(steps);
    expect(calculateLoanDetails).toHaveBeenCalledTimes(steps + 1); // baseline + steps

    // Check that each result has the expected properties
    result.forEach((item, index) => {
      const expectedAmount = (maxMonthlyAmount / steps) * (index + 1);
      expect(item).toHaveProperty('amount');
      expect(item).toHaveProperty('interestSaved');
      expect(item).toHaveProperty('termReduction');
      expect(item.amount).toBeCloseTo(expectedAmount);
      expect(item.interestSaved).toBeGreaterThan(0);
      expect(item.termReduction).toBeGreaterThan(0);
    });

    // Check that values increase with overpayment amount
    for (let i = 1; i < result.length; i++) {
      expect(result[i].interestSaved).toBeGreaterThan(result[i - 1].interestSaved);
      expect(result[i].termReduction).toBeGreaterThan(result[i - 1].termReduction);
    }
  });

  test('should return impact data for one-time overpayments', () => {
    // Arrange
    const mockLoanWithOneTimeOverpayment = {
      ...mockLoanDetails,
      overpaymentPlans: [
        {
          amount: 10000,
          startMonth: 1,
          startDate: new Date('2025-01-01'),
          isRecurring: false,
          frequency: 'one-time' as const,
          effect: 'reduceTerm' as const,
        },
      ],
    };

    const maxMonthlyAmount = 200; // This will be used for analysis even though we have a one-time overpayment
    const steps = 5;

    // Mock overpayment results
    (calculateLoanDetails as jest.Mock).mockImplementation(
      (principal, interestRatePeriods, loanTerm, overpayment) => {
        if (overpayment) {
          const amount = overpayment.amount;
          const interestReduction = amount * 500;
          const termReduction = amount / 100;

          return {
            monthlyPayment: 1432.25,
            totalInterest: 215610.0 - interestReduction,
            totalCost: 515610.0 - interestReduction,
            apr: 4.0,
            originalTerm: 30,
            actualTerm: 30 - termReduction,
            amortizationSchedule: [],
            yearlyData: [],
          };
        }
        return mockBaselineResults;
      }
    );

    // Act
    const result = analyzeOverpaymentImpact(
      mockLoanWithOneTimeOverpayment,
      maxMonthlyAmount,
      steps
    );

    // Assert
    expect(result).toHaveLength(steps);
    expect(calculateLoanDetails).toHaveBeenCalledTimes(steps + 1);

    // Check that each result has the expected properties
    result.forEach((item) => {
      expect(item).toHaveProperty('amount');
      expect(item).toHaveProperty('interestSaved');
      expect(item).toHaveProperty('termReduction');
      expect(item.interestSaved).toBeGreaterThan(0);
      expect(item.termReduction).toBeGreaterThan(0);
    });
  });

  test('should handle zero or negative maxMonthlyAmount', () => {
    // Arrange
    const maxMonthlyAmount = 0;
    const steps = 5;

    // Act
    const result = analyzeOverpaymentImpact(mockLoanDetails, maxMonthlyAmount, steps);

    // Assert
    expect(result).toHaveLength(steps);

    // Even with zero maxMonthlyAmount, we should still get some results
    // because the function should use a small default value
    result.forEach((item) => {
      expect(item.amount).toBeGreaterThanOrEqual(0);
    });
  });

  test('should handle different step counts', () => {
    // Arrange
    const maxMonthlyAmount = 200;
    const steps = 3; // Different step count

    // Act
    const result = analyzeOverpaymentImpact(mockLoanDetails, maxMonthlyAmount, steps);

    // Assert
    expect(result).toHaveLength(steps);
    expect(calculateLoanDetails).toHaveBeenCalledTimes(steps + 1);
  });
});
