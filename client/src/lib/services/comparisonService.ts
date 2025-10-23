import { compareCalculations } from '../comparisonUtils';
import {
  compareScenarios,
  calculateBreakEvenPoint,
  calculateCumulativeCostDifference,
} from '../comparisonEngine';
import {
  CalculationResults,
  LoanDetails,
  ScenarioComparison,
  ScenarioComparisonOptions,
  ComparisonResults,
  IComparisonService,
  OverpaymentDetails,
  RepaymentModel,
  OverpaymentStrategy,
} from '../types';
import { validateLoanDetails } from '../validation';
import { calculateLoanDetails } from '../calculationEngine';
import { applyMultipleOverpayments } from '../overpaymentCalculator';

/**
 * Error class for comparison service errors
 */
export class ComparisonServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ComparisonServiceError';
  }
}

/**
 * Service for handling loan comparison operations
 * Acts as a central point for all comparison functionality
 */
export class ComparisonService implements IComparisonService {
  /**
   * Compare two calculation results and return savings metrics
   *
   * @param baseCalculation - The baseline calculation
   * @param calculationWithoutOverpayments - The calculation WITHOUT overpayments
   * @returns Comparison results with interest saved, time saved, and percentage saved
   * @throws ComparisonServiceError if inputs are invalid
   */
  compareLoanResults(
    baseCalculation: CalculationResults,
    calculationWithoutOverpayments: CalculationResults
  ): ComparisonResults {
    // Input validation
    if (!baseCalculation || !calculationWithoutOverpayments) {
      throw new ComparisonServiceError('Both calculations must be provided');
    }

    return compareCalculations(baseCalculation, calculationWithoutOverpayments);
  }

  /**
   * Compare a base loan with a loan that has overpayments
   *
   * @param baseCalculation
   * @param loanWithoutOverpayments - The calculation WITHOUT overpayments applied
   * @returns Comparison results showing the impact of overpayments
   * @throws ComparisonServiceError if inputs are invalid
   */
  compareWithOverpayments(
    baseCalculation: CalculationResults,
    loanWithoutOverpayments: CalculationResults
  ): ComparisonResults {
    // Input validation
    if (!baseCalculation || !loanWithoutOverpayments) {
      throw new ComparisonServiceError('Both calculations must be provided');
    }

    return compareCalculations(baseCalculation, loanWithoutOverpayments);
  }

  /**
   * Compare multiple loan scenarios
   *
   * @param scenarios - Array of loan scenarios to compare
   * @param options - Optional comparison options
   * @returns Detailed comparison of all scenarios
   * @throws ComparisonServiceError if inputs are invalid
   */
  compareMultipleScenarios(
    scenarios: Array<{ id: string; name: string; loanDetails: LoanDetails }>,
    options?: ScenarioComparisonOptions
  ): ScenarioComparison {
    // Input validation
    if (!scenarios || scenarios.length < 2) {
      throw new ComparisonServiceError('At least two scenarios must be provided for comparison');
    }

    // Validate each scenario's loan details
    for (const scenario of scenarios) {
      const validation = validateLoanDetails(scenario.loanDetails);
      if (!validation.isValid) {
        throw new ComparisonServiceError(
          `Invalid loan details in scenario "${scenario.name}": ${validation.errors.join(', ')}`
        );
      }
    }

    return compareScenarios(scenarios, options);
  }

  /**
   * Compare loans with different terms
   *
   * @param baseLoanDetails - Base loan details
   * @param comparisonTerms - Array of terms in years to compare
   * @returns Comparison of loans with different terms
   * @throws ComparisonServiceError if inputs are invalid
   */
  compareDifferentTerms(
    baseLoanDetails: LoanDetails,
    comparisonTerms: number[]
  ): ScenarioComparison {
    // Input validation
    if (!baseLoanDetails) {
      throw new ComparisonServiceError('Base loan details must be provided');
    }

    if (!comparisonTerms || comparisonTerms.length === 0) {
      throw new ComparisonServiceError('At least one comparison term must be provided');
    }

    // Validate base loan details
    const validation = validateLoanDetails(baseLoanDetails);
    if (!validation.isValid) {
      throw new ComparisonServiceError(
        `Invalid base loan details: ${validation.errors.join(', ')}`
      );
    }

    // Create scenarios for each term
    const scenarios = [
      {
        id: 'base',
        name: `${baseLoanDetails.loanTerm} Year Term (Base)`,
        loanDetails: baseLoanDetails,
      },
      ...comparisonTerms.map((term, index) => ({
        id: `term-${term}`,
        name: `${term} Year Term`,
        loanDetails: {
          ...baseLoanDetails,
          loanTerm: term,
        },
      })),
    ];

    return this.compareMultipleScenarios(scenarios);
  }

  /**
   * Compare loans with different interest rates
   *
   * @param baseLoanDetails - Base loan details
   * @param comparisonRates - Array of interest rates to compare
   * @returns Comparison of loans with different interest rates
   * @throws ComparisonServiceError if inputs are invalid
   */
  compareDifferentRates(
    baseLoanDetails: LoanDetails,
    comparisonRates: number[]
  ): ScenarioComparison {
    // Input validation
    if (!baseLoanDetails) {
      throw new ComparisonServiceError('Base loan details must be provided');
    }

    if (!comparisonRates || comparisonRates.length === 0) {
      throw new ComparisonServiceError('At least one comparison rate must be provided');
    }

    // Validate base loan details
    const validation = validateLoanDetails(baseLoanDetails);
    if (!validation.isValid) {
      throw new ComparisonServiceError(
        `Invalid base loan details: ${validation.errors.join(', ')}`
      );
    }

    // Create scenarios for each interest rate
    const baseRate = baseLoanDetails.interestRatePeriods[0].interestRate;
    const scenarios = [
      {
        id: 'base',
        name: `${baseRate}% Interest Rate (Base)`,
        loanDetails: baseLoanDetails,
      },
      ...comparisonRates.map((rate, index) => ({
        id: `rate-${rate}`,
        name: `${rate}% Interest Rate`,
        loanDetails: {
          ...baseLoanDetails,
          interestRatePeriods: [
            { startMonth: 0, interestRate: rate },
            ...baseLoanDetails.interestRatePeriods.filter((p) => p.startMonth > 0),
          ],
        },
      })),
    ];

    return this.compareMultipleScenarios(scenarios);
  }

  /**
   * Compare different repayment models
   *
   * @param baseLoanDetails - Base loan details
   * @param repaymentModels - Array of repayment models to compare
   * @returns Comparison of loans with different repayment models
   * @throws ComparisonServiceError if inputs are invalid
   */
  compareRepaymentModels(
    baseLoanDetails: LoanDetails,
    repaymentModels: RepaymentModel[] = ['equalInstallments', 'decreasingInstallments']
  ): ScenarioComparison {
    // Input validation
    if (!baseLoanDetails) {
      throw new ComparisonServiceError('Base loan details must be provided');
    }

    // Validate base loan details
    const validation = validateLoanDetails(baseLoanDetails);
    if (!validation.isValid) {
      throw new ComparisonServiceError(
        `Invalid base loan details: ${validation.errors.join(', ')}`
      );
    }

    // Create scenarios for each repayment model
    const baseModel = baseLoanDetails.repaymentModel || 'equalInstallments';
    const scenarios = [
      {
        id: 'base',
        name: `${baseModel} (Base)`,
        loanDetails: baseLoanDetails,
      },
      ...repaymentModels
        .filter((model) => model !== baseModel) // Exclude the base model
        .map((model, index) => ({
          id: `model-${model}`,
          name: model,
          loanDetails: {
            ...baseLoanDetails,
            repaymentModel: model,
          },
        })),
    ];

    return this.compareMultipleScenarios(scenarios);
  }

  /**
   * Analyze the impact of different overpayment strategies
   *
   * @param loanDetails - Base loan details without overpayments
   * @param overpaymentAmount - Total amount available for overpayments
   * @returns Analysis of different overpayment strategies
   * @throws ComparisonServiceError if inputs are invalid
   */
  analyzeOverpaymentStrategies(
    loanDetails: LoanDetails,
    overpaymentAmount: number
  ): OverpaymentStrategy[] {
    // Input validation
    if (!loanDetails) {
      throw new ComparisonServiceError('Loan details must be provided');
    }

    if (overpaymentAmount <= 0) {
      throw new ComparisonServiceError('Overpayment amount must be greater than zero');
    }

    // Validate loan details
    const validation = validateLoanDetails(loanDetails);
    if (!validation.isValid) {
      throw new ComparisonServiceError(`Invalid loan details: ${validation.errors.join(', ')}`);
    }

    // Calculate base loan without overpayments
    const baseLoanDetails = { ...loanDetails, overpaymentPlans: [] };
    const baseCalculation = calculateLoanDetails(
      baseLoanDetails.principal,
      baseLoanDetails.interestRatePeriods,
      baseLoanDetails.loanTerm,
      undefined,
      baseLoanDetails.repaymentModel,
      baseLoanDetails.additionalCosts
    );

    // Define different strategies
    const strategies: OverpaymentStrategy[] = [
      // Strategy 1: Lump sum at the beginning
      {
        name: 'Early Lump Sum',
        description: 'Single payment at the beginning of the loan',
        overpayments: [
          {
            amount: overpaymentAmount,
            startDate: loanDetails.startDate,
            isRecurring: false,
            frequency: 'one-time',
            effect: 'reduceTerm',
          },
        ],
        results: { interestSaved: 0, termReduction: 0, effectivenessRatio: 0 },
      },

      // Strategy 2: Monthly recurring payments
      {
        name: 'Monthly Recurring',
        description: 'Equal monthly payments throughout the loan',
        overpayments: [
          {
            amount: overpaymentAmount / (loanDetails.loanTerm * 12),
            startDate: loanDetails.startDate,
            isRecurring: true,
            frequency: 'monthly',
            effect: 'reduceTerm',
          },
        ],
        results: { interestSaved: 0, termReduction: 0, effectivenessRatio: 0 },
      },

      // Strategy 3: Annual payments
      {
        name: 'Annual Payments',
        description: 'Larger payments made once per year',
        overpayments: [
          {
            amount: overpaymentAmount / loanDetails.loanTerm,
            startDate: loanDetails.startDate,
            isRecurring: true,
            frequency: 'annual',
            effect: 'reduceTerm',
          },
        ],
        results: { interestSaved: 0, termReduction: 0, effectivenessRatio: 0 },
      },

      // Strategy 4: Front-loaded (first half of loan term)
      {
        name: 'Front-Loaded',
        description: 'Higher payments in the first half of the loan term',
        overpayments: [
          {
            amount: overpaymentAmount / (loanDetails.loanTerm * 6),
            startDate: loanDetails.startDate,
            endDate: new Date(
              loanDetails.startDate.getTime() +
                ((loanDetails.loanTerm * 12) / 2) * 30 * 24 * 60 * 60 * 1000
            ),
            isRecurring: true,
            frequency: 'monthly',
            effect: 'reduceTerm',
          },
        ],
        results: { interestSaved: 0, termReduction: 0, effectivenessRatio: 0 },
      },
    ];

    // Calculate results for each strategy
    for (const strategy of strategies) {
      const loanWithOverpayments = {
        ...loanDetails,
        overpaymentPlans: strategy.overpayments,
      };

      // Calculate results with overpayments
      const overpaymentCalculation = calculateLoanDetails(
        loanWithOverpayments.principal,
        loanWithOverpayments.interestRatePeriods,
        loanWithOverpayments.loanTerm,
        loanWithOverpayments.overpaymentPlans[0],
        loanWithOverpayments.repaymentModel,
        loanWithOverpayments.additionalCosts
      );

      // Calculate metrics
      const interestSaved = baseCalculation.totalInterest - overpaymentCalculation.totalInterest;
      const termReduction = baseCalculation.actualTerm - overpaymentCalculation.actualTerm;

      // Calculate effectiveness ratio (interest saved per dollar of overpayment)
      const effectivenessRatio = interestSaved / overpaymentAmount;

      // Update strategy results
      strategy.results = {
        interestSaved,
        termReduction,
        effectivenessRatio,
      };
    }

    // Sort strategies by effectiveness ratio (most effective first)
    strategies.sort((a, b) => b.results.effectivenessRatio - a.results.effectivenessRatio);

    return strategies;
  }

  /**
   * Find optimal overpayment timing
   *
   * @param loanDetails - Base loan details
   * @param overpaymentAmount - Amount available for a one-time overpayment
   * @param intervals - Number of intervals to analyze (default: 12)
   * @returns Analysis of overpayment effectiveness at different times
   * @throws ComparisonServiceError if inputs are invalid
   */
  findOptimalOverpaymentTiming(
    loanDetails: LoanDetails,
    overpaymentAmount: number,
    intervals: number = 12
  ): { month: number; interestSaved: number; termReduction: number }[] {
    // Input validation
    if (!loanDetails) {
      throw new ComparisonServiceError('Loan details must be provided');
    }

    if (overpaymentAmount <= 0) {
      throw new ComparisonServiceError('Overpayment amount must be greater than zero');
    }

    // Validate loan details
    const validation = validateLoanDetails(loanDetails);
    if (!validation.isValid) {
      throw new ComparisonServiceError(`Invalid loan details: ${validation.errors.join(', ')}`);
    }

    // Calculate base loan without overpayments
    const baseLoanDetails = { ...loanDetails, overpaymentPlans: [] };
    const baseCalculation = calculateLoanDetails(
      baseLoanDetails.principal,
      baseLoanDetails.interestRatePeriods,
      baseLoanDetails.loanTerm,
      undefined,
      baseLoanDetails.repaymentModel,
      baseLoanDetails.additionalCosts
    );

    // Calculate total loan term in months
    const totalMonths = baseCalculation.amortizationSchedule.length;

    // Determine interval size
    const intervalSize = Math.max(1, Math.floor(totalMonths / intervals));

    // Analyze overpayment at different points in time
    const results: { month: number; interestSaved: number; termReduction: number }[] = [];

    for (let month = 1; month < totalMonths; month += intervalSize) {
      // Create loan details with overpayment at this month
      // Create a date for this month by adding months to the start date
      const overpaymentDate = new Date(loanDetails.startDate);
      overpaymentDate.setMonth(overpaymentDate.getMonth() + month);

      const overpaymentPlan: OverpaymentDetails = {
        amount: overpaymentAmount,
        startDate: overpaymentDate,
        isRecurring: false,
        frequency: 'one-time',
        effect: 'reduceTerm',
        startMonth: month, // For backwards compatibility
      };

      const loanWithOverpayment = {
        ...loanDetails,
        overpaymentPlans: [overpaymentPlan],
      };

      // Calculate results with overpayment
      const overpaymentCalculation = calculateLoanDetails(
        loanWithOverpayment.principal,
        loanWithOverpayment.interestRatePeriods,
        loanWithOverpayment.loanTerm,
        loanWithOverpayment.overpaymentPlans[0],
        loanWithOverpayment.repaymentModel,
        loanWithOverpayment.additionalCosts
      );

      // Calculate metrics
      const interestSaved = baseCalculation.totalInterest - overpaymentCalculation.totalInterest;
      const termReduction = baseCalculation.actualTerm - overpaymentCalculation.actualTerm;

      results.push({
        month,
        interestSaved,
        termReduction,
      });
    }

    // Sort by interest saved (most saved first)
    results.sort((a, b) => b.interestSaved - a.interestSaved);

    return results;
  }

  /**
   * Compare lump sum vs. recurring overpayments
   *
   * @param loanDetails - Base loan details
   * @param lumpSumAmount - Amount for lump sum overpayment
   * @param recurringAmount - Monthly amount for recurring overpayments
   * @returns Comparison between lump sum and recurring overpayment strategies
   * @throws ComparisonServiceError if inputs are invalid
   */
  compareLumpSumVsRecurring(
    loanDetails: LoanDetails,
    lumpSumAmount: number,
    recurringAmount: number
  ): {
    lumpSum: { interestSaved: number; termReduction: number };
    recurring: { interestSaved: number; termReduction: number };
    breakEvenMonth: number | undefined;
    moreEffective: 'lumpSum' | 'recurring';
  } {
    // Input validation
    if (!loanDetails) {
      throw new ComparisonServiceError('Loan details must be provided');
    }

    if (lumpSumAmount <= 0) {
      throw new ComparisonServiceError('Lump sum amount must be greater than zero');
    }

    if (recurringAmount <= 0) {
      throw new ComparisonServiceError('Recurring amount must be greater than zero');
    }

    // Validate loan details
    const validation = validateLoanDetails(loanDetails);
    if (!validation.isValid) {
      throw new ComparisonServiceError(`Invalid loan details: ${validation.errors.join(', ')}`);
    }

    // Calculate base loan without overpayments
    const baseLoanDetails = { ...loanDetails, overpaymentPlans: [] };
    const baseCalculation = calculateLoanDetails(
      baseLoanDetails.principal,
      baseLoanDetails.interestRatePeriods,
      baseLoanDetails.loanTerm,
      undefined,
      baseLoanDetails.repaymentModel,
      baseLoanDetails.additionalCosts
    );

    // Create loan with lump sum overpayment
    const lumpSumPlan: OverpaymentDetails = {
      amount: lumpSumAmount,
      startDate: loanDetails.startDate,
      isRecurring: false,
      frequency: 'one-time',
      effect: 'reduceTerm',
    };

    const loanWithLumpSum = {
      ...loanDetails,
      overpaymentPlans: [lumpSumPlan],
    };

    // Create loan with recurring overpayments
    const recurringPlan: OverpaymentDetails = {
      amount: recurringAmount,
      startDate: loanDetails.startDate,
      isRecurring: true,
      frequency: 'monthly',
      effect: 'reduceTerm',
    };

    const loanWithRecurring = {
      ...loanDetails,
      overpaymentPlans: [recurringPlan],
    };

    // Calculate results for both strategies
    const lumpSumCalculation = calculateLoanDetails(
      loanWithLumpSum.principal,
      loanWithLumpSum.interestRatePeriods,
      loanWithLumpSum.loanTerm,
      lumpSumPlan,
      loanWithLumpSum.repaymentModel,
      loanWithLumpSum.additionalCosts
    );

    const recurringCalculation = calculateLoanDetails(
      loanWithRecurring.principal,
      loanWithRecurring.interestRatePeriods,
      loanWithRecurring.loanTerm,
      recurringPlan,
      loanWithRecurring.repaymentModel,
      loanWithRecurring.additionalCosts
    );

    // Calculate metrics
    const lumpSumInterestSaved = baseCalculation.totalInterest - lumpSumCalculation.totalInterest;
    const lumpSumTermReduction = baseCalculation.actualTerm - lumpSumCalculation.actualTerm;

    const recurringInterestSaved =
      baseCalculation.totalInterest - recurringCalculation.totalInterest;
    const recurringTermReduction = baseCalculation.actualTerm - recurringCalculation.actualTerm;

    // Calculate break-even point
    const breakEvenMonth = calculateBreakEvenPoint(
      lumpSumCalculation.amortizationSchedule,
      recurringCalculation.amortizationSchedule
    );

    // Determine which strategy is more effective based on interest saved
    const moreEffective = lumpSumInterestSaved > recurringInterestSaved ? 'lumpSum' : 'recurring';

    return {
      lumpSum: {
        interestSaved: lumpSumInterestSaved,
        termReduction: lumpSumTermReduction,
      },
      recurring: {
        interestSaved: recurringInterestSaved,
        termReduction: recurringTermReduction,
      },
      breakEvenMonth,
      moreEffective,
    };
  }
}

/**
 * Singleton instance of the ComparisonService.
 *
 * This pre-instantiated service object can be imported and used directly
 * without needing to create a new instance. This is the recommended way
 * to use the service in most cases.
 *
 * @example
 * import { comparisonService } from './comparisonService';
 *
 * const comparison = comparisonService.compareLoanResults(baseCalc, newCalc);
 */
export const comparisonService = new ComparisonService();

/**
 * ComparisonService class export.
 *
 * This export allows creating custom instances of the service when needed,
 * particularly useful for testing or when multiple independent instances
 * are required.
 */
export default ComparisonService;
