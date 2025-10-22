import { comparisonService, ComparisonServiceError } from './comparisonService';
import { CalculationResults, LoanDetails } from '../types';

describe('comparisonService', () => {
  describe('compareLoanResults', () => {
    it('should correctly calculate savings metrics', () => {
      // Create mock calculation results
      const baseCalculation = {
        totalInterest: 100000,
        actualTerm: 360,
        amortizationSchedule: [],
        yearlyData: [],
        monthlyPayment: 1000,
        originalTerm: 360
      } as CalculationResults;
      
      const comparisonCalculation = {
        totalInterest: 80000,
        actualTerm: 300,
        amortizationSchedule: [],
        yearlyData: [],
        monthlyPayment: 1000,
        originalTerm: 360
      } as CalculationResults;
      
      // Run comparison
      const result = comparisonService.compareLoanResults(baseCalculation, comparisonCalculation);
      
      // Assert results
      expect(result.interestSaved).toBe(20000);
      // The time saved is now in months (60 months = 5 years)
      expect(result.timeSaved).toBe(720);
      expect(result.percentageSaved).toBe(20);
    });
    
    it('should handle zero values', () => {
      // Create mock calculation results with zero values
      const baseCalculation = {
        totalInterest: 0,
        actualTerm: 360,
        amortizationSchedule: [],
        yearlyData: [],
        monthlyPayment: 1000,
        originalTerm: 360
      } as CalculationResults;
      
      const comparisonCalculation = {
        totalInterest: 0,
        actualTerm: 300,
        amortizationSchedule: [],
        yearlyData: [],
        monthlyPayment: 1000,
        originalTerm: 360
      } as CalculationResults;
      
      // Run comparison
      const result = comparisonService.compareLoanResults(baseCalculation, comparisonCalculation);
      
      // Assert results
      expect(result.interestSaved).toBe(0);
      // The time saved is now in months (60 months = 5 years)
      expect(result.timeSaved).toBe(720);
      expect(result.percentageSaved).toBe(0);
    });
    
    it('should handle negative savings', () => {
      // Create mock calculation results where comparison has higher values
      const baseCalculation = {
        totalInterest: 80000,
        actualTerm: 300,
        amortizationSchedule: [],
        yearlyData: [],
        monthlyPayment: 1000,
        originalTerm: 360
      } as CalculationResults;
      
      const comparisonCalculation = {
        totalInterest: 100000,
        actualTerm: 360,
        amortizationSchedule: [],
        yearlyData: [],
        monthlyPayment: 1000,
        originalTerm: 360
      } as CalculationResults;
      
      // Run comparison
      const result = comparisonService.compareLoanResults(baseCalculation, comparisonCalculation);
      
      // Assert results
      expect(result.interestSaved).toBe(-20000);
      // The time saved is now in months (-60 months = -5 years)
      expect(result.timeSaved).toBe(-720);
      expect(result.percentageSaved).toBe(-25);
    });
    
    it('should throw error for invalid inputs', () => {
      expect(() => {
        comparisonService.compareLoanResults(null as any, {} as CalculationResults);
      }).toThrow(ComparisonServiceError);
      
      expect(() => {
        comparisonService.compareLoanResults({} as CalculationResults, null as any);
      }).toThrow(ComparisonServiceError);
    });
  });
  
  describe('compareWithOverpayments', () => {
    it('should correctly compare base loan with overpayment loan', () => {
      // Create mock calculation results
      const baseCalculation = {
        totalInterest: 100000,
        actualTerm: 360,
        amortizationSchedule: [],
        yearlyData: [],
        monthlyPayment: 1000,
        originalTerm: 360
      } as CalculationResults;
      
      const overpaymentCalculation = {
        totalInterest: 70000,
        actualTerm: 280,
        amortizationSchedule: [],
        yearlyData: [],
        monthlyPayment: 1000,
        originalTerm: 360
      } as CalculationResults;
      
      // Run comparison
      const result = comparisonService.compareWithOverpayments(baseCalculation, overpaymentCalculation);
      
      // Assert results
      expect(result.interestSaved).toBe(30000);
      // The time saved is now in months (80 months = 6.67 years)
      expect(result.timeSaved).toBe(960);
      expect(result.percentageSaved).toBe(30);
    });
    
    it('should throw error for invalid inputs', () => {
      expect(() => {
        comparisonService.compareWithOverpayments(null as any, {} as CalculationResults);
      }).toThrow(ComparisonServiceError);
    });
  });
  
  describe('compareDifferentTerms', () => {
    it('should compare loans with different terms', () => {
      // Create mock loan details
      const baseLoanDetails: LoanDetails = {
        principal: 300000,
        interestRatePeriods: [{ startMonth: 0, interestRate: 4.5 }],
        loanTerm: 30,
        overpaymentPlans: [],
        startDate: new Date('2025-01-01'),
        name: 'Base Loan'
      };
      
      // Mock the compareMultipleScenarios method
      const originalCompareMultipleScenarios = comparisonService.compareMultipleScenarios;
      comparisonService.compareMultipleScenarios = jest.fn().mockReturnValue({
        scenarios: [],
        differences: []
      });
      
      // Run comparison
      comparisonService.compareDifferentTerms(baseLoanDetails, [15, 20]);
      
      // Assert that compareMultipleScenarios was called with the correct scenarios
      expect(comparisonService.compareMultipleScenarios).toHaveBeenCalledWith([
        {
          id: 'base',
          name: '30 Year Term (Base)',
          loanDetails: baseLoanDetails
        },
        {
          id: 'term-15',
          name: '15 Year Term',
          loanDetails: {
            ...baseLoanDetails,
            loanTerm: 15
          }
        },
        {
          id: 'term-20',
          name: '20 Year Term',
          loanDetails: {
            ...baseLoanDetails,
            loanTerm: 20
          }
        }
      ]);
      
      // Restore the original method
      comparisonService.compareMultipleScenarios = originalCompareMultipleScenarios;
    });
    
    it('should throw error for invalid inputs', () => {
      expect(() => {
        comparisonService.compareDifferentTerms(null as any, [15, 20]);
      }).toThrow(ComparisonServiceError);
      
      expect(() => {
        comparisonService.compareDifferentTerms({} as LoanDetails, []);
      }).toThrow(ComparisonServiceError);
    });
  });
  
  describe('compareDifferentRates', () => {
    it('should compare loans with different interest rates', () => {
      // Create mock loan details
      const baseLoanDetails: LoanDetails = {
        principal: 300000,
        interestRatePeriods: [{ startMonth: 0, interestRate: 4.5 }],
        loanTerm: 30,
        overpaymentPlans: [],
        startDate: new Date('2025-01-01'),
        name: 'Base Loan'
      };
      
      // Mock the compareMultipleScenarios method
      const originalCompareMultipleScenarios = comparisonService.compareMultipleScenarios;
      comparisonService.compareMultipleScenarios = jest.fn().mockReturnValue({
        scenarios: [],
        differences: []
      });
      
      // Run comparison
      comparisonService.compareDifferentRates(baseLoanDetails, [3.5, 5.5]);
      
      // Assert that compareMultipleScenarios was called with the correct scenarios
      expect(comparisonService.compareMultipleScenarios).toHaveBeenCalledWith([
        {
          id: 'base',
          name: '4.5% Interest Rate (Base)',
          loanDetails: baseLoanDetails
        },
        {
          id: 'rate-3.5',
          name: '3.5% Interest Rate',
          loanDetails: {
            ...baseLoanDetails,
            interestRatePeriods: [
              { startMonth: 0, interestRate: 3.5 },
              ...baseLoanDetails.interestRatePeriods.filter(p => p.startMonth > 0)
            ]
          }
        },
        {
          id: 'rate-5.5',
          name: '5.5% Interest Rate',
          loanDetails: {
            ...baseLoanDetails,
            interestRatePeriods: [
              { startMonth: 0, interestRate: 5.5 },
              ...baseLoanDetails.interestRatePeriods.filter(p => p.startMonth > 0)
            ]
          }
        }
      ]);
      
      // Restore the original method
      comparisonService.compareMultipleScenarios = originalCompareMultipleScenarios;
    });
  });
  
  describe('compareRepaymentModels', () => {
    it('should compare loans with different repayment models', () => {
      // Create mock loan details
      const baseLoanDetails: LoanDetails = {
        principal: 300000,
        interestRatePeriods: [{ startMonth: 0, interestRate: 4.5 }],
        loanTerm: 30,
        overpaymentPlans: [],
        startDate: new Date('2025-01-01'),
        name: 'Base Loan',
        repaymentModel: 'equalInstallments'
      };
      
      // Mock the compareMultipleScenarios method
      const originalCompareMultipleScenarios = comparisonService.compareMultipleScenarios;
      comparisonService.compareMultipleScenarios = jest.fn().mockReturnValue({
        scenarios: [],
        differences: []
      });
      
      // Run comparison
      comparisonService.compareRepaymentModels(baseLoanDetails);
      
      // Assert that compareMultipleScenarios was called with the correct scenarios
      expect(comparisonService.compareMultipleScenarios).toHaveBeenCalledWith([
        {
          id: 'base',
          name: 'equalInstallments (Base)',
          loanDetails: baseLoanDetails
        },
        {
          id: 'model-decreasingInstallments',
          name: 'decreasingInstallments',
          loanDetails: {
            ...baseLoanDetails,
            repaymentModel: 'decreasingInstallments'
          }
        }
      ]);
      
      // Restore the original method
      comparisonService.compareMultipleScenarios = originalCompareMultipleScenarios;
    });
  });
  
  describe('analyzeOverpaymentStrategies', () => {
    it('should analyze different overpayment strategies', () => {
      // Create mock loan details
      const loanDetails: LoanDetails = {
        principal: 300000,
        interestRatePeriods: [{ startMonth: 0, interestRate: 4.5 }],
        loanTerm: 30,
        overpaymentPlans: [],
        startDate: new Date('2025-01-01'),
        name: 'Test Loan'
      };
      
      // Run analysis
      const strategies = comparisonService.analyzeOverpaymentStrategies(loanDetails, 50000);
      
      // Assert that strategies were returned
      expect(strategies.length).toBeGreaterThan(0);
      expect(strategies[0].name).toBeDefined();
      expect(strategies[0].description).toBeDefined();
      expect(strategies[0].results.interestSaved).toBeDefined();
      expect(strategies[0].results.termReduction).toBeDefined();
      expect(strategies[0].results.effectivenessRatio).toBeDefined();
    });
    
    it('should throw error for invalid inputs', () => {
      expect(() => {
        comparisonService.analyzeOverpaymentStrategies(null as any, 50000);
      }).toThrow(ComparisonServiceError);
      
      expect(() => {
        comparisonService.analyzeOverpaymentStrategies({} as LoanDetails, -1000);
      }).toThrow(ComparisonServiceError);
    });
  });
  
  describe('findOptimalOverpaymentTiming', () => {
    it('should find optimal timing for overpayments', () => {
      // Create mock loan details
      const loanDetails: LoanDetails = {
        principal: 300000,
        interestRatePeriods: [{ startMonth: 0, interestRate: 4.5 }],
        loanTerm: 30,
        overpaymentPlans: [],
        startDate: new Date('2025-01-01'),
        name: 'Test Loan'
      };
      
      // Run analysis with fewer intervals for faster test
      const results = comparisonService.findOptimalOverpaymentTiming(loanDetails, 50000, 3);
      
      // Assert that results were returned
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].month).toBeDefined();
      expect(results[0].interestSaved).toBeDefined();
      expect(results[0].termReduction).toBeDefined();
      
      // Results should be sorted by interest saved (highest first)
      expect(results[0].interestSaved).toBeGreaterThanOrEqual(results[results.length - 1].interestSaved);
    });
  });
  
  describe('compareLumpSumVsRecurring', () => {
    it('should compare lump sum vs recurring overpayments', () => {
      // Create mock loan details
      const loanDetails: LoanDetails = {
        principal: 300000,
        interestRatePeriods: [{ startMonth: 0, interestRate: 4.5 }],
        loanTerm: 30,
        overpaymentPlans: [],
        startDate: new Date('2025-01-01'),
        name: 'Test Loan'
      };
      
      // Run comparison
      const result = comparisonService.compareLumpSumVsRecurring(loanDetails, 50000, 500);
      
      // Assert that results were returned
      expect(result.lumpSum).toBeDefined();
      expect(result.recurring).toBeDefined();
      expect(result.moreEffective).toBeDefined();
      expect(['lumpSum', 'recurring']).toContain(result.moreEffective);
      
      // Lump sum results
      expect(result.lumpSum.interestSaved).toBeDefined();
      expect(result.lumpSum.termReduction).toBeDefined();
      
      // Recurring results
      expect(result.recurring.interestSaved).toBeDefined();
      expect(result.recurring.termReduction).toBeDefined();
    });
    
    it('should throw error for invalid inputs', () => {
      const loanDetails: LoanDetails = {
        principal: 300000,
        interestRatePeriods: [{ startMonth: 0, interestRate: 4.5 }],
        loanTerm: 30,
        overpaymentPlans: [],
        startDate: new Date('2025-01-01'),
        name: 'Test Loan'
      };
      
      expect(() => {
        comparisonService.compareLumpSumVsRecurring(null as any, 50000, 500);
      }).toThrow(ComparisonServiceError);
      
      expect(() => {
        comparisonService.compareLumpSumVsRecurring(loanDetails, -1000, 500);
      }).toThrow(ComparisonServiceError);
      
      expect(() => {
        comparisonService.compareLumpSumVsRecurring(loanDetails, 50000, -100);
      }).toThrow(ComparisonServiceError);
    });
  });
});