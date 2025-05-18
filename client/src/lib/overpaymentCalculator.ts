// overpaymentCalculator.ts
import {
  CalculationResults,
  PaymentData,
  OverpaymentDetails,
  LoanDetails,
  OverpaymentParams,
  ReducedTermParams,
  ReducedPaymentParams,
  MultipleOverpaymentParams,
  RateChangeParams,
  MultipleRateChangeParams,
  ComplexScenarioParams,
  YearlyData,
  FinalOverpaymentResultParams,
  OverpaymentApplicableParams,
  RecalculateWithNewRateParams,
  FinalizeResultsParams
} from "./types";
import { convertScheduleFormat, calculateBaseMonthlyPayment, roundToCents } from './calculationCore';

/**
 * Apply a one-time overpayment and recalculate the amortization schedule
 */
/**
 * Apply a one-time overpayment using parameter object
 */
export function applyOverpayment(params: OverpaymentParams): CalculationResults;

/**
 * Apply a one-time overpayment with individual parameters (backward compatibility)
 */
export function applyOverpayment(
  schedule: PaymentData[],
  overpaymentAmount: number,
  afterPayment: number,
  loanDetails: LoanDetails,
  effect: 'reduceTerm' | 'reducePayment'
): CalculationResults;

/**
 * Implementation that handles both parameter object and individual parameters
 */
export function applyOverpayment(
  scheduleOrParams: PaymentData[] | OverpaymentParams,
  overpaymentAmount?: number,
  afterPayment?: number,
  loanDetails?: LoanDetails,
  effect?: 'reduceTerm' | 'reducePayment'
): CalculationResults {
  // Handle parameter object
  if (!Array.isArray(scheduleOrParams)) {
    const params = scheduleOrParams;
    return applyOverpaymentImpl(
      params.schedule,
      params.overpaymentAmount,
      params.afterPayment,
      params.loanDetails,
      params.effect
    );
  }
  
  // Handle individual parameters
  return applyOverpaymentImpl(
    scheduleOrParams,
    overpaymentAmount!,
    afterPayment!,
    loanDetails!,
    effect!
  );
}

/**
 * Implementation of overpayment application
 */
function applyOverpaymentImpl(
  schedule: PaymentData[],
  overpaymentAmount: number,
  afterPayment: number,
  loanDetails: LoanDetails,
  effect: 'reduceTerm' | 'reducePayment'
): CalculationResults {
  // Add validation
  if (afterPayment <= 0 || afterPayment > schedule.length) {
    throw new Error(`Invalid payment number: ${afterPayment}`);
  }

  const targetPayment = schedule[afterPayment - 1];
  if (!targetPayment || targetPayment.balance <= 0) {
    // Return unchanged schedule if payment not found or loan already paid
    return {
      monthlyPayment: schedule[0]?.monthlyPayment || 0,
      totalInterest: schedule.reduce((sum, p) => sum + p.interestPayment, 0),
      amortizationSchedule: schedule,
      yearlyData: aggregateYearlyData(schedule),
      originalTerm: schedule.length / 12,
      actualTerm: schedule.length / 12
    };
  }

  const preOverpaymentSchedule = schedule.slice(0, afterPayment - 1);
  
  // Fix: Correctly adjust the principal payment and balance for the overpayment month
  const overpaymentMonth = {
    ...targetPayment,
    isOverpayment: true,
    overpaymentAmount: overpaymentAmount,
    principalPayment: targetPayment.principalPayment + overpaymentAmount,
    balance: Math.max(0, targetPayment.balance - overpaymentAmount)
  };
  
  const remainingBalance = overpaymentMonth.balance;
  const interestRatePeriods = loanDetails.interestRatePeriods;
  
  // Calculate remaining schedule based on effect
  let remainingSchedule;
  
  if (effect === 'reduceTerm') {
    // For term reduction, keep the same payment amount but recalculate how quickly the loan will be paid off
    remainingSchedule = calculateReducedTermSchedule(
      remainingBalance,
      interestRatePeriods,
      schedule[0].monthlyPayment,
      afterPayment + 1
    );
  } else {
    // For payment reduction, keep the same term but recalculate a lower monthly payment
    // Make sure we're using the correct remaining term
    const remainingMonths = Math.min(
      schedule.length - afterPayment,
      Math.ceil((schedule.length / 12) * 12) - afterPayment // Ensure we don't exceed the original term
    );
    
    remainingSchedule = calculateReducedPaymentSchedule(
      remainingBalance,
      interestRatePeriods,
      remainingMonths,
      schedule[0].monthlyPayment,
      afterPayment + 1
    );
  }

  // Combine schedules
  const newSchedule = [
    ...preOverpaymentSchedule,
    overpaymentMonth,
    ...remainingSchedule
  ];

  // For reduce payment, pad schedule if needed
  if (effect === 'reducePayment' && newSchedule.length < schedule.length) {
    const lastPayment = newSchedule[newSchedule.length - 1];
    while (newSchedule.length < schedule.length) {
      newSchedule.push({
        ...lastPayment,
        payment: newSchedule.length + 1,
        monthlyPayment: 0,
        principalPayment: 0,
        interestPayment: 0,
        balance: 0,
        isOverpayment: false,
        overpaymentAmount: 0
      });
    }
  }

  // Recalculate totalInterest for all payments
  let cumulativeInterest = 0;
  for (const payment of newSchedule) {
    cumulativeInterest += payment.interestPayment;
    payment.totalInterest = roundToCents(cumulativeInterest);
  }

  // Calculate the actual term based on payments with positive balances
  const actualTerm = newSchedule.filter(p => p.balance > 0 || p.principalPayment > 0).length / 12;

  return {
    monthlyPayment: effect === 'reduceTerm'
      ? schedule[0].monthlyPayment
      : remainingSchedule[0].monthlyPayment,
    totalInterest: cumulativeInterest,
    amortizationSchedule: newSchedule,
    yearlyData: aggregateYearlyData(newSchedule),
    originalTerm: schedule.length / 12,
    actualTerm: actualTerm
  };
}

/**
 * Calculate a schedule with reduced term (same payment amount)
 */
/**
 * Calculate a schedule with reduced term using parameter object
 */
export function calculateReducedTermSchedule(params: ReducedTermParams): PaymentData[];

/**
 * Calculate a schedule with reduced term with individual parameters (backward compatibility)
 */
export function calculateReducedTermSchedule(
  balance: number,
  interestRatePeriods: { startMonth: number; interestRate: number; }[],
  monthlyPayment: number,
  startPaymentNumber: number
): PaymentData[];

/**
 * Implementation that handles both parameter object and individual parameters
 */
export function calculateReducedTermSchedule(
  balanceOrParams: number | ReducedTermParams,
  interestRatePeriods?: { startMonth: number; interestRate: number; }[],
  monthlyPayment?: number,
  startPaymentNumber?: number
): PaymentData[] {
  // Handle parameter object
  if (typeof balanceOrParams === 'object') {
    const params = balanceOrParams;
    return calculateReducedTermScheduleImpl(
      params.balance,
      params.interestRatePeriods,
      params.monthlyPayment,
      params.startPaymentNumber
    );
  }
  
  // Handle individual parameters
  return calculateReducedTermScheduleImpl(
    balanceOrParams,
    interestRatePeriods!,
    monthlyPayment!,
    startPaymentNumber!
  );
}

/**
 * Implementation of reduced term schedule calculation
 */
function calculateReducedTermScheduleImpl(
  balance: number,
  interestRatePeriods: { startMonth: number; interestRate: number; }[],
  monthlyPayment: number,
  startPaymentNumber: number
): PaymentData[] {
  const result: PaymentData[] = [];
  let remainingBalance = balance;
  let payment = startPaymentNumber;
  
  // Sort interest rate periods to ensure they're applied in chronological order
  const sortedRatePeriods = [...interestRatePeriods].sort((a, b) => a.startMonth - b.startMonth);
  
  // Safety check to prevent infinite loops
  const maxIterations = 600; // 50 years
  let iterations = 0;
  
  while (remainingBalance > 0.01 && iterations < maxIterations) {
    iterations++;
    payment++;
    
    // Determine the interest rate for the current payment
    let currentInterestRate = 0;
    for (const period of sortedRatePeriods) {
      if (payment >= period.startMonth) {
        currentInterestRate = period.interestRate;
      }
    }
    
    const monthlyRate = currentInterestRate / 100 / 12;
    const interestPayment = roundToCents(remainingBalance * monthlyRate);
    let principalPayment = roundToCents(monthlyPayment - interestPayment);
    let currentPayment = monthlyPayment;
    
    // Handle final payment or low balance
    if (remainingBalance < principalPayment || iterations === maxIterations - 1) {
      principalPayment = remainingBalance;
      currentPayment = roundToCents(principalPayment + interestPayment);
      remainingBalance = 0;
    } else {
      remainingBalance = roundToCents(remainingBalance - principalPayment);
    }
    
    result.push({
      payment,
      monthlyPayment: currentPayment,
      principalPayment,
      interestPayment,
      balance: remainingBalance,
      isOverpayment: false,
      overpaymentAmount: 0,
      totalInterest: 0,
      totalPayment: currentPayment
    });
    
    // Break early if balance is effectively zero
    if (remainingBalance < 0.01) {
      break;
    }
  }
  
  return result;
}

/**
 * Calculate a schedule with reduced payment (same term)
 */
/**
 * Calculate a schedule with reduced payment using parameter object
 */
export function calculateReducedPaymentSchedule(params: ReducedPaymentParams): PaymentData[];

/**
 * Calculate a schedule with reduced payment with individual parameters (backward compatibility)
 */
export function calculateReducedPaymentSchedule(
  balance: number,
  interestRatePeriods: { startMonth: number; interestRate: number; }[],
  remainingMonths: number,
  originalPayment: number,
  startPaymentNumber: number
): PaymentData[];

/**
 * Implementation that handles both parameter object and individual parameters
 */
export function calculateReducedPaymentSchedule(
  balanceOrParams: number | ReducedPaymentParams,
  interestRatePeriods?: { startMonth: number; interestRate: number; }[],
  remainingMonths?: number,
  originalPayment?: number,
  startPaymentNumber?: number
): PaymentData[] {
  // Handle parameter object
  if (typeof balanceOrParams === 'object') {
    const params = balanceOrParams;
    return calculateReducedPaymentScheduleImpl(
      params.balance,
      params.interestRatePeriods,
      params.remainingMonths,
      params.originalPayment,
      params.startPaymentNumber
    );
  }
  
  // Handle individual parameters
  return calculateReducedPaymentScheduleImpl(
    balanceOrParams,
    interestRatePeriods!,
    remainingMonths!,
    originalPayment!,
    startPaymentNumber!
  );
}

/**
 * Implementation of reduced payment schedule calculation
 */
function calculateReducedPaymentScheduleImpl(
  balance: number,
  interestRatePeriods: { startMonth: number; interestRate: number; }[],
  remainingMonths: number,
  originalPayment: number,
  startPaymentNumber: number
): PaymentData[] {
  const schedule: PaymentData[] = [];
  let remainingBalance = balance;

  // Sort interest rate periods to ensure they're applied in chronological order
  const sortedRatePeriods = [...interestRatePeriods].sort((a, b) => a.startMonth - b.startMonth);
  
  // Find the initial interest rate for the start payment
  let initialInterestRate = 0;
  for (const period of sortedRatePeriods) {
    if (startPaymentNumber >= period.startMonth) {
      initialInterestRate = period.interestRate;
    }
  }
  
  // Calculate the initial monthly rate and new payment amount
  const initialMonthlyRate = initialInterestRate / 100 / 12;
  
  // Calculate the new monthly payment based on the reduced balance
  // This should be less than the original payment
  const newMonthlyPayment = calculateBaseMonthlyPayment(
    remainingBalance,
    initialMonthlyRate,
    remainingMonths
  );
  
  // Track future interest rate changes that will affect the schedule
  const futureRateChanges = sortedRatePeriods
    .filter(period => period.startMonth > startPaymentNumber)
    .sort((a, b) => a.startMonth - b.startMonth);
  
  // Generate the payment schedule
  for (let i = 0; i < remainingMonths && remainingBalance > 0.01; i++) {
    const payment = startPaymentNumber + i;
    
    // Determine the interest rate for the current payment
    let currentInterestRate = initialInterestRate;
    for (const period of sortedRatePeriods) {
      if (payment >= period.startMonth) {
        currentInterestRate = period.interestRate;
      }
    }
    
    const monthlyRate = currentInterestRate / 100 / 12;
    const interestPayment = roundToCents(remainingBalance * monthlyRate);
    
    // Use the fixed monthly payment amount calculated at the beginning
    let principalPayment = roundToCents(newMonthlyPayment - interestPayment);
    let currentPayment = newMonthlyPayment;

    // Handle final payment or low balance
    if (remainingBalance < principalPayment) {
      principalPayment = remainingBalance;
      currentPayment = roundToCents(principalPayment + interestPayment);
      remainingBalance = 0;
    } else {
      remainingBalance = roundToCents(remainingBalance - principalPayment);
    }

    schedule.push({
      payment,
      monthlyPayment: currentPayment,
      principalPayment,
      interestPayment,
      balance: remainingBalance,
      isOverpayment: false,
      overpaymentAmount: 0,
      totalInterest: 0,
      totalPayment: currentPayment
    });
  }

  return schedule;
}

/**
 * Create the final result object for an overpayment calculation
 */
/**
 * Create the final result object using parameter object
 */
export function createFinalOverpaymentResult(params: FinalOverpaymentResultParams): {
  newCalculation: CalculationResults,
  timeOrPaymentSaved: number
};

/**
 * Create the final result object with individual parameters (backward compatibility)
 * @deprecated Use parameter object version instead
 */
export function createFinalOverpaymentResult(
  schedule: PaymentData[],
  monthlyPayment: number,
  originalLength: number,
  savingsAmount: number
): {
  newCalculation: CalculationResults,
  timeOrPaymentSaved: number
};

/**
 * Implementation that handles both parameter object and individual parameters
 */
export function createFinalOverpaymentResult(
  scheduleOrParams: PaymentData[] | FinalOverpaymentResultParams,
  monthlyPayment?: number,
  originalLength?: number,
  savingsAmount?: number
): {
  newCalculation: CalculationResults,
  timeOrPaymentSaved: number
} {
  // Handle parameter object
  if (!Array.isArray(scheduleOrParams)) {
    const params = scheduleOrParams;
    return createFinalOverpaymentResultImpl(
      params.schedule,
      params.monthlyPayment,
      params.originalLength,
      params.savingsAmount
    );
  }
  
  // Handle individual parameters
  return createFinalOverpaymentResultImpl(
    scheduleOrParams,
    monthlyPayment!,
    originalLength!,
    savingsAmount!
  );
}

/**
 * Implementation of final overpayment result creation
 */
function createFinalOverpaymentResultImpl(
  schedule: PaymentData[],
  monthlyPayment: number,
  originalLength: number,
  savingsAmount: number
): {
  newCalculation: CalculationResults,
  timeOrPaymentSaved: number
} {
  // Recalculate totalInterest field
  let runningInterest = 0;
  for (let i = 0; i < schedule.length; i++) {
    runningInterest += schedule[i].interestPayment;
    schedule[i].totalInterest = roundToCents(runningInterest);
  }

  const totalInterest = schedule.reduce((sum: number, p: PaymentData) => sum + p.interestPayment, 0);
  const yearlyData = aggregateYearlyData(schedule);

  return {
    newCalculation: {
      monthlyPayment,
      totalInterest,
      amortizationSchedule: schedule,
      yearlyData,
      originalTerm: originalLength / 12,
      actualTerm: schedule.length / 12
    },
    timeOrPaymentSaved: savingsAmount
  };
}

/**
 * Check if an overpayment applies in a given month
 */
/**
 * Check if an overpayment applies using parameter object
 */
export function isOverpaymentApplicable(params: OverpaymentApplicableParams): boolean;

/**
 * Check if an overpayment applies with individual parameters (backward compatibility)
 * @deprecated Use parameter object version instead
 */
export function isOverpaymentApplicable(
  overpayment: OverpaymentDetails,
  month: number,
  loanStartDate?: Date
): boolean;

/**
 * Implementation that handles both parameter object and individual parameters
 */
export function isOverpaymentApplicable(
  overpaymentOrParams: OverpaymentDetails | OverpaymentApplicableParams,
  month?: number,
  loanStartDate?: Date
): boolean {
  // Handle parameter object
  if ('overpayment' in overpaymentOrParams) {
    const params = overpaymentOrParams;
    return isOverpaymentApplicableImpl(
      params.overpayment,
      params.month,
      params.loanStartDate
    );
  }
  
  // Handle individual parameters
  return isOverpaymentApplicableImpl(
    overpaymentOrParams,
    month!,
    loanStartDate
  );
}

/**
 * Implementation of overpayment applicability check
 */
/**
 * Original implementation of isOverpaymentApplicable
 */
function isOverpaymentApplicableImpl(
  overpayment: OverpaymentDetails,
  month: number,
  loanStartDate?: Date
): boolean {
  // Get the startMonth and endMonth
  let startMonth = overpayment.startMonth;
  let endMonth = overpayment.endMonth;

  // If startMonth is not explicitly provided but we have date-based overpayment and loan start date
  if (startMonth === undefined && overpayment.startDate && loanStartDate) {
    // Calculate months difference between loan start date and overpayment start date
    startMonth = (overpayment.startDate.getFullYear() - loanStartDate.getFullYear()) * 12 +
      (overpayment.startDate.getMonth() - loanStartDate.getMonth());

    // If we have an end date but no explicit endMonth, calculate end month as well
    if (overpayment.endDate && endMonth === undefined) {
      endMonth = (overpayment.endDate.getFullYear() - loanStartDate.getFullYear()) * 12 +
        (overpayment.endDate.getMonth() - loanStartDate.getMonth());
    }
  }

  // Ensure we have valid startMonth (default to 0 if undefined)
  startMonth = startMonth ?? 0;

  // Check if month is within the valid range
  if (month < startMonth) return false;
  if (endMonth && month > endMonth) return false;

  // For one-time payments, only apply at the exact start month
  if (!overpayment.isRecurring || overpayment.frequency === 'one-time') return month === startMonth;

  // For recurring payments, apply based on frequency
  if (overpayment.frequency === "monthly") {
    return month >= startMonth && (!endMonth || month <= endMonth); // Apply every month within the range
  }

  if (overpayment.frequency === "quarterly") {
    // Apply at start month and every 3 months after
    return month === startMonth || ((month - startMonth) % 3 === 0 && month > startMonth);
  }

  if (overpayment.frequency === "annual") {
    // Apply at start month and every 12 months after
    return month === startMonth || ((month - startMonth) % 12 === 0 && month > startMonth);
  }

  return false;
}


/**
 * Apply multiple overpayments to a schedule
 */
/**
 * Apply multiple overpayments using parameter object
 */
export function applyMultipleOverpayments(params: MultipleOverpaymentParams): PaymentData[];

/**
 * Apply multiple overpayments with individual parameters (backward compatibility)
 */
export function applyMultipleOverpayments(
  schedule: PaymentData[],
  overpayments: OverpaymentDetails[],
  loanStartDate?: Date,
  loanDetails?: LoanDetails
): PaymentData[];

/**
 * Implementation that handles both parameter object and individual parameters
 */
export function applyMultipleOverpayments(
  scheduleOrParams: PaymentData[] | MultipleOverpaymentParams,
  overpayments?: OverpaymentDetails[],
  loanStartDate?: Date,
  loanDetails: LoanDetails = {principal: 0, interestRatePeriods: [], loanTerm: 0, overpaymentPlans: [], startDate: new Date(), name: ''}
): PaymentData[] {
  // Handle parameter object
  if (!Array.isArray(scheduleOrParams)) {
    const params = scheduleOrParams;
    return performOverpayments(
      params.schedule,
      params.overpayments,
      params.loanStartDate,
      params.loanDetails
    );
  }
  
  // Handle individual parameters
  return performOverpayments(
    scheduleOrParams,
    overpayments!,
    loanStartDate,
    loanDetails
  );
}

/**
 * Apply all overpayments in one pass
 */
/**
 * Apply all overpayments in one pass using parameter object
 */
export function performOverpayments(params: MultipleOverpaymentParams): PaymentData[];

/**
 * Apply all overpayments in one pass with individual parameters (backward compatibility)
 */
export function performOverpayments(
  schedule: PaymentData[],
  overpayments: OverpaymentDetails[],
  loanStartDate?: Date,
  loanDetails?: LoanDetails
): PaymentData[];

/**
 * Implementation that handles both parameter object and individual parameters
 */
export function performOverpayments(
  scheduleOrParams: PaymentData[] | MultipleOverpaymentParams,
  overpayments?: OverpaymentDetails[],
  loanStartDate?: Date,
  loanDetails: LoanDetails = {principal: 0, interestRatePeriods: [], loanTerm: 0, overpaymentPlans: [], startDate: new Date(), name: ''}
): PaymentData[] {
  // Handle parameter object
  if (!Array.isArray(scheduleOrParams)) {
    const params = scheduleOrParams;
    return performOverpaymentsImpl(
      params.schedule,
      params.overpayments,
      params.loanStartDate,
      params.loanDetails
    );
  }
  
  // Handle individual parameters
  return performOverpaymentsImpl(
    scheduleOrParams,
    overpayments!,
    loanStartDate,
    loanDetails
  );
}

/**
 * Implementation of applying all overpayments in one pass
 */
function performOverpaymentsImpl(
  schedule: PaymentData[],
  overpayments: OverpaymentDetails[],
  loanStartDate?: Date,
  loanDetails: LoanDetails = {principal: 0, interestRatePeriods: [], loanTerm: 0, overpaymentPlans: [], startDate: new Date(), name: ''}
): PaymentData[] {
  if (!overpayments.length) return schedule;

  try {
    let current = [...schedule];
    let progressStep = 0;

    // Find last payment with positive balance
    const lastActivePayment = current.findIndex(p => p.balance <= 0);
    const effectiveLength = lastActivePayment === -1 ? current.length : lastActivePayment + 1;

    // Group overpayments by month to handle multiple overpayments in the same month efficiently
    const overpaymentsByMonth = new Map<number, OverpaymentDetails[]>();
    
    // Process and sort overpayments
    for (let m = 1; m <= effectiveLength; m++) {
      const applicableOps = overpayments.filter(op => isOverpaymentApplicable({
        overpayment: op,
        month: m,
        loanStartDate: loanStartDate
      }));
      if (applicableOps.length > 0) {
        overpaymentsByMonth.set(m, applicableOps);
      }
      
    }
    
    // Sort months in ascending order to apply overpayments chronologically
    const sortedMonths = Array.from(overpaymentsByMonth.keys()).sort((a, b) => a - b);
    
    // Update progress after sorting
    
    // Apply overpayments month by month
    for (let i = 0; i < sortedMonths.length; i++) {
      const month = sortedMonths[i];
      
      // Stop if loan is already paid off
      if (!current[month - 1] || current[month - 1].balance <= 0) {
        break;
      }
      
      const applicableOps = overpaymentsByMonth.get(month) || [];
      if (applicableOps.length) {
        const totalAmount = applicableOps.reduce((sum, op) => sum + op.amount, 0);
        
        // Determine the effect to use (prioritize term reduction if mixed)
        let effect: 'reduceTerm' | 'reducePayment' = 'reduceTerm';
        
        // If all overpayments have the same effect, use that effect
        if (applicableOps.every(op => op.effect === 'reducePayment')) {
          effect = 'reducePayment';
        }
        
        try {
          // Ensure we don't overpay more than remaining balance
          const maxOverpayment = current[month - 1].balance;
          const safeAmount = Math.min(totalAmount, maxOverpayment);
          
          // Create a proper loan details object with the current interest rate periods
          const currentLoanDetails = {
            ...loanDetails,
            // Ensure we're using the most up-to-date interest rate periods
            interestRatePeriods: loanDetails.interestRatePeriods
          };
          
          const result = applyOverpayment(current, safeAmount, month, currentLoanDetails, effect);
          current = result.amortizationSchedule;
        } catch (error) {
          console.error(`Error applying overpayment at month ${month}:`, error);
          break;
        }
      }
      
      // Update progress after each overpayment application
    }

    // Recalculate totalInterest for the entire schedule at the end
    let cumulativeInterest = 0;
    for (let i = 0; i < current.length; i++) {
      cumulativeInterest += current[i].interestPayment;
      current[i].totalInterest = roundToCents(cumulativeInterest);      
    }

    
    return current;
  } finally {

  };
}

/**
 * Aggregate monthly payment data into yearly summaries for display
 */
/**
 * Original implementation of aggregateYearlyData
 */
export function aggregateYearlyData(schedule: PaymentData[]): YearlyData[] {
  if (!schedule.length) return [];

  return schedule.reduce((acc: YearlyData[], month: PaymentData, idx: number) => {
    const yearIndex = Math.floor(idx / 12);
    if (!acc[yearIndex]) {
      acc[yearIndex] = {
        year: yearIndex + 1,
        principal: 0,
        interest: 0,
        payment: 0,
        balance: 0,
        totalInterest: 0
      };
    }
    acc[yearIndex].principal = roundToCents(acc[yearIndex].principal + month.principalPayment);
    acc[yearIndex].interest = roundToCents(acc[yearIndex].interest + month.interestPayment);
    acc[yearIndex].payment = roundToCents(acc[yearIndex].payment + month.monthlyPayment);
    acc[yearIndex].balance = month.balance;
    acc[yearIndex].totalInterest = roundToCents(acc[yearIndex].totalInterest + month.interestPayment);
    return acc;
  }, []);
}


/**
 * Recalculate an amortization schedule from a given balance using a new interest rate and term
 */
/**
 * Recalculate schedule with new rate using parameter object
 */
export function recalculateScheduleWithNewRate(params: RecalculateWithNewRateParams): PaymentData[];

/**
 * Recalculate schedule with new rate with individual parameters (backward compatibility)
 * @deprecated Use parameter object version instead
 */
export function recalculateScheduleWithNewRate(
  startingBalance: number,
  annualInterestRate: number, // as percentage (e.g., 5 for 5%)
  remainingTermInYears: number
): PaymentData[];

/**
 * Implementation that handles both parameter object and individual parameters
 */
export function recalculateScheduleWithNewRate(
  startingBalanceOrParams: number | RecalculateWithNewRateParams,
  annualInterestRate?: number,
  remainingTermInYears?: number
): PaymentData[] {
  // Handle parameter object
  if (typeof startingBalanceOrParams === 'object') {
    const params = startingBalanceOrParams;
    return recalculateScheduleWithNewRateImpl(
      params.startingBalance,
      params.annualInterestRate,
      params.remainingTermInYears
    );
  }
  
  // Handle individual parameters
  return recalculateScheduleWithNewRateImpl(
    startingBalanceOrParams,
    annualInterestRate!,
    remainingTermInYears!
  );
}

/**
 * Implementation of schedule recalculation with new rate
 */
function recalculateScheduleWithNewRateImpl(
  startingBalance: number,
  annualInterestRate: number,
  remainingTermInYears: number
): PaymentData[] {
  const monthlyRate = annualInterestRate / 100 / 12;
  const totalMonths = Math.round(remainingTermInYears * 12);

  // Use calculateBaseMonthlyPayment directly from calculationCore.ts
  const newMonthlyPayment = calculateBaseMonthlyPayment(
    startingBalance,
    monthlyRate,
    totalMonths
  );

  const newSchedule: PaymentData[] = [];
  let balance = startingBalance;

  for (let i = 0; i < totalMonths && balance > 0.01; i++) {
    const payment = i + 1;
    const interestPayment = roundToCents(balance * monthlyRate);
    let principalPayment = roundToCents(newMonthlyPayment - interestPayment);
    let monthlyPayment = newMonthlyPayment;

    if (principalPayment > balance || i === totalMonths - 1) {
      principalPayment = roundToCents(balance);
      monthlyPayment = roundToCents(principalPayment + interestPayment);
      balance = 0;
    } else {
      balance = roundToCents(balance - principalPayment);
    }

    newSchedule.push({
      payment,
      monthlyPayment,
      principalPayment,
      interestPayment,
      balance,
      isOverpayment: false,
      overpaymentAmount: 0,
      totalInterest: 0,
      totalPayment: monthlyPayment
    });
  }

  return newSchedule;
}

/**
 * Handle rate changes during the loan term
 */
export function applyRateChange(params: RateChangeParams): PaymentData[];

/**
 * Handle rate changes during the loan term with individual parameters (backward compatibility)
 */
export function applyRateChange(
  originalSchedule: PaymentData[],
  changeAtMonth: number,
  newRate: number,
  remainingTerm?: number
): PaymentData[];

/**
 * Implementation that handles both parameter object and individual parameters
 */
export function applyRateChange(
  scheduleOrParams: PaymentData[] | RateChangeParams,
  changeAtMonth?: number,
  newRate?: number,
  remainingTerm?: number
): PaymentData[] {
  // Handle parameter object
  if (!Array.isArray(scheduleOrParams)) {
    const params = scheduleOrParams;
    return applyRateChangeImpl(
      params.schedule,
      params.changeAtMonth,
      params.newRate,
      params.remainingTerm
    );
  }
  
  // Handle individual parameters
  return applyRateChangeImpl(
    scheduleOrParams,
    changeAtMonth!,
    newRate!,
    remainingTerm
  );
}

/**
 * Implementation of rate change application
 */
function applyRateChangeImpl(
  originalSchedule: PaymentData[],
  changeAtMonth: number,
  newRate: number,
  remainingTerm?: number
): PaymentData[] {
  if (changeAtMonth <= 0 || changeAtMonth >= originalSchedule.length) {
    throw new Error(`Invalid month for rate change: ${changeAtMonth}`);
  }

  // Get the balance at the change point
  const remainingBalance = roundToCents(originalSchedule[changeAtMonth].balance);
  // Calculate term in years
  const monthsLeft = originalSchedule.length - changeAtMonth;
  const termYears = (remainingTerm !== undefined) ? remainingTerm : monthsLeft / 12;

  // Calculate the new schedule
  const newTail = recalculateScheduleWithNewRate(remainingBalance, newRate, termYears);

  // Combine head and tail
  const combined = [
    ...originalSchedule.slice(0, changeAtMonth),
    ...newTail.map(p => ({ ...p, payment: p.payment + changeAtMonth }))
  ];

  // Recalculate totalInterest
  let runningInterest = combined[changeAtMonth - 1].totalInterest;
  for (let i = changeAtMonth; i < combined.length; i++) {
    runningInterest += combined[i].interestPayment;
    combined[i].totalInterest = roundToCents(runningInterest);
  }

  return combined;
}

/**
 * Apply a series of rate changes in chronological order
 */
export function performRateChanges(params: MultipleRateChangeParams): PaymentData[];

/**
 * Apply a series of rate changes with individual parameters (backward compatibility)
 */
export function performRateChanges(
  schedule: PaymentData[],
  rateChanges: Array<{ month: number; newRate: number }>
): PaymentData[];

/**
 * Implementation that handles both parameter object and individual parameters
 */
export function performRateChanges(
  scheduleOrParams: PaymentData[] | MultipleRateChangeParams,
  rateChanges?: Array<{ month: number; newRate: number }>
): PaymentData[] {
  // Handle parameter object
  if (!Array.isArray(scheduleOrParams)) {
    const params = scheduleOrParams;
    return performRateChangesImpl(
      params.schedule,
      params.rateChanges
    );
  }
  
  // Handle individual parameters
  return performRateChangesImpl(
    scheduleOrParams,
    rateChanges!
  );
}

/**
 * Implementation of applying multiple rate changes
 */
function performRateChangesImpl(
  schedule: PaymentData[],
  rateChanges: Array<{ month: number; newRate: number }>
): PaymentData[] {
  const sorted = [...rateChanges].sort((a, b) => a.month - b.month);
  let current = schedule;

  for (const { month, newRate } of sorted) {
    current = applyRateChange(current, month, newRate);
  }

  return current;
}

/**
 * Calculate complex scenario with rate changes and overpayments
 */
export function calculateComplexScenario(params: ComplexScenarioParams): CalculationResults;

/**
 * Calculate complex scenario with individual parameters (backward compatibility)
 */
export function calculateComplexScenario(
  loanDetails: LoanDetails,
  rateChanges: Array<{ month: number; newRate: number }>,
  overpayments: OverpaymentDetails[]
): CalculationResults;

/**
 * Implementation that handles both parameter object and individual parameters
 */
export function calculateComplexScenario(
  loanDetailsOrParams: LoanDetails | ComplexScenarioParams,
  rateChanges?: Array<{ month: number; newRate: number }>,
  overpayments?: OverpaymentDetails[]
): CalculationResults {
  // Handle parameter object
  if ('loanDetails' in loanDetailsOrParams) {
    const params = loanDetailsOrParams;
    return calculateComplexScenarioImpl(
      params.loanDetails,
      params.rateChanges,
      params.overpayments
    );
  }
  
  // Handle individual parameters
  return calculateComplexScenarioImpl(
    loanDetailsOrParams,
    rateChanges!,
    overpayments!
  );
}

/**
 * Implementation of complex scenario calculation
 */
function calculateComplexScenarioImpl(
  loanDetails: LoanDetails,
  rateChanges: Array<{ month: number; newRate: number }>,
  overpayments: OverpaymentDetails[]
): CalculationResults {
  // Import here to avoid circular dependency
  const { calculateLoanDetails } = require('./calculationEngine');
  
  // Get base schedule without overpayments
  const base = calculateLoanDetails(
    loanDetails.principal,
    loanDetails.interestRatePeriods,
    loanDetails.loanTerm,
    undefined,
    loanDetails.repaymentModel,
    loanDetails.additionalCosts,
    undefined, // Don't apply overpayments yet
    loanDetails.startDate,
    loanDetails
  );
  
  // Apply rate changes first
  const afterRates = performRateChanges(base.amortizationSchedule, rateChanges);
  
  // Then apply overpayments
  const afterAll = performOverpayments(afterRates, overpayments, loanDetails.startDate, loanDetails);
  
  // Build final results
  return finalizeResults({
    schedule: afterAll,
    originalTerm: loanDetails.loanTerm
  });
}

/**
 * Turn a raw schedule into final results
 */
/**
 * Turn a raw schedule into final results using parameter object
 */
export function finalizeResults(params: FinalizeResultsParams): CalculationResults;

/**
 * Turn a raw schedule into final results with individual parameters (backward compatibility)
 * @deprecated Use parameter object version instead
 */
export function finalizeResults(
  schedule: PaymentData[],
  originalTerm: number
): CalculationResults;

/**
 * Implementation that handles both parameter object and individual parameters
 */
export function finalizeResults(
  scheduleOrParams: PaymentData[] | FinalizeResultsParams,
  originalTerm?: number
): CalculationResults {
  // Handle parameter object
  if (!Array.isArray(scheduleOrParams)) {
    const params = scheduleOrParams;
    return finalizeResultsImpl(
      params.schedule,
      params.originalTerm
    );
  }
  
  // Handle individual parameters
  return finalizeResultsImpl(
    scheduleOrParams,
    originalTerm!
  );
}

/**
 * Implementation of finalizing results
 */
function finalizeResultsImpl(
  schedule: PaymentData[],
  originalTerm: number
): CalculationResults {
  const totalInterest = schedule.reduce((sum, p) => sum + p.interestPayment, 0);
  const yearlyData = aggregateYearlyData(schedule);

  const lastPayment = schedule.find(p => p.balance === 0);
  const actualTerm = lastPayment
    ? lastPayment.payment / 12
    : schedule.length / 12;

  return {
    monthlyPayment: schedule[0]?.monthlyPayment || 0,
    totalInterest: totalInterest,
    amortizationSchedule: schedule,
    yearlyData: yearlyData,
    originalTerm: originalTerm,
    actualTerm: actualTerm
  };
}