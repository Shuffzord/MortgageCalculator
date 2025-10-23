// Core Types

export type RepaymentModel = 'equalInstallments' | 'decreasingInstallments' | 'custom';

export type FeeType = 'fixed' | 'percentage';

export interface AdditionalCosts {
  originationFee: number; // One-time fee at loan start
  originationFeeType: FeeType;
  loanInsurance: number; // Recurring fee
  loanInsuranceType: FeeType;
  administrativeFees: number; // Other recurring fees
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
  payment: number; // Payment number (1-based index)

  // Payment amounts
  monthlyPayment: number; // Total monthly payment amount
  principalPayment: number; // Portion of payment going to principal
  interestPayment: number; // Portion of payment going to interest

  // Balances and totals
  balance: number; // Remaining loan balance after payment
  totalInterest: number; // Cumulative interest paid up to this payment
  totalPayment: number; // Total amount paid up to this payment

  // Overpayment related
  isOverpayment: boolean; // Whether this payment includes an overpayment
  overpaymentAmount: number; // Extra amount paid toward principal

  // Additional costs related
  fees?: number; // Additional fees for this payment period

  // Additional data
  paymentDate?: Date; // Date when payment is made
  currency?: string; // Currency symbol for display purposes

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

/**
 * Extended calculation results that include formatted values for display
 */
export interface FormattedCalculationResults extends CalculationResults {
  formatted: {
    monthlyPayment: string;
    totalInterest: string;
    totalPayment: string;
    actualTerm: string;
    originalTerm: string;
    oneTimeFees?: string;
    recurringFees?: string;
    totalCost?: string;
    apr?: string;
    interestSaved?: string;
    timeSaved?: string;
  };
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
 * Results of comparing two loan calculations
 */
export interface ComparisonResults {
  interestSaved: number;
  timeSaved: number;
  percentageSaved: number;
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
 * Types for Overpayment Strategy Analysis
 */
export interface OverpaymentStrategyAnalysis {
  strategies: OverpaymentStrategy[];
  bestStrategy: string;
  totalInterestSaved: number;
  maxTermReduction: number;
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
 * Parameters for applying rate changes to a payment schedule
 */
export interface RateChangeParams {
  schedule: PaymentData[];
  changeAtMonth: number;
  newRate: number;
  remainingTerm?: number;
}

/**
 * Parameters for performing multiple rate changes
 */
export interface MultipleRateChangeParams {
  schedule: PaymentData[];
  rateChanges: Array<{ month: number; newRate: number }>;
}

/**
 * Parameters for calculating complex scenarios with rate changes and overpayments
 */
export interface ComplexScenarioParams {
  loanDetails: LoanDetails;
  rateChanges: Array<{ month: number; newRate: number }>;
  overpayments: OverpaymentDetails[];
}

/**
 * Optional parameters for calculations
 */
export interface CalculationOptions {
  includeAdditionalCosts?: boolean;
  formatResults?: boolean;
  currency?: string;
  locale?: string;
  roundToNearestCent?: boolean;
  includeFormattedValues?: boolean;
}

/**
 * Parameters for affordability calculation
 */
export interface AffordabilityParams {
  monthlyIncome: number;
  monthlyExpenses: number;
  interestRate: number;
  loanTerm: number;
  debtToIncomeRatio?: number;
  additionalCosts?: AdditionalCosts;
}

/**
 * Result of affordability calculation
 */
export interface AffordabilityResult {
  maxLoanAmount: number;
  monthlyPayment: number;
  debtToIncomeRatio: number;
  formatted?: {
    maxLoanAmount: string;
    monthlyPayment: string;
    debtToIncomeRatio: string;
  };
}

/**
 * Parameters for break-even calculation
 */
export interface BreakEvenParams {
  currentLoan: LoanDetails;
  newLoan: LoanDetails;
  refinancingCosts: number;
}

/**
 * Result of break-even calculation
 */
export interface BreakEvenResult {
  breakEvenMonths: number;
  lifetimeSavings: number;
  monthlySavings: number;
  formatted?: {
    breakEvenMonths: string;
    lifetimeSavings: string;
    monthlySavings: string;
  };
}

/**
 * Result of amortization milestones calculation
 */
export interface AmortizationMilestones {
  halfwayPoint: { month: number; date: Date; balance: number };
  principalCrossover: { month: number; date: Date; balance: number };
  quarterPoints: { month: number; date: Date; balance: number }[];
  formatted?: {
    halfwayPoint: string;
    principalCrossover: string;
    quarterPoints: string[];
  };
}

/**
 * Parameters for validation
 */
export interface ValidationOptions {
  allowNegativePrincipal?: boolean;
  maxInterestRate?: number;
  minInterestRate?: number;
  maxLoanTerm?: number;
  minLoanTerm?: number;
  validateDates?: boolean;
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

/**
 * Parameters for decreasing installment calculation
 */
export interface DecreasingInstallmentParams {
  principal: number;
  monthlyRate: number;
  totalMonths: number;
  currentMonth: number;
}

/**
 * Parameters for one-time fees calculation
 */
export interface OneTimeFeesParams {
  principal: number;
  additionalCosts?: AdditionalCosts;
}

/**
 * Parameters for recurring fees calculation
 */
export interface RecurringFeesParams {
  remainingBalance: number;
  additionalCosts?: AdditionalCosts;
}

/**
 * Parameters for monthly payment calculation
 */
export interface MonthlyPaymentParams {
  principal: number;
  monthlyRate: number;
  totalMonths: number;
}

/**
 * Parameters for converting and processing schedule
 */
export interface ConvertScheduleParams {
  rawSchedule: any[];
}

/**
 * Parameters for converting and processing schedule with fees
 */
export interface ConvertScheduleWithFeesParams {
  rawSchedule: any[];
  additionalCosts?: AdditionalCosts;
}

/**
 * Parameters for creating final overpayment result
 */
export interface FinalOverpaymentResultParams {
  schedule: PaymentData[];
  monthlyPayment: number;
  originalLength: number;
  savingsAmount: number;
}

/**
 * Parameters for checking if overpayment is applicable
 */
export interface OverpaymentApplicableParams {
  overpayment: OverpaymentDetails;
  month: number;
  loanStartDate?: Date;
}

/**
 * Parameters for recalculating schedule with new rate
 */
export interface RecalculateWithNewRateParams {
  startingBalance: number;
  annualInterestRate: number;
  remainingTermInYears: number;
}

/**
 * Parameters for finalizing results
 */
export interface FinalizeResultsParams {
  schedule: PaymentData[];
  originalTerm: number;
}

/**
 * Interface for calculation service operations
 */
export interface ICalculationService {
  // Core calculation methods
  calculateLoanDetails(
    loanDetails: LoanDetails,
    options?: CalculationOptions
  ): CalculationResults | FormattedCalculationResults;
  calculateBasicLoanDetails(
    principal: number,
    interestRate: number,
    loanTerm: number,
    currency?: string,
    options?: CalculationOptions
  ): CalculationResults | FormattedCalculationResults;

  // Overpayment methods
  applyOverpayment(
    loanDetails: LoanDetails,
    overpaymentAmount: number,
    afterPayment: number,
    effect?: 'reduceTerm' | 'reducePayment'
  ): CalculationResults;
  applyMultipleOverpayments(
    loanDetails: LoanDetails,
    overpayments: OverpaymentDetails[]
  ): CalculationResults;

  // Optimization methods
  optimizeOverpayments(
    loanDetails: LoanDetails,
    optimizationParams: OptimizationParameters
  ): OptimizationResult;
  analyzeOverpaymentImpact(
    loanDetails: LoanDetails,
    maxMonthlyAmount: number,
    steps?: number
  ): { amount: number; interestSaved: number; termReduction: number }[];
  compareLumpSumVsRegular(
    loanDetails: LoanDetails,
    lumpSumAmount: number,
    monthlyAmount: number
  ): {
    lumpSum: { interestSaved: number; termReduction: number };
    monthly: { interestSaved: number; termReduction: number };
    breakEvenMonth: number;
  };

  // Formatting methods
  formatCurrency(value: number, locale?: string, currency?: string): string;
  formatTimePeriod(months: number): string;
  formatAmortizationSchedule(
    schedule: PaymentData[],
    currency?: string,
    locale?: string
  ): PaymentData[];
  formatCalculationResults(
    results: CalculationResults,
    currency?: string,
    locale?: string
  ): FormattedCalculationResults;

  // Helper methods
  roundToCents(amount: number): number;
  calculateAffordability(params: AffordabilityParams): AffordabilityResult;
  calculateBreakEvenPoint(params: BreakEvenParams): BreakEvenResult;
  calculateAmortizationMilestones(loanDetails: LoanDetails): AmortizationMilestones;
  aggregateYearlyData(schedule: PaymentData[]): any;

  // Validation methods
  validateLoanDetails(
    loanDetails: LoanDetails,
    options?: ValidationOptions
  ): { isValid: boolean; errors: string[] };
}

/**
 * Interface for comparison service operations
 */
export interface IComparisonService {
  // Basic comparison methods
  compareLoanResults(
    baseCalculation: CalculationResults,
    comparisonCalculation: CalculationResults
  ): ComparisonResults;
  compareWithOverpayments(
    baseCalculation: CalculationResults,
    loanWithOverpayments: CalculationResults
  ): ComparisonResults;
  compareMultipleScenarios(
    scenarios: Array<{ id: string; name: string; loanDetails: LoanDetails }>,
    options?: ScenarioComparisonOptions
  ): ScenarioComparison;

  // Enhanced comparison methods for different loan parameters
  compareDifferentTerms(
    baseLoanDetails: LoanDetails,
    comparisonTerms: number[]
  ): ScenarioComparison;
  compareDifferentRates(
    baseLoanDetails: LoanDetails,
    comparisonRates: number[]
  ): ScenarioComparison;
  compareRepaymentModels(
    baseLoanDetails: LoanDetails,
    repaymentModels?: RepaymentModel[]
  ): ScenarioComparison;

  // Overpayment analysis methods
  analyzeOverpaymentStrategies(
    loanDetails: LoanDetails,
    overpaymentAmount: number
  ): OverpaymentStrategy[];
  findOptimalOverpaymentTiming(
    loanDetails: LoanDetails,
    overpaymentAmount: number,
    intervals?: number
  ): { month: number; interestSaved: number; termReduction: number }[];
  compareLumpSumVsRecurring(
    loanDetails: LoanDetails,
    lumpSumAmount: number,
    recurringAmount: number
  ): {
    lumpSum: { interestSaved: number; termReduction: number };
    recurring: { interestSaved: number; termReduction: number };
    breakEvenMonth: number | undefined;
    moreEffective: 'lumpSum' | 'recurring';
  };
}
