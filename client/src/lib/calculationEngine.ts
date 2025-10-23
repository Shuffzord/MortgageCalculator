// calculationEngine.ts
import {
  CalculationResults,
  PaymentData,
  OverpaymentDetails,
  YearlyData,
  LoanDetails,
  RepaymentModel,
  AdditionalCosts,
  FeeType,
  APRCalculationParams,
  LoanCalculationParams,
  DecreasingInstallmentParams,
  OneTimeFeesParams,
  RecurringFeesParams,
  MonthlyPaymentParams,
  ConvertScheduleParams,
  ConvertScheduleWithFeesParams,
} from './types';
import { validateInputs } from './validation';
import { generateAmortizationSchedule } from './utils';
// Re-export for use by other modules
export { generateAmortizationSchedule };
import { formatCurrency } from './formatters';
import {
  convertScheduleFormat,
  calculateBaseMonthlyPayment,
  roundToCents,
} from './calculationCore';
import {
  applyOverpayment,
  applyMultipleOverpayments,
  calculateReducedTermSchedule,
  calculateReducedPaymentSchedule,
  isOverpaymentApplicable,
  performOverpayments,
  finalizeResults,
  aggregateYearlyData,
  recalculateScheduleWithNewRate,
  applyRateChange,
  performRateChanges,
  calculateComplexScenario,
} from './overpaymentCalculator';

/**
 * Calculate monthly payment for decreasing installments model
 * In this model, the principal portion remains constant and the interest portion decreases over time
 */
/**
 * Calculate monthly payment for decreasing installments model using parameter object
 */
export function calculateDecreasingInstallment(params: DecreasingInstallmentParams): number;

/**
 * Calculate monthly payment for decreasing installments model with individual parameters (backward compatibility)
 * @deprecated Use parameter object version instead
 */
export function calculateDecreasingInstallment(
  principal: number,
  monthlyRate: number,
  totalMonths: number,
  currentMonth: number
): number;

/**
 * Implementation that handles both parameter object and individual parameters
 */
export function calculateDecreasingInstallment(
  principalOrParams: number | DecreasingInstallmentParams,
  monthlyRate?: number,
  totalMonths?: number,
  currentMonth?: number
): number {
  // Handle parameter object
  if (typeof principalOrParams === 'object') {
    const params = principalOrParams;
    return calculateDecreasingInstallmentImpl(
      params.principal,
      params.monthlyRate,
      params.totalMonths,
      params.currentMonth
    );
  }

  // Handle individual parameters
  return calculateDecreasingInstallmentImpl(
    principalOrParams,
    monthlyRate!,
    totalMonths!,
    currentMonth!
  );
}

/**
 * Implementation of decreasing installment calculation
 */
function calculateDecreasingInstallmentImpl(
  principal: number,
  monthlyRate: number,
  totalMonths: number,
  currentMonth: number
): number {
  // Fixed principal portion
  const principalPortion = principal / totalMonths;

  // Remaining balance after previous payments
  const remainingBalance = principal - principalPortion * (currentMonth - 1);

  // Interest portion based on remaining balance
  const interestPortion = remainingBalance * monthlyRate;

  // Total payment for this month
  return roundToCents(principalPortion + interestPortion);
}

/**
 * Calculate one-time fees
 */
/**
 * Calculate one-time fees using parameter object
 */
export function calculateOneTimeFees(params: OneTimeFeesParams): number;

/**
 * Calculate one-time fees with individual parameters (backward compatibility)
 * @deprecated Use parameter object version instead
 */
export function calculateOneTimeFees(principal: number, additionalCosts?: AdditionalCosts): number;

/**
 * Implementation that handles both parameter object and individual parameters
 */
export function calculateOneTimeFees(
  principalOrParams: number | OneTimeFeesParams,
  additionalCosts?: AdditionalCosts
): number {
  // Handle parameter object
  if (typeof principalOrParams === 'object') {
    const params = principalOrParams;
    return calculateOneTimeFeesImpl(params.principal, params.additionalCosts);
  }

  // Handle individual parameters
  return calculateOneTimeFeesImpl(principalOrParams, additionalCosts);
}

/**
 * Implementation of one-time fees calculation
 */
function calculateOneTimeFeesImpl(principal: number, additionalCosts?: AdditionalCosts): number {
  if (!additionalCosts) return 0;

  let totalFees = 0;

  // Origination fee
  if (additionalCosts.originationFeeType === 'fixed') {
    totalFees += additionalCosts.originationFee;
  } else {
    totalFees += (principal * additionalCosts.originationFee) / 100;
  }

  return roundToCents(totalFees);
}

/**
 * Calculate recurring fees for a specific payment
 */
/**
 * Calculate recurring fees using parameter object
 */
export function calculateRecurringFees(params: RecurringFeesParams): number;

/**
 * Calculate recurring fees with individual parameters (backward compatibility)
 * @deprecated Use parameter object version instead
 */
export function calculateRecurringFees(
  remainingBalance: number,
  additionalCosts?: AdditionalCosts
): number;

/**
 * Implementation that handles both parameter object and individual parameters
 */
export function calculateRecurringFees(
  remainingBalanceOrParams: number | RecurringFeesParams,
  additionalCosts?: AdditionalCosts
): number {
  // Handle parameter object
  if (typeof remainingBalanceOrParams === 'object') {
    const params = remainingBalanceOrParams;
    return calculateRecurringFeesImpl(params.remainingBalance, params.additionalCosts);
  }

  // Handle individual parameters
  return calculateRecurringFeesImpl(remainingBalanceOrParams, additionalCosts);
}

/**
 * Implementation of recurring fees calculation
 */
function calculateRecurringFeesImpl(
  remainingBalance: number,
  additionalCosts?: AdditionalCosts
): number {
  if (!additionalCosts) return 0;

  let monthlyFees = 0;

  // Loan insurance
  if (additionalCosts.loanInsuranceType === 'fixed') {
    monthlyFees += additionalCosts.loanInsurance;
  } else {
    monthlyFees += (remainingBalance * additionalCosts.loanInsurance) / 100 / 12;
  }

  // Administrative fees
  if (additionalCosts.administrativeFeesType === 'fixed') {
    monthlyFees += additionalCosts.administrativeFees;
  } else {
    monthlyFees += (remainingBalance * additionalCosts.administrativeFees) / 100 / 12;
  }

  return roundToCents(monthlyFees);
}

/**
 * Calculate Annual Percentage Rate (APR)
 * Uses iterative approach to find the rate that makes the present value
 * of all cash flows equal to the initial loan amount
 */
/**
 * Calculate Annual Percentage Rate (APR) using parameter object
 */
export function calculateAPR(params: APRCalculationParams): number;

/**
 * Calculate Annual Percentage Rate (APR) with individual parameters (backward compatibility)
 */
export function calculateAPR(
  principal: number,
  monthlyPayment: number,
  loanTermMonths: number,
  oneTimeFees: number,
  recurringFees: number
): number;

/**
 * Implementation that handles both parameter object and individual parameters
 */
export function calculateAPR(
  principalOrParams: number | APRCalculationParams,
  monthlyPayment?: number,
  loanTermMonths?: number,
  oneTimeFees?: number,
  recurringFees?: number
): number {
  // Handle parameter object
  if (typeof principalOrParams === 'object') {
    const params = principalOrParams;
    return calculateAPRImpl(
      params.principal,
      params.monthlyPayment,
      params.loanTermMonths,
      params.oneTimeFees,
      params.recurringFees
    );
  }

  // Handle individual parameters
  return calculateAPRImpl(
    principalOrParams,
    monthlyPayment!,
    loanTermMonths!,
    oneTimeFees!,
    recurringFees!
  );
}

/**
 * Implementation of APR calculation
 * This is a computationally expensive function that uses an iterative approach
 */
function calculateAPRImpl(
  principal: number,
  monthlyPayment: number,
  loanTermMonths: number,
  oneTimeFees: number,
  recurringFees: number
): number {
  // Initial guess: standard interest rate + 1%
  let guess = 0.05;
  let step = 0.01;
  const tolerance = 0.0001;
  const maxIterations = 100;

  // Newton-Raphson method to find APR
  for (let i = 0; i < maxIterations; i++) {
    // Calculate present value with current guess
    let pv = 0;

    // Optimization: Pre-calculate the divisor for each month to avoid repeated calculations
    const monthlyFactor = 1 + guess / 12;
    let divisor = monthlyFactor;

    for (let month = 1; month <= loanTermMonths; month++) {
      // Use pre-calculated divisor instead of Math.pow for each iteration
      pv += (monthlyPayment + recurringFees) / divisor;
      divisor *= monthlyFactor; // Update for next month
    }

    // Calculate difference from principal
    const diff = pv - (principal - oneTimeFees);

    if (Math.abs(diff) < tolerance) {
      break;
    }

    // Adjust guess with adaptive step size for faster convergence
    if (diff > 0) {
      guess += step;
    } else {
      guess -= step;
    }

    // Reduce step size with a more aggressive factor for faster convergence
    step *= 0.8;
  }

  // Convert to annual percentage rate
  return roundToCents(guess * 12 * 100);
}

/**
 * Calculate loan details using parameter object
 */
export function calculateLoanDetails(params: LoanCalculationParams): CalculationResults;

/**
 * Calculate loan details with individual parameters (backward compatibility)
 */
export function calculateLoanDetails(
  principal: number,
  interestRatePeriods: { startMonth: number; interestRate: number }[],
  loanTerm: number,
  overpaymentPlan?: OverpaymentDetails,
  repaymentModel?: RepaymentModel,
  additionalCosts?: AdditionalCosts,
  overpaymentPlans?: OverpaymentDetails[],
  startDate?: Date,
  loanDetails?: LoanDetails
): CalculationResults;

/**
 * Implementation that handles both parameter object and individual parameters
 */
export function calculateLoanDetails(
  principalOrParams: number | LoanCalculationParams,
  interestRatePeriods?: { startMonth: number; interestRate: number }[],
  loanTerm?: number,
  overpaymentPlan?: OverpaymentDetails,
  repaymentModel?: RepaymentModel,
  additionalCosts?: AdditionalCosts,
  overpaymentPlans?: OverpaymentDetails[],
  startDate?: Date,
  loanDetails?: LoanDetails
): CalculationResults {
  // Handle parameter object
  if (typeof principalOrParams === 'object') {
    const params = principalOrParams;
    return calculateLoanDetailsImpl(
      params.principal,
      params.interestRatePeriods,
      params.loanTerm,
      undefined, // overpaymentPlan not used with params
      params.repaymentModel,
      params.additionalCosts,
      params.overpaymentPlans,
      params.startDate,
      params.loanDetails
    );
  }

  // Handle individual parameters
  return calculateLoanDetailsImpl(
    principalOrParams,
    interestRatePeriods!,
    loanTerm!,
    overpaymentPlan,
    repaymentModel,
    additionalCosts,
    overpaymentPlans,
    startDate,
    loanDetails
  );
}

/**
 * Implementation of loan details calculation
 */
function calculateLoanDetailsImpl(
  principal: number,
  interestRatePeriods: { startMonth: number; interestRate: number }[],
  loanTerm: number,
  overpaymentPlan?: OverpaymentDetails,
  repaymentModel?: RepaymentModel,
  additionalCosts?: AdditionalCosts,
  overpaymentPlans?: OverpaymentDetails[],
  startDate?: Date,
  loanDetails?: LoanDetails
): CalculationResults {
  // Set default values
  const actualRepaymentModel = repaymentModel || 'equalInstallments';
  const actualLoanDetails = loanDetails || {
    principal: 0,
    interestRatePeriods: [],
    loanTerm: 0,
    overpaymentPlans: [],
    startDate: new Date(),
    name: '',
  };
  if (principal === 0) {
    return {
      monthlyPayment: 0,
      totalInterest: 0,
      amortizationSchedule: [],
      yearlyData: [],
      originalTerm: loanTerm,
      actualTerm: 0,
    };
  }

  validateInputs(principal, interestRatePeriods, loanTerm, overpaymentPlan);

  // Calculate one-time fees
  const oneTimeFees = calculateOneTimeFees({
    principal: principal,
    additionalCosts: additionalCosts,
  });

  // Generate the initial amortization schedule without overpayments
  let rawSchedule = generateAmortizationSchedule(
    principal,
    interestRatePeriods,
    loanTerm,
    undefined, // No overpayment for initial schedule
    undefined, // overpaymentMonth (not used)
    undefined, // reduceTermNotPayment (not used)
    startDate, // Pass the start date
    actualRepaymentModel
  );

  // If there are overpayments, apply them
  if (overpaymentPlans && overpaymentPlans.length > 0) {
    // Create a proper loan details object for overpayment calculations
    const overpaymentLoanDetails: LoanDetails = {
      principal,
      interestRatePeriods,
      loanTerm,
      overpaymentPlans: overpaymentPlans,
      startDate: startDate || new Date(),
      name: actualLoanDetails.name || '',
      repaymentModel: actualRepaymentModel,
    };

    rawSchedule = applyMultipleOverpayments(
      rawSchedule,
      overpaymentPlans,
      startDate,
      overpaymentLoanDetails
    );
  } else if (overpaymentPlan) {
    // For backward compatibility
    const overpaymentLoanDetails: LoanDetails = {
      principal,
      interestRatePeriods,
      loanTerm,
      overpaymentPlans: [overpaymentPlan],
      startDate: startDate || new Date(),
      name: actualLoanDetails.name || '',
      repaymentModel: actualRepaymentModel,
    };

    rawSchedule = applyMultipleOverpayments(
      rawSchedule,
      [overpaymentPlan],
      startDate,
      overpaymentLoanDetails
    );
  }

  // Process the schedule and add fees
  const paymentData = convertAndProcessScheduleWithFees(rawSchedule, additionalCosts);
  const yearlyData = aggregateYearlyData(paymentData);

  // Calculate total recurring fees
  const recurringFees = paymentData.reduce((sum, payment) => sum + (payment.fees || 0), 0);

  // Calculate total interest from the payment data
  const totalInterest =
    paymentData.length > 0
      ? paymentData.reduce((sum, payment) => sum + payment.interestPayment, 0)
      : 0;

  // Calculate total cost (principal + interest + fees)
  const totalCost = principal + totalInterest + oneTimeFees + recurringFees;

  // Calculate APR if we have all the necessary data
  let apr;
  if (paymentData.length > 0) {
    apr = calculateAPR(
      principal,
      paymentData[0].monthlyPayment,
      loanTerm * 12,
      oneTimeFees,
      recurringFees / paymentData.length // average monthly recurring fees
    );
  }

  // Update loan details
  const updatedLoanDetails = {
    principal: principal,
    interestRatePeriods: interestRatePeriods,
    loanTerm: loanTerm,
    overpaymentPlans: overpaymentPlans || [],
    startDate: startDate || new Date(),
    name: actualLoanDetails.name || '',
    repaymentModel: actualRepaymentModel,
  };

  return {
    monthlyPayment: paymentData[0]?.monthlyPayment || 0,
    totalInterest: totalInterest,
    amortizationSchedule: paymentData,
    yearlyData: yearlyData,
    originalTerm: loanTerm,
    actualTerm: paymentData.length / 12,
    oneTimeFees: oneTimeFees,
    recurringFees: recurringFees,
    totalCost: totalCost,
    apr: apr,
  };
}

/**
 * Convert raw schedule to payment data and calculate cumulative interest
 */
/**
 * Convert raw schedule using parameter object
 */
export function convertAndProcessSchedule(params: ConvertScheduleParams): PaymentData[];

/**
 * Convert raw schedule with individual parameters (backward compatibility)
 * @deprecated Use parameter object version instead
 */
export function convertAndProcessSchedule(rawSchedule: any[]): PaymentData[];

/**
 * Implementation that handles both parameter object and individual parameters
 */
export function convertAndProcessSchedule(
  rawScheduleOrParams: any[] | ConvertScheduleParams
): PaymentData[] {
  // Handle parameter object
  if (!Array.isArray(rawScheduleOrParams)) {
    const params = rawScheduleOrParams;
    return convertAndProcessScheduleImpl(params.rawSchedule);
  }

  // Handle individual parameters
  return convertAndProcessScheduleImpl(rawScheduleOrParams);
}

/**
 * Implementation of schedule conversion and processing
 */
function convertAndProcessScheduleImpl(rawSchedule: any[]): PaymentData[] {
  // This function now uses convertScheduleFormat from calculationCore.ts
  const paymentData: PaymentData[] = rawSchedule.map((item) => {
    // Use the convertScheduleFormat function from calculationCore.ts
    const converted = convertScheduleFormat(item);
    return {
      payment: converted.payment || 0,
      isOverpayment: converted.isOverpayment,
      overpaymentAmount: converted.overpaymentAmount || 0,
      monthlyPayment: roundToCents(converted.monthlyPayment),
      interestPayment: roundToCents(converted.interestPayment),
      principalPayment: roundToCents(converted.principalPayment),
      balance: roundToCents(converted.balance),
      totalPayment: roundToCents(converted.totalPayment ?? converted.monthlyPayment),
      totalInterest: 0,
    };
  });

  // Calculate cumulative interest
  let cumulativeInterest = 0;
  for (const pd of paymentData) {
    cumulativeInterest += pd.interestPayment;
    pd.totalInterest = roundToCents(cumulativeInterest);
  }

  return paymentData;
}

/**
 * Convert raw schedule to payment data, calculate cumulative interest, and add fees
 */
/**
 * Convert raw schedule with fees using parameter object
 */
export function convertAndProcessScheduleWithFees(
  params: ConvertScheduleWithFeesParams
): PaymentData[];

/**
 * Convert raw schedule with fees with individual parameters (backward compatibility)
 * @deprecated Use parameter object version instead
 */
export function convertAndProcessScheduleWithFees(
  rawSchedule: any[],
  additionalCosts?: AdditionalCosts
): PaymentData[];

/**
 * Implementation that handles both parameter object and individual parameters
 */
export function convertAndProcessScheduleWithFees(
  rawScheduleOrParams: any[] | ConvertScheduleWithFeesParams,
  additionalCosts?: AdditionalCosts
): PaymentData[] {
  // Handle parameter object
  if (!Array.isArray(rawScheduleOrParams)) {
    const params = rawScheduleOrParams;
    return convertAndProcessScheduleWithFeesImpl(params.rawSchedule, params.additionalCosts);
  }

  // Handle individual parameters
  return convertAndProcessScheduleWithFeesImpl(rawScheduleOrParams, additionalCosts);
}

/**
 * Implementation of schedule conversion and processing with fees
 */
function convertAndProcessScheduleWithFeesImpl(
  rawSchedule: any[],
  additionalCosts?: AdditionalCosts
): PaymentData[] {
  const paymentData: PaymentData[] = rawSchedule.map((item) => {
    // Use convertScheduleFormat from calculationCore.ts
    const converted = convertScheduleFormat(item);

    // Calculate recurring fees for this payment
    const fees = additionalCosts
      ? calculateRecurringFees({
          remainingBalance: converted.balance,
          additionalCosts: additionalCosts,
        })
      : 0;

    return {
      payment: converted.payment || 0,
      isOverpayment: converted.isOverpayment,
      overpaymentAmount: converted.overpaymentAmount || 0,
      monthlyPayment: roundToCents(converted.monthlyPayment),
      interestPayment: roundToCents(converted.interestPayment),
      principalPayment: roundToCents(converted.principalPayment),
      balance: roundToCents(converted.balance),
      totalPayment: roundToCents((converted.totalPayment ?? converted.monthlyPayment) + fees),
      totalInterest: 0,
      fees: fees,
    };
  });

  // Calculate cumulative interest
  let cumulativeInterest = 0;
  for (const pd of paymentData) {
    cumulativeInterest += pd.interestPayment;
    pd.totalInterest = roundToCents(cumulativeInterest);
  }

  return paymentData;
}

/**
 * Calculate monthly payment directly
 */
/**
 * Calculate monthly payment using parameter object
 */
export function calculateMonthlyPaymentInternal(params: MonthlyPaymentParams): number;

/**
 * Calculate monthly payment with individual parameters (backward compatibility)
 * @deprecated Use parameter object version instead
 */
export function calculateMonthlyPaymentInternal(
  principal: number,
  monthlyRate: number,
  totalMonths: number
): number;

/**
 * Implementation that handles both parameter object and individual parameters
 */
export function calculateMonthlyPaymentInternal(
  principalOrParams: number | MonthlyPaymentParams,
  monthlyRate?: number,
  totalMonths?: number
): number {
  // Handle parameter object
  if (typeof principalOrParams === 'object') {
    const params = principalOrParams;
    return calculateMonthlyPaymentInternalImpl(
      params.principal,
      params.monthlyRate,
      params.totalMonths
    );
  }

  // Handle individual parameters
  return calculateMonthlyPaymentInternalImpl(principalOrParams, monthlyRate!, totalMonths!);
}

/**
 * Implementation of monthly payment calculation
 */
function calculateMonthlyPaymentInternalImpl(
  principal: number,
  monthlyRate: number,
  totalMonths: number
): number {
  // This function now directly uses calculateBaseMonthlyPayment from calculationCore.ts
  return calculateBaseMonthlyPayment(principal, monthlyRate, totalMonths);
}
