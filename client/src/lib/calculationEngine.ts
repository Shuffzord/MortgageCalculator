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
  LoanCalculationParams
} from "./types";
import { validateInputs } from "./validation";
import { generateAmortizationSchedule } from "./utils";
// Re-export for use by other modules
export { generateAmortizationSchedule };
import { formatCurrency } from "./formatters";
import { convertScheduleFormat, calculateBaseMonthlyPayment, roundToCents } from './calculationCore';
import {
  applyOverpayment,
  applyMultipleOverpayments,
  calculateReducedTermSchedule,
  calculateReducedPaymentSchedule,
  isOverpaymentApplicable,
  performOverpayments,
  finalizeResults
} from './overpaymentCalculator';

/**
 * Calculate monthly payment for decreasing installments model
 * In this model, the principal portion remains constant and the interest portion decreases over time
 */
export function calculateDecreasingInstallment(
  principal: number,
  monthlyRate: number,
  totalMonths: number,
  currentMonth: number
): number {
  // Fixed principal portion
  const principalPortion = principal / totalMonths;

  // Remaining balance after previous payments
  const remainingBalance = principal - (principalPortion * (currentMonth - 1));

  // Interest portion based on remaining balance
  const interestPortion = remainingBalance * monthlyRate;

  // Total payment for this month
  return roundToCents(principalPortion + interestPortion);
}

/**
 * Calculate one-time fees
 */
export function calculateOneTimeFees(
  principal: number,
  additionalCosts?: AdditionalCosts
): number {
  if (!additionalCosts) return 0;

  let totalFees = 0;

  // Origination fee
  if (additionalCosts.originationFeeType === 'fixed') {
    totalFees += additionalCosts.originationFee;
  } else {
    totalFees += (principal * additionalCosts.originationFee / 100);
  }

  return roundToCents(totalFees);
}

/**
 * Calculate recurring fees for a specific payment
 */
export function calculateRecurringFees(
  remainingBalance: number,
  additionalCosts?: AdditionalCosts
): number {
  if (!additionalCosts) return 0;

  let monthlyFees = 0;

  // Loan insurance
  if (additionalCosts.loanInsuranceType === 'fixed') {
    monthlyFees += additionalCosts.loanInsurance;
  } else {
    monthlyFees += (remainingBalance * additionalCosts.loanInsurance / 100 / 12);
  }

  // Administrative fees
  if (additionalCosts.administrativeFeesType === 'fixed') {
    monthlyFees += additionalCosts.administrativeFees;
  } else {
    monthlyFees += (remainingBalance * additionalCosts.administrativeFees / 100 / 12);
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
  let tolerance = 0.0001;
  let maxIterations = 100;

  // Newton-Raphson method to find APR
  for (let i = 0; i < maxIterations; i++) {
    // Calculate present value with current guess
    let pv = 0;
    for (let month = 1; month <= loanTermMonths; month++) {
      pv += (monthlyPayment + recurringFees) / Math.pow(1 + guess / 12, month);
    }

    // Calculate difference from principal
    const diff = pv - (principal - oneTimeFees);

    if (Math.abs(diff) < tolerance) {
      break;
    }

    // Adjust guess
    if (diff > 0) {
      guess += step;
    } else {
      guess -= step;
    }

    // Reduce step size
    step *= 0.9;
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
  interestRatePeriods: { startMonth: number; interestRate: number; }[],
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
  interestRatePeriods?: { startMonth: number; interestRate: number; }[],
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
  interestRatePeriods: { startMonth: number; interestRate: number; }[],
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
    name: ''
  };
  if (principal === 0) {
    return {
      monthlyPayment: 0,
      totalInterest: 0,
      amortizationSchedule: [],
      yearlyData: [],
      originalTerm: loanTerm,
      actualTerm: 0
    };
  }

  validateInputs(principal, interestRatePeriods, loanTerm, overpaymentPlan);

  // Calculate one-time fees
  const oneTimeFees = calculateOneTimeFees(principal, additionalCosts);

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
      repaymentModel: actualRepaymentModel
    };
    
    rawSchedule = applyMultipleOverpayments(rawSchedule, overpaymentPlans, startDate, overpaymentLoanDetails);
  } else if (overpaymentPlan) {
    // For backward compatibility
    const overpaymentLoanDetails: LoanDetails = {
      principal,
      interestRatePeriods,
      loanTerm,
      overpaymentPlans: [overpaymentPlan],
      startDate: startDate || new Date(),
      name: actualLoanDetails.name || '',
      repaymentModel: actualRepaymentModel
    };
    
    rawSchedule = applyMultipleOverpayments(rawSchedule, [overpaymentPlan], startDate, overpaymentLoanDetails);
  }

  // Process the schedule and add fees
  const paymentData = convertAndProcessScheduleWithFees(rawSchedule, additionalCosts);
  const yearlyData = aggregateYearlyData(paymentData);

  // Calculate total recurring fees
  const recurringFees = paymentData.reduce((sum, payment) => sum + (payment.fees || 0), 0);

  // Calculate total interest from the payment data
  const totalInterest = paymentData.length > 0 ?
    paymentData.reduce((sum, payment) => sum + payment.interestPayment, 0) : 0;
  
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
    repaymentModel: actualRepaymentModel
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
    apr: apr
  };
}

/**
 * Convert raw schedule to payment data and calculate cumulative interest
 */
export function convertAndProcessSchedule(rawSchedule: any[]): PaymentData[] {
  // This function now uses convertScheduleFormat from calculationCore.ts
  const paymentData: PaymentData[] = rawSchedule.map(item => {
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
      totalInterest: 0
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
export function convertAndProcessScheduleWithFees(rawSchedule: any[], additionalCosts?: AdditionalCosts): PaymentData[] {
  const paymentData: PaymentData[] = rawSchedule.map(item => {
    // Use convertScheduleFormat from calculationCore.ts
    const converted = convertScheduleFormat(item);

    // Calculate recurring fees for this payment
    const fees = additionalCosts ? calculateRecurringFees(converted.balance, additionalCosts) : 0;

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
      fees: fees
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
 * Aggregate monthly payment data into yearly summaries for display
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
export function recalculateScheduleWithNewRate(
  startingBalance: number,
  annualInterestRate: number, // as percentage (e.g., 5 for 5%)
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
 * Calculate monthly payment directly
 */
export function calculateMonthlyPaymentInternal(
  principal: number,
  monthlyRate: number,
  totalMonths: number
): number {
  // This function now directly uses calculateBaseMonthlyPayment from calculationCore.ts
  return calculateBaseMonthlyPayment(principal, monthlyRate, totalMonths);
}

// These functions have been moved to overpaymentCalculator.ts

/**
 * Handle rate changes during the loan term
 */
export function applyRateChange(
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

// This function has been moved to overpaymentCalculator.ts

/**
 * Calculate complex scenario with rate changes and overpayments
 */
export function calculateComplexScenario(
  loanDetails: LoanDetails,
  rateChanges: Array<{ month: number; newRate: number }>,
  overpayments: OverpaymentDetails[]
): CalculationResults {
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
  
  // Then apply overpayments using the function from overpaymentCalculator.ts
  const afterAll = performOverpayments(afterRates, overpayments, loanDetails.startDate, loanDetails);
  
  // Build final results using the function from overpaymentCalculator.ts
  return finalizeResults(afterAll, loanDetails.loanTerm);
}

/**
 * Apply a series of rate changes in chronological order
 */
export function performRateChanges(
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

// These functions have been moved to overpaymentCalculator.ts
