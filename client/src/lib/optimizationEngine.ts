import {
  LoanDetails,
  OverpaymentDetails,
  OptimizationResult,
  OptimizationParameters,
  CalculationResults,
  OverpaymentStrategy,
  StrategyResult,
  PaymentData,
} from './types';
import { calculateLoanDetails } from './calculationEngine.ts';
import { roundToCents } from './calculationCore';

/**
 * Optimize overpayment strategy to maximize interest savings
 * This function analyzes different overpayment approaches and recommends the most effective strategy
 */
export function optimizeOverpayments(
  loanDetails: LoanDetails,
  optimizationParams: OptimizationParameters
): OptimizationResult {
  // Get baseline calculation without overpayments
  const baselineDetails = { ...loanDetails, overpaymentPlans: [] };
  const baselineResults = calculateLoanDetails(
    baselineDetails.principal,
    baselineDetails.interestRatePeriods,
    baselineDetails.loanTerm,
    undefined,
    baselineDetails.repaymentModel,
    baselineDetails.additionalCosts
  );

  // Generate different overpayment strategies based on the optimization strategy
  const strategies = generateOverpaymentStrategies(loanDetails, optimizationParams);

  // Evaluate each strategy and find the best one
  const evaluatedStrategies = evaluateStrategies(loanDetails, strategies, baselineResults);
  const bestStrategy = findBestStrategy(
    evaluatedStrategies,
    optimizationParams.optimizationStrategy
  );

  // Calculate results with optimized overpayments
  const optimizedDetails = { ...loanDetails, overpaymentPlans: bestStrategy.overpayments };
  const optimizedResults = calculateLoanDetails(
    optimizedDetails.principal,
    optimizedDetails.interestRatePeriods,
    optimizedDetails.loanTerm,
    bestStrategy.overpayments[0], // For backward compatibility
    optimizedDetails.repaymentModel,
    optimizedDetails.additionalCosts,
    bestStrategy.overpayments, // Pass all overpayments
    optimizedDetails.startDate
  );

  // Calculate savings
  const interestSaved = baselineResults.totalInterest - optimizedResults.totalInterest;
  const timeOrPaymentSaved = baselineResults.actualTerm - optimizedResults.actualTerm;

  // Calculate optimization value and fee
  const optimizationValue = interestSaved;
  const optimizationFee = roundToCents(
    (optimizationValue * optimizationParams.feePercentage) / 100
  );

  // Generate comparison chart data
  const comparisonChart = generateComparisonChartData(baselineResults, optimizedResults);

  // Create a summary of all strategies for debugging
  const allStrategies = evaluatedStrategies.map((strategy) => ({
    name: strategy.name,
    interestSaved: strategy.results.interestSaved,
    termReduction: strategy.results.termReduction,
    effectivenessRatio: strategy.results.effectivenessRatio,
    isBest: strategy === bestStrategy,
  }));

  return {
    optimizedOverpayments: bestStrategy.overpayments,
    interestSaved,
    timeOrPaymentSaved,
    optimizationValue,
    optimizationFee,
    comparisonChart,
    allStrategies,
  };
}

/**
 * Generate different overpayment strategies based on the optimization parameters
 */
function generateOverpaymentStrategies(
  loanDetails: LoanDetails,
  params: OptimizationParameters
): OverpaymentStrategy[] {
  const strategies: OverpaymentStrategy[] = [];

  // Strategy 1: Lump Sum at Beginning
  if (params.maxOneTimeOverpayment > 0) {
    strategies.push({
      name: 'Lump Sum at Beginning',
      description: 'Make a one-time lump sum payment at the beginning of the loan',
      overpayments: [
        {
          amount: params.maxOneTimeOverpayment,
          startMonth: 1,
          startDate: loanDetails.startDate,
          isRecurring: false,
          frequency: 'one-time',
          effect: 'reduceTerm',
        },
      ],
      results: { interestSaved: 0, termReduction: 0, effectivenessRatio: 0 },
    });
  }

  // Strategy 2: Regular Monthly Overpayments
  if (params.maxMonthlyOverpayment > 0) {
    strategies.push({
      name: 'Regular Monthly Overpayments',
      description: 'Make regular monthly overpayments throughout the loan term',
      overpayments: [
        {
          amount: params.maxMonthlyOverpayment,
          startMonth: 1,
          startDate: loanDetails.startDate,
          isRecurring: true,
          frequency: 'monthly',
          effect: 'reduceTerm',
        },
      ],
      results: { interestSaved: 0, termReduction: 0, effectivenessRatio: 0 },
    });
  }

  // Strategy 3: Combination (Lump Sum + Monthly)
  if (params.maxOneTimeOverpayment > 0 && params.maxMonthlyOverpayment > 0) {
    strategies.push({
      name: 'Combination Strategy',
      description: 'Make a lump sum payment at the beginning and regular monthly overpayments',
      overpayments: [
        {
          amount: params.maxOneTimeOverpayment,
          startMonth: 1,
          startDate: loanDetails.startDate,
          isRecurring: false,
          frequency: 'one-time',
          effect: 'reduceTerm',
        },
        {
          amount: params.maxMonthlyOverpayment,
          startMonth: 1,
          startDate: loanDetails.startDate,
          isRecurring: true,
          frequency: 'monthly',
          effect: 'reduceTerm',
        },
      ],
      results: { interestSaved: 0, termReduction: 0, effectivenessRatio: 0 },
    });
  }

  // Strategy 4: Graduated Overpayments (increasing over time)
  if (params.maxMonthlyOverpayment > 0) {
    const initialAmount = params.maxMonthlyOverpayment * 0.5;
    const secondStageAmount = params.maxMonthlyOverpayment * 0.75;
    const finalAmount = params.maxMonthlyOverpayment;

    strategies.push({
      name: 'Graduated Overpayments',
      description: 'Start with smaller overpayments and increase them over time',
      overpayments: [
        {
          amount: initialAmount,
          startMonth: 1,
          endMonth: 24,
          startDate: loanDetails.startDate,
          isRecurring: true,
          frequency: 'monthly',
          effect: 'reduceTerm',
        },
        {
          amount: secondStageAmount,
          startMonth: 25,
          endMonth: 60,
          startDate: loanDetails.startDate,
          isRecurring: true,
          frequency: 'monthly',
          effect: 'reduceTerm',
        },
        {
          amount: finalAmount,
          startMonth: 61,
          startDate: loanDetails.startDate,
          isRecurring: true,
          frequency: 'monthly',
          effect: 'reduceTerm',
        },
      ],
      results: { interestSaved: 0, termReduction: 0, effectivenessRatio: 0 },
    });
  }

  // Strategy 5: Quarterly Lump Sums
  if (params.maxOneTimeOverpayment > 0) {
    const quarterlyAmount = params.maxOneTimeOverpayment / 4;

    strategies.push({
      name: 'Quarterly Lump Sums',
      description: 'Make quarterly lump sum payments',
      overpayments: [
        {
          amount: quarterlyAmount,
          startMonth: 1,
          startDate: loanDetails.startDate,
          isRecurring: true,
          frequency: 'quarterly',
          effect: 'reduceTerm',
        },
      ],
      results: { interestSaved: 0, termReduction: 0, effectivenessRatio: 0 },
    });
  }

  return strategies;
}

/**
 * Calculate the present value of interest saved
 * This function adjusts the interest saved based on when it is saved
 * Interest saved earlier is more valuable than interest saved later
 */
function calculatePresentValueOfInterestSaved(
  baseSchedule: PaymentData[],
  optimizedSchedule: PaymentData[],
  discountRate: number = 0.05 // 5% annual discount rate
): number {
  // If either schedule is empty, return 0
  if (!baseSchedule.length || !optimizedSchedule.length) {
    return 0;
  }

  // Calculate the monthly discount rate
  const monthlyDiscountRate = discountRate / 12;

  // Calculate the present value of interest saved for each month
  let presentValueOfInterestSaved = 0;

  // Determine the maximum length to compare
  const maxLength = Math.min(baseSchedule.length, optimizedSchedule.length);

  for (let i = 0; i < maxLength; i++) {
    // Get the interest payment for each schedule
    const baseInterest = baseSchedule[i].interestPayment;
    const optimizedInterest = optimizedSchedule[i].interestPayment;

    // Calculate the interest saved for this month
    const interestSaved = baseInterest - optimizedInterest;

    // Calculate the present value of the interest saved
    const presentValue = interestSaved / Math.pow(1 + monthlyDiscountRate, i);

    // Add to the total
    presentValueOfInterestSaved += presentValue;
  }

  // If the optimized schedule is shorter than the base schedule,
  // add the present value of all remaining interest payments in the base schedule
  if (optimizedSchedule.length < baseSchedule.length) {
    for (let i = optimizedSchedule.length; i < baseSchedule.length; i++) {
      const baseInterest = baseSchedule[i].interestPayment;
      const presentValue = baseInterest / Math.pow(1 + monthlyDiscountRate, i);
      presentValueOfInterestSaved += presentValue;
    }
  }

  return presentValueOfInterestSaved;
}

/**
 * Evaluate each strategy and calculate its effectiveness
 */
function evaluateStrategies(
  loanDetails: LoanDetails,
  strategies: OverpaymentStrategy[],
  baselineResults: CalculationResults
): OverpaymentStrategy[] {
  return strategies.map((strategy) => {
    // Calculate results with this strategy
    const strategyDetails = { ...loanDetails, overpaymentPlans: strategy.overpayments };
    const strategyResults = calculateLoanDetails(
      strategyDetails.principal,
      strategyDetails.interestRatePeriods,
      strategyDetails.loanTerm,
      strategy.overpayments[0], // For backward compatibility
      strategyDetails.repaymentModel,
      strategyDetails.additionalCosts,
      strategy.overpayments, // Pass all overpayments
      strategyDetails.startDate
    );

    // Calculate effectiveness metrics
    // Use present value calculation for more accurate interest savings
    const interestSaved = calculatePresentValueOfInterestSaved(
      baselineResults.amortizationSchedule,
      strategyResults.amortizationSchedule
    );

    const termReduction = baselineResults.actualTerm - strategyResults.actualTerm;

    // Calculate total overpayment amount
    let totalOverpayment = 0;

    for (const overpayment of strategy.overpayments) {
      if (!overpayment.isRecurring) {
        totalOverpayment += overpayment.amount;
      } else {
        const startMonth = overpayment.startMonth || 1;
        const endMonth =
          overpayment.endMonth ||
          Math.min(loanDetails.loanTerm * 12, strategyResults.amortizationSchedule.length);

        if (overpayment.frequency === 'monthly') {
          totalOverpayment += overpayment.amount * (endMonth - startMonth + 1);
        } else if (overpayment.frequency === 'quarterly') {
          const quarters = Math.ceil((endMonth - startMonth + 1) / 3);
          totalOverpayment += overpayment.amount * quarters;
        } else if (overpayment.frequency === 'annual') {
          const years = Math.ceil((endMonth - startMonth + 1) / 12);
          totalOverpayment += overpayment.amount * years;
        }
      }
    }

    // Calculate effectiveness ratio (interest saved per dollar of overpayment)
    // For very large monthly overpayments, we need to be careful with the calculation
    // to avoid favoring tiny one-time payments over substantial monthly payments
    let effectivenessRatio = 0;

    if (totalOverpayment > 0) {
      // Basic ratio is interest saved per dollar of overpayment
      effectivenessRatio = interestSaved / totalOverpayment;

      // Add a term reduction factor to the effectiveness ratio
      // This ensures strategies that pay off the loan faster are properly valued
      const termReductionFactor = termReduction / baselineResults.actualTerm;
      const timeValueMultiplier = 1 + termReductionFactor;

      // Apply the time value multiplier to the effectiveness ratio
      effectivenessRatio *= timeValueMultiplier;

      // For monthly payments, we also consider the term reduction
      if (strategy.overpayments.some((op) => op.isRecurring && op.frequency === 'monthly')) {
        // Add a term reduction bonus to the effectiveness ratio
        // This helps ensure that large monthly payments that significantly reduce the term
        // are properly valued compared to small one-time payments
        const termReductionBonus = termReduction > 0 ? Math.log10(termReduction + 1) : 0;
        effectivenessRatio *= 1 + termReductionBonus;
      }

      // For very small one-time payments, apply a penalty to prevent them from being
      // artificially favored due to floating-point precision issues
      if (
        strategy.overpayments.length === 1 &&
        !strategy.overpayments[0].isRecurring &&
        strategy.overpayments[0].amount < 100
      ) {
        effectivenessRatio *= 0.1; // Stronger penalty for very small payments
      }
    }

    return {
      ...strategy,
      results: {
        interestSaved,
        termReduction,
        effectivenessRatio,
      },
    };
  });
}

/**
 * Find the best strategy based on the optimization goal
 */
function findBestStrategy(
  strategies: OverpaymentStrategy[],
  optimizationStrategy: 'maximizeInterestSavings' | 'minimizeTime' | 'balanced'
): OverpaymentStrategy {
  if (strategies.length === 0) {
    // Return a default strategy if no strategies are available
    return {
      name: 'Default',
      description: 'No overpayments',
      overpayments: [],
      results: { interestSaved: 0, termReduction: 0, effectivenessRatio: 0 },
    };
  }

  if (optimizationStrategy === 'maximizeInterestSavings') {
    // Sort by interest saved (descending)
    return [...strategies].sort((a, b) => b.results.interestSaved - a.results.interestSaved)[0];
  } else if (optimizationStrategy === 'minimizeTime') {
    // Sort by term reduction (descending)
    return [...strategies].sort((a, b) => b.results.termReduction - a.results.termReduction)[0];
  } else {
    // Balanced approach: sort by effectiveness ratio (descending)
    return [...strategies].sort(
      (a, b) => b.results.effectivenessRatio - a.results.effectivenessRatio
    )[0];
  }
}

/**
 * Generate data for comparison chart
 */
function generateComparisonChartData(
  baselineResults: CalculationResults,
  optimizedResults: CalculationResults
) {
  // Generate labels for each year
  const maxYears = Math.max(
    Math.ceil(baselineResults.actualTerm),
    Math.ceil(optimizedResults.actualTerm)
  );

  const labels = Array.from({ length: maxYears }, (_, i) => `Year ${i + 1}`);

  // Extract yearly total interest data
  const originalData = baselineResults.yearlyData.map((year) => year.totalInterest);
  const optimizedData = optimizedResults.yearlyData.map((year) => year.totalInterest);

  // Pad arrays to match the number of years
  while (originalData.length < maxYears) {
    originalData.push(originalData[originalData.length - 1] || 0);
  }

  while (optimizedData.length < maxYears) {
    optimizedData.push(optimizedData[optimizedData.length - 1] || 0);
  }

  return {
    labels,
    originalData,
    optimizedData,
  };
}

/**
 * Analyze the impact of different overpayment amounts
 * Returns a series of data points showing interest savings for different overpayment amounts
 */
export function analyzeOverpaymentImpact(
  loanDetails: LoanDetails,
  maxMonthlyAmount: number,
  steps: number = 5
): { amount: number; interestSaved: number; termReduction: number }[] {
  const baselineDetails = { ...loanDetails, overpaymentPlans: [] };
  const baselineResults = calculateLoanDetails(
    baselineDetails.principal,
    baselineDetails.interestRatePeriods,
    baselineDetails.loanTerm,
    undefined,
    baselineDetails.repaymentModel,
    baselineDetails.additionalCosts
  );

  const stepSize = maxMonthlyAmount / steps;
  const results = [];

  for (let i = 1; i <= steps; i++) {
    const amount = stepSize * i;

    const overpaymentPlan: OverpaymentDetails = {
      amount,
      startMonth: 1,
      startDate: loanDetails.startDate,
      isRecurring: true,
      frequency: 'monthly',
      effect: 'reduceTerm',
    };

    const overpaymentDetails = { ...loanDetails, overpaymentPlans: [overpaymentPlan] };
    const overpaymentResults = calculateLoanDetails(
      overpaymentDetails.principal,
      overpaymentDetails.interestRatePeriods,
      overpaymentDetails.loanTerm,
      overpaymentPlan,
      overpaymentDetails.repaymentModel,
      overpaymentDetails.additionalCosts,
      [overpaymentPlan], // Pass all overpayments
      overpaymentDetails.startDate
    );

    const interestSaved = baselineResults.totalInterest - overpaymentResults.totalInterest;
    const termReduction = baselineResults.actualTerm - overpaymentResults.actualTerm;

    results.push({
      amount,
      interestSaved,
      termReduction,
    });
  }

  return results;
}

/**
 * Compare lump sum vs regular additional payments
 * Returns data for comparing the effectiveness of different approaches
 */
export function compareLumpSumVsRegular(
  loanDetails: LoanDetails,
  lumpSumAmount: number,
  monthlyAmount: number
): {
  lumpSum: { interestSaved: number; termReduction: number };
  monthly: { interestSaved: number; termReduction: number };
  breakEvenMonth: number;
} {
  const baselineDetails = { ...loanDetails, overpaymentPlans: [] };
  const baselineResults = calculateLoanDetails(
    baselineDetails.principal,
    baselineDetails.interestRatePeriods,
    baselineDetails.loanTerm,
    undefined,
    baselineDetails.repaymentModel,
    baselineDetails.additionalCosts
  );

  // Lump sum strategy
  const lumpSumPlan: OverpaymentDetails = {
    amount: lumpSumAmount,
    startMonth: 1,
    startDate: loanDetails.startDate,
    isRecurring: false,
    frequency: 'one-time',
    effect: 'reduceTerm',
  };

  const lumpSumDetails = { ...loanDetails, overpaymentPlans: [lumpSumPlan] };
  const lumpSumResults = calculateLoanDetails(
    lumpSumDetails.principal,
    lumpSumDetails.interestRatePeriods,
    lumpSumDetails.loanTerm,
    lumpSumPlan,
    lumpSumDetails.repaymentModel,
    lumpSumDetails.additionalCosts,
    [lumpSumPlan], // Pass all overpayments
    lumpSumDetails.startDate
  );

  // Monthly strategy
  const monthlyPlan: OverpaymentDetails = {
    amount: monthlyAmount,
    startMonth: 1,
    startDate: loanDetails.startDate,
    isRecurring: true,
    frequency: 'monthly',
    effect: 'reduceTerm',
  };

  const monthlyDetails = { ...loanDetails, overpaymentPlans: [monthlyPlan] };
  const monthlyResults = calculateLoanDetails(
    monthlyDetails.principal,
    monthlyDetails.interestRatePeriods,
    monthlyDetails.loanTerm,
    monthlyPlan,
    monthlyDetails.repaymentModel,
    monthlyDetails.additionalCosts,
    [monthlyPlan], // Pass all overpayments
    monthlyDetails.startDate
  );

  // Calculate metrics
  const lumpSumInterestSaved = baselineResults.totalInterest - lumpSumResults.totalInterest;
  const lumpSumTermReduction = baselineResults.actualTerm - lumpSumResults.actualTerm;

  const monthlyInterestSaved = baselineResults.totalInterest - monthlyResults.totalInterest;
  const monthlyTermReduction = baselineResults.actualTerm - monthlyResults.actualTerm;

  // Calculate break-even month (when monthly overpayments total equals lump sum)
  const breakEvenMonth = Math.ceil(lumpSumAmount / monthlyAmount);

  return {
    lumpSum: {
      interestSaved: lumpSumInterestSaved,
      termReduction: lumpSumTermReduction,
    },
    monthly: {
      interestSaved: monthlyInterestSaved,
      termReduction: monthlyTermReduction,
    },
    breakEvenMonth,
  };
}
