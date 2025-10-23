/**
 * @fileoverview Service layer for mortgage calculation operations
 *
 * This file contains the CalculationService class which serves as a mediator between
 * UI components and the underlying calculation logic. It provides a clean, consistent
 * interface for performing mortgage calculations, applying overpayments, optimizing
 * payment strategies, and formatting results for display.
 */
import {
  LoanDetails,
  OverpaymentDetails,
  OptimizationParameters,
  OptimizationResult,
  CalculationResults,
  PaymentData,
  FormattedCalculationResults,
  CalculationOptions,
  AffordabilityParams,
  AffordabilityResult,
  BreakEvenParams,
  BreakEvenResult,
  AmortizationMilestones,
  ValidationOptions,
  ICalculationService,
} from '../types';
import { calculateLoanDetails } from '../calculationEngine';
import { aggregateYearlyData } from '../overpaymentCalculator';
import {
  validateLoanDetails,
  validateAffordabilityParams,
  validateBreakEvenParams,
  normalizeLoanDetails,
} from '../validation';
import {
  optimizeOverpayments,
  analyzeOverpaymentImpact,
  compareLumpSumVsRegular,
} from '../optimizationEngine';
import {
  formatCurrency,
  formatTimePeriod,
  formatPaymentEntry,
  formatYearlySummary,
  formatInterestRate,
} from '../formatters';
import {
  applyOverpayment,
  applyMultipleOverpayments,
  performOverpayments,
  finalizeResults,
} from '../overpaymentCalculator';
import { roundToCents } from '../calculationCore';

/**
 * Service layer for mortgage calculation operations.
 *
 * The CalculationService class acts as a mediator between UI components and the underlying
 * calculation logic. It provides a clean, consistent interface for performing mortgage
 * calculations, applying overpayments, optimizing payment strategies, and formatting results
 * for display.
 *
 * This service centralizes all calculation-related operations, making it easier to:
 * - Maintain consistent calculation behavior across the application
 * - Isolate UI components from calculation implementation details
 * - Test calculation logic independently from UI components
 * - Apply application-wide changes to calculation behavior in a single place
 *
 * @example
 * // Basic usage with singleton instance
 * import { calculationService } from './calculationService';
 *
 * const results = calculationService.calculateBasicLoanDetails(
 *   300000,    // principal
 *   3.5,       // interest rate
 *   30,        // loan term in years
 *   'USD'      // currency
 * );
 */
export class CalculationService implements ICalculationService {
  /**
   * Calculates complete loan details using all available parameters.
   *
   * This method serves as the primary entry point for comprehensive loan calculations.
   * It delegates to the calculationEngine's calculateLoanDetails function, passing all
   * parameters from the provided LoanDetails object.
   *
   * @param {LoanDetails} loanDetails - Complete loan information including principal,
   *                                    interest rates, term, overpayment plans, etc.
   * @param {CalculationOptions} [options] - Optional calculation options
   * @returns {CalculationResults | FormattedCalculationResults} Comprehensive calculation results
   *
   * @example
   * const loanDetails = {
   *   principal: 300000,
   *   interestRatePeriods: [{ startMonth: 1, interestRate: 3.5 }],
   *   loanTerm: 30,
   *   overpaymentPlans: [],
   *   startDate: new Date(),
   *   name: 'My Mortgage',
   *   currency: 'USD'
   * };
   * const results = calculationService.calculateLoanDetails(loanDetails);
   */
  calculateLoanDetails(
    loanDetails: LoanDetails,
    options?: CalculationOptions
  ): CalculationResults | FormattedCalculationResults {
    // Validate loan details
    const validation = validateLoanDetails(loanDetails);
    if (!validation.isValid) {
      throw new Error(`Invalid loan details: ${validation.errors.join(', ')}`);
    }

    // Normalize loan details
    const normalizedLoanDetails = normalizeLoanDetails(loanDetails);

    // Use the parameter object version
    const results = calculateLoanDetails({
      principal: normalizedLoanDetails.principal,
      interestRatePeriods: normalizedLoanDetails.interestRatePeriods,
      loanTerm: normalizedLoanDetails.loanTerm,
      repaymentModel: normalizedLoanDetails.repaymentModel,
      additionalCosts: normalizedLoanDetails.additionalCosts,
      overpaymentPlans: normalizedLoanDetails.overpaymentPlans,
      startDate: normalizedLoanDetails.startDate,
      loanDetails: normalizedLoanDetails,
    });

    // Return formatted results if requested
    if (options?.includeFormattedValues) {
      return this.formatCalculationResults(
        results,
        options.currency || normalizedLoanDetails.currency || 'USD',
        options.locale
      );
    }

    return results;
  }

  /**
   * Calculates loan details using simplified basic parameters.
   *
   * This convenience method creates a LoanDetails object from basic parameters
   * and then calls the comprehensive calculateLoanDetails method. It's useful
   * for quick calculations without needing to create a full LoanDetails object.
   *
   * @param {number} principal - The loan principal amount
   * @param {number} interestRate - The annual interest rate (as a percentage, e.g., 4.5 for 4.5%)
   * @param {number} loanTerm - The loan term in years
   * @param {string} [currency='USD'] - The currency to use for calculations and formatting
   * @param {CalculationOptions} [options] - Optional calculation options
   * @returns {CalculationResults | FormattedCalculationResults} Comprehensive calculation results
   *
   * @example
   * // Calculate a basic 30-year mortgage at 3.5% interest
   * const results = calculationService.calculateBasicLoanDetails(
   *   300000,  // $300,000 principal
   *   3.5,     // 3.5% interest rate
   *   30,      // 30-year term
   *   'EUR'    // Euro currency
   * );
   */
  calculateBasicLoanDetails(
    principal: number,
    interestRate: number,
    loanTerm: number,
    currency: string = 'USD',
    options?: CalculationOptions
  ): CalculationResults | FormattedCalculationResults {
    // Validate inputs
    if (principal <= 0) {
      throw new Error('Principal amount must be greater than zero');
    }

    if (interestRate <= 0) {
      throw new Error('Interest rate must be greater than zero');
    }

    if (loanTerm <= 0) {
      throw new Error('Loan term must be greater than zero');
    }

    const loanDetails: LoanDetails = {
      principal,
      interestRatePeriods: [{ startMonth: 1, interestRate }],
      loanTerm,
      overpaymentPlans: [],
      startDate: new Date(),
      name: '',
      currency,
    };

    return this.calculateLoanDetails(loanDetails, options);
  }

  /**
   * Applies a single overpayment to a loan and calculates the resulting impact.
   *
   * This method first calculates the base loan without any overpayments, then
   * applies a single overpayment at the specified payment number. The effect
   * parameter determines whether the overpayment reduces the loan term or
   * reduces the monthly payment amount.
   *
   * @param {LoanDetails} loanDetails - Complete loan information
   * @param {number} overpaymentAmount - The amount of the overpayment
   * @param {number} afterPayment - The payment number after which to apply the overpayment
   * @param {'reduceTerm' | 'reducePayment'} [effect='reduceTerm'] - How the overpayment affects the loan
   * @returns {CalculationResults} Updated calculation results after applying the overpayment
   *
   * @example
   * // Apply a $10,000 overpayment after the 12th payment (1 year)
   * // that will reduce the loan term
   * const results = calculationService.applyOverpayment(
   *   loanDetails,
   *   10000,       // $10,000 overpayment
   *   12,          // After 12th payment
   *   'reduceTerm' // Reduce the loan term
   * );
   */
  applyOverpayment(
    loanDetails: LoanDetails,
    overpaymentAmount: number,
    afterPayment: number,
    effect: 'reduceTerm' | 'reducePayment' = 'reduceTerm'
  ): CalculationResults {
    // First calculate the loan without overpayments
    const baseCalculation = this.calculateLoanDetails({
      ...loanDetails,
      overpaymentPlans: [],
    });

    // Then apply the overpayment using parameter object
    return applyOverpayment({
      schedule: baseCalculation.amortizationSchedule,
      overpaymentAmount: overpaymentAmount,
      afterPayment: afterPayment,
      loanDetails: loanDetails,
      effect: effect,
    });
  }

  /**
   * Applies multiple overpayments to a loan and calculates the resulting impact.
   *
   * This method first calculates the base loan without any overpayments, then
   * applies all the specified overpayments according to their timing and amounts.
   * It's useful for modeling complex overpayment strategies with different
   * amounts and frequencies.
   *
   * @param {LoanDetails} loanDetails - Complete loan information
   * @param {OverpaymentDetails[]} overpayments - Array of overpayment details
   * @returns {CalculationResults} Updated calculation results after applying all overpayments
   *
   * @example
   * // Apply a one-time overpayment and a recurring monthly overpayment
   * const overpayments = [
   *   {
   *     amount: 10000,
   *     startDate: new Date(2025, 0, 1),
   *     isRecurring: false,
   *     frequency: 'one-time',
   *     effect: 'reduceTerm'
   *   },
   *   {
   *     amount: 200,
   *     startDate: new Date(2025, 6, 1),
   *     isRecurring: true,
   *     frequency: 'monthly',
   *     effect: 'reduceTerm'
   *   }
   * ];
   * const results = calculationService.applyMultipleOverpayments(loanDetails, overpayments);
   */
  applyMultipleOverpayments(
    loanDetails: LoanDetails,
    overpayments: OverpaymentDetails[]
  ): CalculationResults {
    // First calculate the loan without overpayments
    const baseCalculation = this.calculateLoanDetails({
      ...loanDetails,
      overpaymentPlans: [],
    });

    // Then apply all overpayments using parameter object
    const schedule = applyMultipleOverpayments({
      schedule: baseCalculation.amortizationSchedule,
      overpayments: overpayments,
      loanStartDate: loanDetails.startDate,
      loanDetails: loanDetails,
    });

    // Return the final results
    return finalizeResults(schedule, loanDetails.loanTerm);
  }

  /**
   * Optimizes overpayment strategy based on specified parameters.
   *
   * This method analyzes different overpayment strategies and recommends
   * the optimal approach based on the optimization parameters provided.
   * It can optimize for maximum interest savings, minimum loan term,
   * or a balanced approach.
   *
   * @param {LoanDetails} loanDetails - Complete loan information
   * @param {OptimizationParameters} optimizationParams - Parameters for the optimization
   * @returns {OptimizationResult} Optimized overpayment strategy and its impact
   *
   * @example
   * const optimizationParams = {
   *   maxMonthlyOverpayment: 500,
   *   maxOneTimeOverpayment: 20000,
   *   optimizationStrategy: 'maximizeInterestSavings',
   *   feePercentage: 0
   * };
   * const result = calculationService.optimizeOverpayments(loanDetails, optimizationParams);
   */
  optimizeOverpayments(
    loanDetails: LoanDetails,
    optimizationParams: OptimizationParameters
  ): OptimizationResult {
    return optimizeOverpayments(loanDetails, optimizationParams);
  }

  /**
   * Analyzes the impact of different overpayment amounts on a loan.
   *
   * This method calculates how different monthly overpayment amounts
   * affect interest savings and term reduction. It generates a series
   * of data points that can be used to visualize the relationship between
   * overpayment amount and financial benefits.
   *
   * @param {LoanDetails} loanDetails - Complete loan information
   * @param {number} maxMonthlyAmount - Maximum monthly overpayment amount to analyze
   * @param {number} [steps=5] - Number of data points to generate between 0 and maxMonthlyAmount
   * @returns {Array<{amount: number, interestSaved: number, termReduction: number}>}
   *          Array of analysis results for different overpayment amounts
   *
   * @example
   * // Analyze impact of monthly overpayments from $0 to $500 in 5 steps
   * const analysis = calculationService.analyzeOverpaymentImpact(
   *   loanDetails,
   *   500,  // Max $500/month
   *   5     // 5 steps ($0, $100, $200, $300, $400, $500)
   * );
   * // Result can be used to create a chart showing the relationship
   * // between overpayment amount and interest savings
   */
  analyzeOverpaymentImpact(
    loanDetails: LoanDetails,
    maxMonthlyAmount: number,
    steps: number = 5
  ): { amount: number; interestSaved: number; termReduction: number }[] {
    return analyzeOverpaymentImpact(loanDetails, maxMonthlyAmount, steps);
  }

  /**
   * Compares the impact of a lump sum overpayment versus regular monthly overpayments.
   *
   * This method analyzes and compares two overpayment strategies:
   * 1. A one-time lump sum payment
   * 2. Regular monthly overpayments of a smaller amount
   *
   * It calculates the interest savings and term reduction for each strategy,
   * and determines the break-even point (in months) where the regular payments
   * strategy begins to outperform the lump sum strategy.
   *
   * @param {LoanDetails} loanDetails - Complete loan information
   * @param {number} lumpSumAmount - Amount of the one-time lump sum payment
   * @param {number} monthlyAmount - Amount of the recurring monthly payment
   * @returns {{
   *   lumpSum: { interestSaved: number, termReduction: number },
   *   monthly: { interestSaved: number, termReduction: number },
   *   breakEvenMonth: number
   * }} Comparison results and break-even analysis
   *
   * @example
   * // Compare $10,000 lump sum vs $200/month regular overpayments
   * const comparison = calculationService.compareLumpSumVsRegular(
   *   loanDetails,
   *   10000,  // $10,000 lump sum
   *   200     // $200/month
   * );
   * // Results show which strategy saves more interest, reduces term more,
   * // and at what point the monthly strategy overtakes the lump sum
   */
  compareLumpSumVsRegular(
    loanDetails: LoanDetails,
    lumpSumAmount: number,
    monthlyAmount: number
  ): {
    lumpSum: { interestSaved: number; termReduction: number };
    monthly: { interestSaved: number; termReduction: number };
    breakEvenMonth: number;
  } {
    return compareLumpSumVsRegular(loanDetails, lumpSumAmount, monthlyAmount);
  }

  /**
   * Formats a numeric value as a currency string.
   *
   * This method provides a consistent way to format currency values
   * throughout the application. It uses the browser's Intl.NumberFormat
   * for locale-aware formatting.
   *
   * @param {number} value - The numeric value to format
   * @param {string} [locale] - The locale to use for formatting (e.g., 'en-US', 'de-DE')
   * @param {string} [currency='USD'] - The currency code to use (e.g., 'USD', 'EUR')
   * @returns {string} Formatted currency string
   *
   * @example
   * // Format as US dollars
   * calculationService.formatCurrency(1234.56, 'en-US', 'USD');
   * // Returns: "$1,234.56"
   *
   * // Format as Euros with German formatting
   * calculationService.formatCurrency(1234.56, 'de-DE', 'EUR');
   * // Returns: "1.234,56 €"
   */
  formatCurrency(value: number, locale?: string, currency: string = 'USD'): string {
    // Ensure value is treated as a number to prevent string concatenation issues
    return formatCurrency(Number(value), locale, currency);
  }

  /**
   * Formats a time period in months as a human-readable string.
   *
   * This method converts a number of months into a string representation
   * showing years and months, making it easier for users to understand
   * time periods.
   *
   * @param {number} months - Number of months to format
   * @returns {string} Formatted time period string (e.g., "2 years 6 months")
   *
   * @example
   * calculationService.formatTimePeriod(30);
   * // Returns: "2 years 6 months"
   *
   * calculationService.formatTimePeriod(12);
   * // Returns: "1 year"
   *
   * calculationService.formatTimePeriod(5);
   * // Returns: "5 months"
   */
  formatTimePeriod(months: number): string {
    return formatTimePeriod(months);
  }

  /**
   * Formats an amortization schedule for display by adding formatted values.
   *
   * This method takes a raw amortization schedule and adds formatted string
   * representations of numeric values, making it ready for display in the UI.
   * It formats currency values according to the specified currency and locale.
   *
   * @param {PaymentData[]} schedule - The raw amortization schedule to format
   * @param {string} [currency='USD'] - The currency code to use for formatting
   * @param {string} [locale] - The locale to use for formatting
   * @returns {PaymentData[]} The schedule with added formatted values
   *
   * @example
   * // Format a schedule for display with Euro currency
   * const formattedSchedule = calculationService.formatAmortizationSchedule(
   *   calculationResults.amortizationSchedule,
   *   'EUR',
   *   'de-DE'
   * );
   * // Each payment in the schedule now has a formattedValues property
   * // with formatted strings for all numeric values
   */
  formatAmortizationSchedule(
    schedule: PaymentData[],
    currency: string = 'USD',
    locale?: string
  ): PaymentData[] {
    return schedule.map((payment) => ({
      ...payment,
      formattedValues: {
        monthlyPayment: formatCurrency(payment.monthlyPayment, locale, currency),
        principalPayment: formatCurrency(payment.principalPayment, locale, currency),
        interestPayment: formatCurrency(payment.interestPayment, locale, currency),
        balance: formatCurrency(payment.balance, locale, currency),
        totalInterest: formatCurrency(payment.totalInterest, locale, currency),
        totalPayment: formatCurrency(
          payment.totalPayment || payment.monthlyPayment,
          locale,
          currency
        ),
        paymentDate: payment.paymentDate ? formatTimePeriod(payment.payment) : '',
      },
    }));
  }

  /**
   * Formats calculation results for display by adding formatted values.
   *
   * This method takes raw calculation results and adds formatted string
   * representations of numeric values, making them ready for display in the UI.
   * It formats currency values, percentages, and time periods according to
   * the specified currency and locale.
   *
   * @param {CalculationResults} results - The raw calculation results to format
   * @param {string} [currency='USD'] - The currency code to use for formatting
   * @param {string} [locale] - The locale to use for formatting
   * @returns {FormattedCalculationResults} The results with added formatted values
   *
   * @example
   * // Format calculation results for display with Euro currency
   * const formattedResults = calculationService.formatCalculationResults(
   *   calculationResults,
   *   'EUR',
   *   'de-DE'
   * );
   * // Results now have a formatted property with formatted strings
   * // for all numeric values, ready to display in the UI
   */
  formatCalculationResults(
    results: CalculationResults,
    currency: string = 'USD',
    locale?: string
  ): FormattedCalculationResults {
    // Calculate total payment (principal + interest)
    const totalPayment = results.monthlyPayment * results.originalTerm * 12;

    return {
      ...results,
      formatted: {
        monthlyPayment: formatCurrency(results.monthlyPayment, locale, currency),
        totalInterest: formatCurrency(results.totalInterest, locale, currency),
        totalPayment: formatCurrency(
          results.totalInterest + results.monthlyPayment * results.originalTerm * 12,
          locale,
          currency
        ),
        originalTerm: `${results.originalTerm} years`,
        actualTerm: `${results.actualTerm.toFixed(2)} years`,
        oneTimeFees: results.oneTimeFees
          ? formatCurrency(results.oneTimeFees, locale, currency)
          : '',
        recurringFees: results.recurringFees
          ? formatCurrency(results.recurringFees, locale, currency)
          : '',
        totalCost: results.totalCost ? formatCurrency(results.totalCost, locale, currency) : '',
        apr: results.apr ? formatInterestRate(results.apr / 100) : '',
        interestSaved: results.timeOrPaymentSaved
          ? formatCurrency(results.timeOrPaymentSaved, locale, currency)
          : '',
        timeSaved: results.timeOrPaymentSaved ? formatTimePeriod(results.timeOrPaymentSaved) : '',
      },
    };
  }

  /**
   * Rounds a number to two decimal places (cents).
   *
   * This utility method ensures consistent rounding behavior for
   * monetary values throughout the application. It uses the roundToCents
   * function from calculationCore.
   *
   * @param {number} amount - The amount to round
   * @returns {number} The amount rounded to two decimal places
   *
   * @example
   * calculationService.roundToCents(123.456);
   * // Returns: 123.46
   *
   * calculationService.roundToCents(123.454);
   * // Returns: 123.45
   */
  roundToCents(amount: number): number {
    return roundToCents(amount);
  }

  /**
   * Calculate the maximum loan amount a user can afford based on income and expenses
   *
   * @param {AffordabilityParams} params - Parameters for affordability calculation
   * @returns {AffordabilityResult} Maximum loan amount and monthly payment
   *
   * @example
   * const affordability = calculationService.calculateAffordability({
   *   monthlyIncome: 5000,
   *   monthlyExpenses: 2000,
   *   interestRate: 3.5,
   *   loanTerm: 30
   * });
   */
  calculateAffordability(params: AffordabilityParams): AffordabilityResult {
    const {
      monthlyIncome,
      monthlyExpenses,
      interestRate,
      loanTerm,
      debtToIncomeRatio = 0.36,
      additionalCosts,
    } = params;

    // Validate inputs
    const validation = validateAffordabilityParams(
      monthlyIncome,
      monthlyExpenses,
      interestRate,
      loanTerm
    );

    if (!validation.isValid) {
      throw new Error(`Invalid affordability parameters: ${validation.errors.join(', ')}`);
    }

    // Calculate maximum monthly payment based on debt-to-income ratio
    const maxMonthlyDebt = monthlyIncome * debtToIncomeRatio;
    const availableForMortgage = maxMonthlyDebt - monthlyExpenses;

    // Calculate maximum loan amount based on available payment
    const monthlyRate = interestRate / 100 / 12;
    const totalMonths = loanTerm * 12;

    // Use the formula: P = PMT * ((1 - (1 + r)^-n) / r)
    // Where P is principal, PMT is payment, r is monthly rate, n is number of months
    const maxLoanAmount =
      availableForMortgage * ((1 - Math.pow(1 + monthlyRate, -totalMonths)) / monthlyRate);

    // Return the result
    return {
      maxLoanAmount: roundToCents(maxLoanAmount),
      monthlyPayment: roundToCents(availableForMortgage),
      debtToIncomeRatio,
    };
  }

  /**
   * Calculate when refinancing becomes beneficial
   *
   * @param {BreakEvenParams} params - Parameters for break-even calculation
   * @returns {BreakEvenResult} Break-even point and savings information
   *
   * @example
   * const breakEven = calculationService.calculateBreakEvenPoint({
   *   currentLoan: currentLoanDetails,
   *   newLoan: newLoanDetails,
   *   refinancingCosts: 3000
   * });
   */
  calculateBreakEvenPoint(params: BreakEvenParams): BreakEvenResult {
    const { currentLoan, newLoan, refinancingCosts } = params;

    // Validate inputs
    const validation = validateBreakEvenParams(currentLoan, newLoan, refinancingCosts);

    if (!validation.isValid) {
      throw new Error(`Invalid break-even parameters: ${validation.errors.join(', ')}`);
    }

    // Calculate monthly payments
    const currentPayment = this.calculateBasicLoanDetails(
      currentLoan.principal,
      currentLoan.interestRatePeriods[0].interestRate,
      currentLoan.loanTerm
    ).monthlyPayment;

    const newPayment = this.calculateBasicLoanDetails(
      newLoan.principal,
      newLoan.interestRatePeriods[0].interestRate,
      newLoan.loanTerm
    ).monthlyPayment;

    // Calculate monthly savings
    const monthlySavings = currentPayment - newPayment;

    // If there are no monthly savings, refinancing doesn't make sense
    if (monthlySavings <= 0) {
      throw new Error('New loan does not provide monthly savings');
    }

    // Calculate break-even point
    const breakEvenMonths = Math.ceil(refinancingCosts / monthlySavings);

    // Calculate lifetime savings
    const remainingMonths = currentLoan.loanTerm * 12;
    const lifetimeSavings = monthlySavings * remainingMonths - refinancingCosts;

    return {
      breakEvenMonths,
      lifetimeSavings: roundToCents(lifetimeSavings),
      monthlySavings: roundToCents(monthlySavings),
    };
  }

  /**
   * Calculate key milestones in the loan repayment
   *
   * @param {LoanDetails} loanDetails - Loan details
   * @returns {AmortizationMilestones} Key milestones in the loan repayment
   *
   * @example
   * const milestones = calculationService.calculateAmortizationMilestones(loanDetails);
   */
  calculateAmortizationMilestones(loanDetails: LoanDetails): AmortizationMilestones {
    // Validate loan details
    const validation = validateLoanDetails(loanDetails);
    if (!validation.isValid) {
      throw new Error(`Invalid loan details: ${validation.errors.join(', ')}`);
    }

    // Calculate full amortization schedule
    const results = this.calculateLoanDetails(loanDetails);
    const schedule = results.amortizationSchedule;

    // Find halfway point (50% of principal paid off)
    const halfwayPoint = schedule.find((payment) => payment.balance <= loanDetails.principal / 2);

    // Find principal crossover (where principal payment exceeds interest payment)
    const principalCrossover = schedule.find(
      (payment) => payment.principalPayment > payment.interestPayment
    );

    // Find quarter points
    const quarterPoints = [
      schedule.find((payment) => payment.balance <= loanDetails.principal * 0.75),
      halfwayPoint,
      schedule.find((payment) => payment.balance <= loanDetails.principal * 0.25),
    ];

    return {
      halfwayPoint: {
        month: halfwayPoint?.payment || 0,
        date: this.getPaymentDate(loanDetails.startDate, halfwayPoint?.payment || 0),
        balance: halfwayPoint?.balance || 0,
      },
      principalCrossover: {
        month: principalCrossover?.payment || 0,
        date: this.getPaymentDate(loanDetails.startDate, principalCrossover?.payment || 0),
        balance: principalCrossover?.balance || 0,
      },
      quarterPoints: quarterPoints.map((point) => ({
        month: point?.payment || 0,
        date: this.getPaymentDate(loanDetails.startDate, point?.payment || 0),
        balance: point?.balance || 0,
      })),
    };
  }

  /**
   * Helper method to calculate payment date
   *
   * @param {Date} startDate - Loan start date
   * @param {number} paymentNumber - Payment number
   * @returns {Date} Date of the specified payment
   * @private
   */
  private getPaymentDate(startDate: Date, paymentNumber: number): Date {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + paymentNumber);
    return date;
  }

  /**
   * Validate loan details
   *
   * @param {LoanDetails} loanDetails - Loan details to validate
   * @param {ValidationOptions} [options] - Validation options
   * @returns {boolean} Whether the loan details are valid
   *
   * @example
   * if (!calculationService.validateLoanDetails(loanDetails)) {
   *   console.error('Invalid loan details');
   * }
   */
  validateLoanDetails(
    loanDetails: LoanDetails,
    options?: ValidationOptions
  ): { isValid: boolean; errors: string[] } {
    return validateLoanDetails(loanDetails, options);
  }

  /**
   * Aggregates monthly payment data into yearly summaries.
   *
   * This method converts a detailed monthly amortization schedule into
   * yearly summary data, which is useful for charts and high-level reporting.
   * It delegates to the aggregateYearlyData function from calculationEngine.
   *
   * @param {PaymentData[]} schedule - The monthly amortization schedule to aggregate
   * @returns {Array} Yearly summary data
   *
   * @example
   * // Convert monthly schedule to yearly data for charting
   * const yearlyData = calculationService.aggregateYearlyData(
   *   calculationResults.amortizationSchedule
   * );
   * // Result contains one entry per year with summarized payment data
   */
  /**
   * Aggregates monthly payment data into yearly summaries.
   *
   * This method converts a detailed monthly amortization schedule into
   * yearly summary data, which is useful for charts and high-level reporting.
   * It delegates to the aggregateYearlyData function from calculationEngine.
   *
   * @param {PaymentData[]} schedule - The monthly amortization schedule to aggregate
   * @returns {Array} Yearly summary data
   *
   * @example
   * // Convert monthly schedule to yearly data for charting
   * const yearlyData = calculationService.aggregateYearlyData(
   *   calculationResults.amortizationSchedule
   * );
   * // Result contains one entry per year with summarized payment data
   */
  aggregateYearlyData(schedule: PaymentData[]) {
    return aggregateYearlyData(schedule);
  }
}

/**
 * Singleton instance of the CalculationService.
 *
 * This pre-instantiated service object can be imported and used directly
 * without needing to create a new instance. This is the recommended way
 * to use the service in most cases.
 *
 * @example
 * import { calculationService } from './calculationService';
 *
 * const results = calculationService.calculateBasicLoanDetails(300000, 3.5, 30);
 */
export const calculationService = new CalculationService();

/**
 * CalculationService class export.
 *
 * This export allows creating custom instances of the service when needed,
 * particularly useful for testing or when multiple independent instances
 * are required.
 *
 * @example
 * import CalculationService from './calculationService';
 *
 * // Create a custom instance
 * const customService = new CalculationService();
 */
export default CalculationService;
