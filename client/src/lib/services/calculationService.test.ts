import { CalculationService, calculationService } from './calculationService';
import { 
  LoanDetails, 
  OptimizationParameters, 
  OverpaymentDetails 
} from '../types';
import * as calculationEngine from '../calculationEngine';
import * as optimizationEngine from '../optimizationEngine';
import * as overpaymentCalculator from '../overpaymentCalculator';

// Mock the imported modules
jest.mock('../calculationEngine');
jest.mock('../optimizationEngine');
jest.mock('../overpaymentCalculator');

describe('CalculationService', () => {
  let service: CalculationService;
  
  // Sample loan details for testing
  const sampleLoanDetails: LoanDetails = {
    principal: 200000,
    interestRatePeriods: [{ startMonth: 1, interestRate: 4.5 }],
    loanTerm: 30,
    overpaymentPlans: [],
    startDate: new Date(2025, 0, 1),
    name: 'Test Loan',
    currency: 'USD'
  };

  // Sample optimization parameters for testing
  const sampleOptimizationParams: OptimizationParameters = {
    maxMonthlyOverpayment: 200,
    maxOneTimeOverpayment: 10000,
    optimizationStrategy: 'maximizeInterestSavings',
    feePercentage: 0
  };

  // Sample overpayment details for testing
  const sampleOverpayment: OverpaymentDetails = {
    amount: 10000,
    startMonth: 12,
    startDate: new Date(2025, 0, 1),
    isRecurring: false,
    frequency: 'one-time',
    effect: 'reduceTerm'
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a new instance of the service for each test
    service = new CalculationService();
  });

  describe('calculateLoanDetails', () => {
    it('should call calculationEngine.calculateLoanDetails with correct parameters', () => {
      // Setup mock
      const mockResult = {
        monthlyPayment: 1000,
        totalInterest: 50000,
        amortizationSchedule: [],
        yearlyData: [],
        originalTerm: 30,
        actualTerm: 30
      };
      (calculationEngine.calculateLoanDetails as jest.Mock).mockReturnValue(mockResult);
      
      // Call the service method
      const result = service.calculateLoanDetails(sampleLoanDetails);
      
      // Verify the mock was called with correct parameters
      expect(calculationEngine.calculateLoanDetails).toHaveBeenCalledWith({
        principal: sampleLoanDetails.principal,
        interestRatePeriods: sampleLoanDetails.interestRatePeriods,
        loanTerm: sampleLoanDetails.loanTerm,
        repaymentModel: sampleLoanDetails.repaymentModel,
        additionalCosts: sampleLoanDetails.additionalCosts,
        overpaymentPlans: sampleLoanDetails.overpaymentPlans,
        startDate: sampleLoanDetails.startDate,
        loanDetails: sampleLoanDetails
      });
      
      // Verify the result
      expect(result).toBe(mockResult);
    });
  });

  describe('calculateBasicLoanDetails', () => {
    it('should create a loan details object and call calculateLoanDetails', () => {
      // Setup spy on the calculateLoanDetails method
      const calculateLoanDetailsSpy = jest.spyOn(service, 'calculateLoanDetails');
      const mockResult = {
        monthlyPayment: 1000,
        totalInterest: 50000,
        amortizationSchedule: [],
        yearlyData: [],
        originalTerm: 30,
        actualTerm: 30
      };
      calculateLoanDetailsSpy.mockReturnValue(mockResult);
      
      // Call the service method
      const result = service.calculateBasicLoanDetails(200000, 4.5, 30, 'EUR');
      
      // Verify the spy was called with correct parameters
      expect(calculateLoanDetailsSpy).toHaveBeenCalledWith({
        principal: 200000,
        interestRatePeriods: [{ startMonth: 1, interestRate: 4.5 }],
        loanTerm: 30,
        overpaymentPlans: [],
        startDate: expect.any(Date),
        name: '',
        currency: 'EUR'
      });
      
      // Verify the result
      expect(result).toBe(mockResult);
    });
  });

  describe('applyOverpayment', () => {
    it('should calculate base loan and then apply overpayment', () => {
      // Setup mocks
      const mockBaseCalculation = {
        amortizationSchedule: [{
          payment: 1,
          balance: 200000,
          monthlyPayment: 1000,
          principalPayment: 300,
          interestPayment: 700,
          totalInterest: 700,
          isOverpayment: false,
          overpaymentAmount: 0,
          totalPayment: 1000
        }],
        monthlyPayment: 1000,
        totalInterest: 50000,
        yearlyData: [],
        originalTerm: 30,
        actualTerm: 30
      };
      const mockResult = {
        monthlyPayment: 1000,
        totalInterest: 40000,
        amortizationSchedule: [{ payment: 1, balance: 190000 }],
        yearlyData: [],
        originalTerm: 30,
        actualTerm: 28
      };
      
      // Mock the calculateLoanDetails method
      jest.spyOn(service, 'calculateLoanDetails').mockReturnValue(mockBaseCalculation);
      
      // Mock the overpaymentCalculator.applyOverpayment function
      (overpaymentCalculator.applyOverpayment as jest.Mock).mockReturnValue(mockResult);
      
      // Call the service method
      const result = service.applyOverpayment(sampleLoanDetails, 10000, 12, 'reduceTerm');
      
      // Verify calculateLoanDetails was called with loan details without overpayments
      expect(service.calculateLoanDetails).toHaveBeenCalledWith({
        ...sampleLoanDetails,
        overpaymentPlans: []
      });
      
      // Verify applyOverpayment was called with correct parameters
      expect(overpaymentCalculator.applyOverpayment).toHaveBeenCalledWith({
        schedule: mockBaseCalculation.amortizationSchedule,
        overpaymentAmount: 10000,
        afterPayment: 12,
        loanDetails: sampleLoanDetails,
        effect: 'reduceTerm'
      });
      
      // Verify the result
      expect(result).toBe(mockResult);
    });
  });

  describe('applyMultipleOverpayments', () => {
    it('should calculate base loan and then apply multiple overpayments', () => {
      // Setup mocks
      const mockBaseCalculation = {
        amortizationSchedule: [{
          payment: 1,
          balance: 200000,
          monthlyPayment: 1000,
          principalPayment: 300,
          interestPayment: 700,
          totalInterest: 700,
          isOverpayment: false,
          overpaymentAmount: 0,
          totalPayment: 1000
        }],
        monthlyPayment: 1000,
        totalInterest: 50000,
        yearlyData: [],
        originalTerm: 30,
        actualTerm: 30
      };
      const mockSchedule = [{
        payment: 1,
        balance: 190000,
        monthlyPayment: 1000,
        principalPayment: 300,
        interestPayment: 700,
        totalInterest: 700,
        isOverpayment: false,
        overpaymentAmount: 0,
        totalPayment: 1000
      }];
      const mockResult = {
        monthlyPayment: 1000,
        totalInterest: 40000,
        amortizationSchedule: mockSchedule,
        yearlyData: [],
        originalTerm: 30,
        actualTerm: 28
      };
      
      // Mock the calculateLoanDetails method
      jest.spyOn(service, 'calculateLoanDetails').mockReturnValue(mockBaseCalculation);
      
      // Mock the overpaymentCalculator functions
      (overpaymentCalculator.applyMultipleOverpayments as jest.Mock).mockReturnValue(mockSchedule);
      (overpaymentCalculator.finalizeResults as jest.Mock).mockReturnValue(mockResult);
      
      // Call the service method
      const overpayments = [sampleOverpayment];
      const result = service.applyMultipleOverpayments(sampleLoanDetails, overpayments);
      
      // Verify calculateLoanDetails was called with loan details without overpayments
      expect(service.calculateLoanDetails).toHaveBeenCalledWith({
        ...sampleLoanDetails,
        overpaymentPlans: []
      });
      
      // Verify applyMultipleOverpayments was called with correct parameters
      expect(overpaymentCalculator.applyMultipleOverpayments).toHaveBeenCalledWith({
        schedule: mockBaseCalculation.amortizationSchedule,
        overpayments: overpayments,
        loanStartDate: sampleLoanDetails.startDate,
        loanDetails: sampleLoanDetails
      });
      
      // Verify finalizeResults was called with correct parameters
      expect(overpaymentCalculator.finalizeResults).toHaveBeenCalledWith(
        mockSchedule,
        sampleLoanDetails.loanTerm
      );
      
      // Verify the result
      expect(result).toBe(mockResult);
    });
  });

  describe('optimizeOverpayments', () => {
    it('should call optimizationEngine.optimizeOverpayments with correct parameters', () => {
      // Setup mock
      const mockResult = {
        optimizedOverpayments: [sampleOverpayment],
        interestSaved: 20000,
        timeOrPaymentSaved: 5,
        optimizationValue: 20000,
        optimizationFee: 0
      };
      (optimizationEngine.optimizeOverpayments as jest.Mock).mockReturnValue(mockResult);
      
      // Call the service method
      const result = service.optimizeOverpayments(sampleLoanDetails, sampleOptimizationParams);
      
      // Verify the mock was called with correct parameters
      expect(optimizationEngine.optimizeOverpayments).toHaveBeenCalledWith(
        sampleLoanDetails,
        sampleOptimizationParams
      );
      
      // Verify the result
      expect(result).toBe(mockResult);
    });
  });

  describe('analyzeOverpaymentImpact', () => {
    it('should call optimizationEngine.analyzeOverpaymentImpact with correct parameters', () => {
      // Setup mock
      const mockResult = [
        { amount: 100, interestSaved: 5000, termReduction: 1 },
        { amount: 200, interestSaved: 10000, termReduction: 2 }
      ];
      (optimizationEngine.analyzeOverpaymentImpact as jest.Mock).mockReturnValue(mockResult);
      
      // Call the service method
      const result = service.analyzeOverpaymentImpact(sampleLoanDetails, 200, 2);
      
      // Verify the mock was called with correct parameters
      expect(optimizationEngine.analyzeOverpaymentImpact).toHaveBeenCalledWith(
        sampleLoanDetails,
        200,
        2
      );
      
      // Verify the result
      expect(result).toBe(mockResult);
    });
  });

  describe('compareLumpSumVsRegular', () => {
    it('should call optimizationEngine.compareLumpSumVsRegular with correct parameters', () => {
      // Setup mock
      const mockResult = {
        lumpSum: { interestSaved: 15000, termReduction: 3 },
        monthly: { interestSaved: 20000, termReduction: 4 },
        breakEvenMonth: 36
      };
      (optimizationEngine.compareLumpSumVsRegular as jest.Mock).mockReturnValue(mockResult);
      
      // Call the service method
      const result = service.compareLumpSumVsRegular(sampleLoanDetails, 10000, 200);
      
      // Verify the mock was called with correct parameters
      expect(optimizationEngine.compareLumpSumVsRegular).toHaveBeenCalledWith(
        sampleLoanDetails,
        10000,
        200
      );
      
      // Verify the result
      expect(result).toBe(mockResult);
    });
  });

  describe('formatting methods', () => {
    it('should format currency values correctly', () => {
      const result = service.formatCurrency(1234.56, 'en-US', 'USD');
      expect(result).toContain('1,234.56');
    });
    
    it('should format time periods correctly', () => {
      const result = service.formatTimePeriod(18);
      expect(result).toBe('1 year 6 months');
    });
    
    it('should format amortization schedule correctly', () => {
      const schedule = [
        {
          payment: 1,
          monthlyPayment: 1000,
          principalPayment: 300,
          interestPayment: 700,
          balance: 199700,
          isOverpayment: false,
          overpaymentAmount: 0,
          totalInterest: 700,
          totalPayment: 1000
        }
      ];
      
      const result = service.formatAmortizationSchedule(schedule, 'USD');
      
      expect(result[0].formattedValues).toBeDefined();
      expect(result[0].formattedValues?.monthlyPayment).toContain('1,000');
      expect(result[0].formattedValues?.principalPayment).toContain('300');
      expect(result[0].formattedValues?.interestPayment).toContain('700');
      expect(result[0].formattedValues?.balance).toContain('199,700');
    });
    
    it('should format calculation results correctly', () => {
      const results = {
        monthlyPayment: 1000,
        totalInterest: 50000,
        amortizationSchedule: [],
        yearlyData: [],
        originalTerm: 30,
        actualTerm: 25.5,
        oneTimeFees: 2000,
        recurringFees: 1200,
        totalCost: 253200,
        apr: 4.75
      };
      
      const result = service.formatCalculationResults(results, 'USD');
      
      expect(result.formattedValues).toBeDefined();
      expect(result.formattedValues.monthlyPayment).toContain('1,000');
      expect(result.formattedValues.totalInterest).toContain('50,000');
      expect(result.formattedValues.originalTerm).toBe('30 years');
      expect(result.formattedValues.actualTerm).toBe('25.50 years');
      expect(result.formattedValues.oneTimeFees).toContain('2,000');
      expect(result.formattedValues.apr).toBe('4.75%');
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance of the service', () => {
      expect(calculationService).toBeInstanceOf(CalculationService);
    });
  });
});