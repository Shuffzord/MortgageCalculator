// Core Types

export type RepaymentModel = 'equalInstallments' | 'decreasingInstallments' | 'custom';

export type FeeType = 'fixed' | 'percentage';

export interface AdditionalCosts {
  originationFee: number;           // One-time fee at loan start
  originationFeeType: FeeType;
  loanInsurance: number;            // Recurring fee
  loanInsuranceType: FeeType;
  administrativeFees: number;       // Other recurring fees
  administrativeFeesType: FeeType;
}

export interface LoanDetails {
  principal: number;
  interestRatePeriods: InterestRatePeriod[];
  loanTerm: number;
  overpaymentPlans: OverpaymentDetails[];
  startDate: Date;
  name: string;
  currency?: string;
  dateCreated?: string;
  repaymentModel?: RepaymentModel;
  additionalCosts?: AdditionalCosts;
}

export interface InterestRatePeriod {
  startMonth: number;
  interestRate: number;
}

export interface OverpaymentDetails {
  amount: number;
  startDate: Date;
  endDate?: Date;
  isRecurring: boolean;
  frequency: 'monthly' | 'quarterly' | 'annual' | 'one-time';
  startMonth?: number; // For backwards compatibility
  endMonth?: number; // For backwards compatibility
  afterPayment?: number; // For backwards compatibility
  effect?: 'reduceTerm' | 'reducePayment';
}

// Data Structure Types

/**
 * Unified payment data structure for amortization schedule and calculations
 * Provides a consistent interface for all payment-related operations
 */
export interface PaymentData {
  // Payment identifier
  payment: number;             // Payment number (1-based index)
  
  // Payment amounts
  monthlyPayment: number;      // Total monthly payment amount
  principalPayment: number;    // Portion of payment going to principal
  interestPayment: number;     // Portion of payment going to interest
  
  // Balances and totals
  balance: number;             // Remaining loan balance after payment
  totalInterest: number;       // Cumulative interest paid up to this payment
  totalPayment: number;        // Total amount paid up to this payment
  
  // Overpayment related
  isOverpayment: boolean;      // Whether this payment includes an overpayment
  overpaymentAmount: number;   // Extra amount paid toward principal
  
  // Additional costs related
  fees?: number;               // Additional fees for this payment period
  
  // Additional data
  paymentDate?: Date;          // Date when payment is made
  currency?: string;           // Currency symbol for display purposes
  
  // Formatted values for export/display
  formattedValues?: Record<string, string>; // Formatted values for display
}



export interface YearlyData {
  year: number;
  principal: number;
  interest: number;
  payment: number;
  balance: number;
  totalInterest: number;
}

export interface CalculationResults {
  monthlyPayment: number;
  totalInterest: number;
  amortizationSchedule: PaymentData[];
  yearlyData: YearlyData[];
  originalTerm: number;
  actualTerm: number;
  timeOrPaymentSaved?: number;
  oneTimeFees?: number;
  recurringFees?: number;
  totalCost?: number;
  apr?: number;
}

// Storage Related Types

export interface SavedCalculation {
  id: number;
  name: string;
  date: string;
  loanDetails: LoanDetails;
}


export interface CalculationPeriod {
  startMonth: number;
  endMonth: number;
  basePayment: number;
  overpaymentAmount: number;
}

export interface OverpaymentResult {
  originalCalculation: CalculationResults;
  newCalculation: CalculationResults;
  interestSaved: number;
}

/**
 * Types for Comparative Analysis feature
 */
export interface ScenarioComparison {
  scenarios: {
    id: string;
    name: string;
    loanDetails: LoanDetails;
    results: CalculationResults;
  }[];
  differences: {
    totalInterestDiff: number;
    monthlyPaymentDiff: number;
    termDiff: number;
    totalCostDiff: number;
  }[];
  breakEvenPoint?: number; // Month number where scenarios break even
}

export interface ScenarioComparisonOptions {
  includeBreakEvenAnalysis: boolean;
  includeAmortizationComparison: boolean;
  includeMonthlyPaymentComparison: boolean;
  includeTotalCostComparison: boolean;
}

/**
 * Types for Overpayment Optimization feature
 */
export interface StrategyResult {
  name: string;
  interestSaved: number;
  termReduction: number;
  effectivenessRatio: number;
  isBest: boolean;
}

export interface OptimizationResult {
  optimizedOverpayments: OverpaymentDetails[];
  interestSaved: number;
  timeOrPaymentSaved: number;
  optimizationValue: number;
  optimizationFee: number;
  comparisonChart?: {
    labels: string[];
    originalData: number[];
    optimizedData: number[];
  };
  allStrategies?: StrategyResult[];
}

export interface OptimizationParameters {
  maxMonthlyOverpayment: number;
  maxOneTimeOverpayment: number;
  optimizationStrategy: 'maximizeInterestSavings' | 'minimizeTime' | 'balanced';
  feePercentage: number;
}

export interface OverpaymentStrategy {
  name: string;
  description: string;
  overpayments: OverpaymentDetails[];
  results: {
    interestSaved: number;
    termReduction: number;
    effectivenessRatio: number;
  };
}

/**
 * Types for Data Export feature
 */
export type ExportFormat = 'csv' | 'json' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  includeAmortizationSchedule: boolean;
  includeCharts: boolean;
  includeSummary: boolean;
  includeComparisonData?: boolean;
  dateRange?: {
    startMonth: number;
    endMonth: number;
  };
  selectedColumns?: string[];
}

export interface ExportData {
  loanDetails: LoanDetails;
  results: CalculationResults;
  comparisonData?: ScenarioComparison;
}

/**
 * Parameter Objects for Function Signatures
 * These objects help improve code readability and maintainability
 * by grouping related parameters together
 */

/**
 * Parameters for loan calculation functions
 */
export interface LoanCalculationParams {
  principal: number;
  interestRatePeriods: InterestRatePeriod[];
  loanTerm: number;
  repaymentModel?: RepaymentModel;
  additionalCosts?: AdditionalCosts;
  overpaymentPlans?: OverpaymentDetails[];
  startDate?: Date;
  loanDetails?: LoanDetails;
}

/**
 * Parameters for overpayment-related functions
 */
export interface OverpaymentParams {
  schedule: PaymentData[];
  overpaymentAmount: number;
  afterPayment: number;
  loanDetails: LoanDetails;
  effect: 'reduceTerm' | 'reducePayment';
}

/**
 * Parameters for multiple overpayments
 */
export interface MultipleOverpaymentParams {
  schedule: PaymentData[];
  overpayments: OverpaymentDetails[];
  loanStartDate?: Date;
  loanDetails: LoanDetails;
}

/**
 * Parameters for reduced term schedule calculation
 */
export interface ReducedTermParams {
  balance: number;
  interestRatePeriods: InterestRatePeriod[];
  monthlyPayment: number;
  startPaymentNumber: number;
}

/**
 * Parameters for reduced payment schedule calculation
 */
export interface ReducedPaymentParams {
  balance: number;
  interestRatePeriods: InterestRatePeriod[];
  remainingMonths: number;
  originalPayment: number;
  startPaymentNumber: number;
}

/**
 * Optional parameters for calculations
 */
export interface CalculationOptions {
  includeAdditionalCosts?: boolean;
  formatResults?: boolean;
  currency?: string;
  locale?: string;
}

/**
 * Parameters for APR calculation
 */
export interface APRCalculationParams {
  principal: number;
  monthlyPayment: number;
  loanTermMonths: number;
  oneTimeFees: number;
  recurringFees: number;
}