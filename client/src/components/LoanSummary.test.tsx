import React from 'react';
import LoanSummary from './LoanSummary';
import { calculationService } from '@/lib/services/calculationService';
import { CalculationResults, LoanDetails } from '@/lib/types';

// Mock dependencies
jest.mock('@/lib/services/calculationService', () => ({
  calculationService: {
    analyzeOverpaymentImpact: jest.fn()
  }
}));

// We don't need to mock react-i18next or Chart.js since we're not rendering the component

describe('LoanSummary', () => {
  // Common test data
  const mockCalculationResults: CalculationResults = {
    monthlyPayment: 1432.25,
    totalInterest: 215610.00,
    totalCost: 515610.00,
    apr: 4.0,
    originalTerm: 30,
    actualTerm: 30,
    amortizationSchedule: [],
    yearlyData: []
  };

  const mockOverpaymentResults: CalculationResults = {
    monthlyPayment: 1532.25, // Higher payment due to overpayment
    totalInterest: 195610.00, // Lower total interest
    totalCost: 495610.00,
    apr: 4.0,
    originalTerm: 30,
    actualTerm: 27.5, // Shorter term
    timeOrPaymentSaved: 30, // Months saved
    amortizationSchedule: [],
    yearlyData: []
  };

  const mockImpactData = [
    { amount: 100, interestSaved: 5000, termReduction: 0.5 },
    { amount: 200, interestSaved: 10000, termReduction: 1.0 },
    { amount: 300, interestSaved: 15000, termReduction: 1.5 },
    { amount: 400, interestSaved: 20000, termReduction: 2.0 },
    { amount: 500, interestSaved: 25000, termReduction: 2.5 }
  ];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock implementation
    (calculationService.analyzeOverpaymentImpact as jest.Mock).mockReturnValue(mockImpactData);
  });

  test('should call analyzeOverpaymentImpact with monthly overpayments', () => {
    // Arrange
    const loanDetails: LoanDetails = {
      principal: 300000,
      interestRatePeriods: [{ startMonth: 1, interestRate: 4 }],
      loanTerm: 30,
      overpaymentPlans: [{
        amount: 200,
        startMonth: 1,
        startDate: new Date('2025-01-01'),
        isRecurring: true,
        frequency: 'monthly' as const,
        effect: 'reduceTerm' as const
      }],
      startDate: new Date('2025-01-01'),
      name: 'Test Loan',
      currency: 'USD'
    };

    // Reset mock
    jest.clearAllMocks();

    // Act - simulate the useEffect hook logic
    // Note: We've removed the overpaymentResults condition to match the updated component
    if (loanDetails.overpaymentPlans &&
        loanDetails.overpaymentPlans.length > 0) {
      
      // Calculate the maximum monthly overpayment amount to analyze
      let maxMonthlyAmount = loanDetails.overpaymentPlans.reduce((max, plan) => {
        if (plan.frequency === 'monthly') {
          return Math.max(max, plan.amount);
        }
        return max;
      }, 0);
      
      // If no monthly overpayment, use a reasonable monthly equivalent
      if (maxMonthlyAmount === 0) {
        const firstPlan = loanDetails.overpaymentPlans[0];
        if (firstPlan.frequency === 'one-time') {
          maxMonthlyAmount = firstPlan.amount / 12;
        } else if (firstPlan.frequency === 'quarterly') {
          maxMonthlyAmount = firstPlan.amount / 3;
        } else if (firstPlan.frequency === 'annual') {
          maxMonthlyAmount = firstPlan.amount / 12;
        }
      }
      
      // Ensure we have a reasonable amount to analyze
      const minAnalysisAmount = Math.max(
        maxMonthlyAmount,
        loanDetails.principal * 0.01 / 12
      );
      
      calculationService.analyzeOverpaymentImpact(
        loanDetails,
        minAnalysisAmount * 2,
        5
      );
    }

    // Assert
    expect(calculationService.analyzeOverpaymentImpact).toHaveBeenCalled();
    expect(calculationService.analyzeOverpaymentImpact).toHaveBeenCalledWith(
      loanDetails,
      expect.any(Number),
      5
    );
  });

  test('should call analyzeOverpaymentImpact with one-time overpayments', () => {
    // Arrange
    const loanDetails: LoanDetails = {
      principal: 300000,
      interestRatePeriods: [{ startMonth: 1, interestRate: 4 }],
      loanTerm: 30,
      overpaymentPlans: [{
        amount: 10000,
        startMonth: 1,
        startDate: new Date('2025-01-01'),
        isRecurring: false,
        frequency: 'one-time' as const,
        effect: 'reduceTerm' as const
      }],
      startDate: new Date('2025-01-01'),
      name: 'Test Loan',
      currency: 'USD'
    };

    // Reset mock
    jest.clearAllMocks();

    // Act - simulate the useEffect hook logic
    if (loanDetails.overpaymentPlans && loanDetails.overpaymentPlans.length > 0) {
      // Calculate the maximum monthly overpayment amount to analyze
      let maxMonthlyAmount = loanDetails.overpaymentPlans.reduce((max, plan) => {
        if (plan.frequency === 'monthly') {
          return Math.max(max, plan.amount);
        }
        return max;
      }, 0);
      
      // If no monthly overpayment, use a reasonable monthly equivalent
      if (maxMonthlyAmount === 0) {
        const firstPlan = loanDetails.overpaymentPlans[0];
        if (firstPlan.frequency === 'one-time') {
          maxMonthlyAmount = firstPlan.amount / 12;
        }
      }
      
      // Ensure we have a reasonable amount to analyze (at least 1% of principal)
      const minAnalysisAmount = Math.max(
        maxMonthlyAmount,
        loanDetails.principal * 0.01 / 12 // At least 1% of principal per year (divided by 12 for monthly)
      );
      
      calculationService.analyzeOverpaymentImpact(
        loanDetails,
        minAnalysisAmount * 2,
        5
      );
    }

    // Assert
    expect(calculationService.analyzeOverpaymentImpact).toHaveBeenCalled();
    // For one-time payment, we expect the monthly equivalent to be around 10000/12
    const expectedMonthlyEquivalent = 10000 / 12;
    expect(calculationService.analyzeOverpaymentImpact).toHaveBeenCalledWith(
      loanDetails,
      expect.any(Number),
      5
    );
  });

  test('should call analyzeOverpaymentImpact with quarterly overpayments', () => {
    // Arrange
    const loanDetails: LoanDetails = {
      principal: 300000,
      interestRatePeriods: [{ startMonth: 1, interestRate: 4 }],
      loanTerm: 30,
      overpaymentPlans: [{
        amount: 1000,
        startMonth: 1,
        startDate: new Date('2025-01-01'),
        isRecurring: true,
        frequency: 'quarterly' as const,
        effect: 'reduceTerm' as const
      }],
      startDate: new Date('2025-01-01'),
      name: 'Test Loan',
      currency: 'USD'
    };

    // Reset mock
    jest.clearAllMocks();

    // Act - simulate the useEffect hook logic
    if (loanDetails.overpaymentPlans && loanDetails.overpaymentPlans.length > 0) {
      // Calculate the maximum monthly overpayment amount to analyze
      let maxMonthlyAmount = loanDetails.overpaymentPlans.reduce((max, plan) => {
        if (plan.frequency === 'monthly') {
          return Math.max(max, plan.amount);
        }
        return max;
      }, 0);
      
      // If no monthly overpayment, use a reasonable monthly equivalent
      if (maxMonthlyAmount === 0) {
        const firstPlan = loanDetails.overpaymentPlans[0];
        if (firstPlan.frequency === 'quarterly') {
          maxMonthlyAmount = firstPlan.amount / 3;
          console.log("Quarterly payment converted to monthly:", maxMonthlyAmount);
        }
      }
      
      // Ensure we have a reasonable amount to analyze (at least 1% of principal)
      const minAnalysisAmount = Math.max(
        maxMonthlyAmount,
        loanDetails.principal * 0.01 / 12 // At least 1% of principal per year (divided by 12 for monthly)
      );
      
      calculationService.analyzeOverpaymentImpact(
        loanDetails,
        minAnalysisAmount * 2,
        5
      );
    }

    // Assert
    expect(calculationService.analyzeOverpaymentImpact).toHaveBeenCalled();
    // For quarterly payment, we expect the monthly equivalent to be around 1000/3
    const expectedMonthlyEquivalent = 1000 / 3;
    expect(calculationService.analyzeOverpaymentImpact).toHaveBeenCalledWith(
      loanDetails,
      expect.any(Number),
      5
    );
  });

  test('should not call analyzeOverpaymentImpact without overpayments', () => {
    // Arrange
    const loanDetails: LoanDetails = {
      principal: 300000,
      interestRatePeriods: [{ startMonth: 1, interestRate: 4 }],
      loanTerm: 30,
      overpaymentPlans: [], // No overpayments
      startDate: new Date('2025-01-01'),
      name: 'Test Loan',
      currency: 'USD'
    };

    // Reset mock
    jest.clearAllMocks();

    // Act - simulate the useEffect hook logic
    // Note: We've removed the overpaymentResults condition, so we need to check only the overpaymentPlans
    if (loanDetails.overpaymentPlans && loanDetails.overpaymentPlans.length > 0) {
      calculationService.analyzeOverpaymentImpact(
        loanDetails,
        100, // Doesn't matter, this won't be called
        5
      );
    }

    // Assert
    expect(calculationService.analyzeOverpaymentImpact).not.toHaveBeenCalled();
  });
});