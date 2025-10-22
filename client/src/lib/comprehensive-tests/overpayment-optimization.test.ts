import { 
  optimizeOverpayments, 
  analyzeOverpaymentImpact,
  compareLumpSumVsRegular
} from '../optimizationEngine';
import { LoanDetails, OptimizationParameters } from '../types';

describe('Overpayment Optimization Tests', () => {
  // Common test loan details
  const baseLoanDetails: LoanDetails = {
    principal: 300000,
    interestRatePeriods: [{ startMonth: 1, interestRate: 4.5 }],
    loanTerm: 30,
    overpaymentPlans: [],
    startDate: new Date('2025-01-01'),
    name: 'Test Loan',
    currency: 'USD',
    repaymentModel: 'equalInstallments'
  };
  
  // Common optimization parameters
  const baseOptimizationParams: OptimizationParameters = {
    maxMonthlyOverpayment: 200,
    maxOneTimeOverpayment: 10000,
    optimizationStrategy: 'maximizeInterestSavings',
    feePercentage: 0
  };
  
  test('OPT1: Basic Optimization - Interest Savings Strategy', () => {
    // Arrange
    const loanDetails = { ...baseLoanDetails };
    const optimizationParams: OptimizationParameters = {
      ...baseOptimizationParams,
      optimizationStrategy: 'maximizeInterestSavings'
    };
    
    // Act
    const result = optimizeOverpayments(loanDetails, optimizationParams);
    
    // Assert
    expect(result).toBeDefined();
    expect(result.optimizedOverpayments.length).toBeGreaterThan(0);
    expect(result.interestSaved).toBeGreaterThan(0);
    expect(result.timeOrPaymentSaved).toBeGreaterThan(0);
    
    // Verify chart data is generated
    expect(result.comparisonChart).toBeDefined();
    expect(result.comparisonChart?.labels.length).toBeGreaterThan(0);
    expect(result.comparisonChart?.originalData.length).toBeGreaterThan(0);
    expect(result.comparisonChart?.optimizedData.length).toBeGreaterThan(0);
  });
  
  test('OPT2: Basic Optimization - Minimize Time Strategy', () => {
    // Arrange
    const loanDetails = { ...baseLoanDetails };
    const optimizationParams: OptimizationParameters = {
      ...baseOptimizationParams,
      optimizationStrategy: 'minimizeTime'
    };
    
    // Act
    const result = optimizeOverpayments(loanDetails, optimizationParams);
    
    // Assert
    expect(result).toBeDefined();
    expect(result.optimizedOverpayments.length).toBeGreaterThan(0);
    expect(result.interestSaved).toBeGreaterThan(0);
    expect(result.timeOrPaymentSaved).toBeGreaterThan(0);
  });
  
  test('OPT3: Basic Optimization - Balanced Strategy', () => {
    // Arrange
    const loanDetails = { ...baseLoanDetails };
    const optimizationParams: OptimizationParameters = {
      ...baseOptimizationParams,
      optimizationStrategy: 'balanced'
    };
    
    // Act
    const result = optimizeOverpayments(loanDetails, optimizationParams);
    
    // Assert
    expect(result).toBeDefined();
    expect(result.optimizedOverpayments.length).toBeGreaterThan(0);
    expect(result.interestSaved).toBeGreaterThan(0);
    expect(result.timeOrPaymentSaved).toBeGreaterThan(0);
  });
  
  test('OPT4: Optimization with Zero Overpayment Amounts', () => {
    // Arrange
    const loanDetails = { ...baseLoanDetails };
    const optimizationParams: OptimizationParameters = {
      ...baseOptimizationParams,
      maxMonthlyOverpayment: 0,
      maxOneTimeOverpayment: 0
    };
    
    // Act
    const result = optimizeOverpayments(loanDetails, optimizationParams);
    
    // Assert
    // Should return a default strategy with no overpayments
    expect(result).toBeDefined();
    expect(result.optimizedOverpayments.length).toBe(0);
    expect(result.interestSaved).toBe(0);
    expect(result.timeOrPaymentSaved).toBe(0);
  });
  
  test('OPT5: Analyze Overpayment Impact', () => {
    // Arrange
    const loanDetails = { ...baseLoanDetails };
    const maxMonthlyAmount = 500;
    const steps = 5;
    
    // Act
    const result = analyzeOverpaymentImpact(loanDetails, maxMonthlyAmount, steps);
    
    // Assert
    expect(result).toBeDefined();
    expect(result.length).toBe(steps);
    
    // Verify increasing overpayment amounts
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i + 1].amount).toBeGreaterThan(result[i].amount);
    }
    
    // Verify increasing interest savings with higher overpayments
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i + 1].interestSaved).toBeGreaterThanOrEqual(result[i].interestSaved);
    }
    
    // Verify increasing term reduction with higher overpayments
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i + 1].termReduction).toBeGreaterThan(result[i].termReduction);
    }
  });
  
  test('OPT6: Compare Lump Sum vs Regular Payments', () => {
    // Arrange
    const loanDetails = { ...baseLoanDetails };
    const lumpSumAmount = 10000;
    const monthlyAmount = 200;
    
    // Act
    const result = compareLumpSumVsRegular(loanDetails, lumpSumAmount, monthlyAmount);
    
    // Assert
    expect(result).toBeDefined();
    expect(result.lumpSum).toBeDefined();
    expect(result.monthly).toBeDefined();
    expect(result.breakEvenMonth).toBeDefined();
    
    // Verify lump sum results
    expect(result.lumpSum.interestSaved).toBeGreaterThan(0);
    expect(result.lumpSum.termReduction).toBeGreaterThan(0);
    
    // Verify monthly results
    expect(result.monthly.interestSaved).toBeGreaterThan(0);
    expect(result.monthly.termReduction).toBeGreaterThan(0);
    
    // Verify break-even month calculation
    expect(result.breakEvenMonth).toBe(Math.ceil(lumpSumAmount / monthlyAmount));
  });
  
  test('OPT7: Optimization with Fee Percentage', () => {
    // Arrange
    const loanDetails = { ...baseLoanDetails };
    const optimizationParams: OptimizationParameters = {
      ...baseOptimizationParams,
      feePercentage: 5 // 5% fee
    };
    
    // Act
    const result = optimizeOverpayments(loanDetails, optimizationParams);
    
    // Assert
    expect(result).toBeDefined();
    expect(result.optimizationFee).toBeGreaterThan(0);
    
    // Verify fee calculation
    const expectedFee = result.optimizationValue * optimizationParams.feePercentage / 100;
    expect(result.optimizationFee).toBeCloseTo(expectedFee, 2);
  });
});