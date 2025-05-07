// calculationEngine.ts
import {
  CalculationResults,
  PaymentData,
  OverpaymentDetails,
  YearlyData,
  LoanDetails,
  RepaymentModel,
  AdditionalCosts,
  FeeType
} from "./types";
import { validateInputs } from "./validation";
import { calculateMonthlyPayment, generateAmortizationSchedule, roundToCents } from "./utils";
import { convertLegacySchedule } from "./mortgage-calculator";



/**
 * Format a number as currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * Calculate loan details and generate the amortization schedule
 */
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
export function calculateAPR(
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

export function calculateLoanDetails(
  principal: number,
  interestRatePeriods: { startMonth: number; interestRate: number; }[],
  loanTerm: number,
  overpaymentPlan?: OverpaymentDetails,
  repaymentModel: RepaymentModel = 'equalInstallments',
  additionalCosts?: AdditionalCosts
): CalculationResults {
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

  let rawSchedule = generateAmortizationSchedule(
    principal,
    interestRatePeriods,
    loanTerm,
    overpaymentPlan,
    undefined, // overpaymentMonth (not used)
    undefined, // reduceTermNotPayment (not used)
    undefined, // startDate (not used)
    repaymentModel
  );

  // If there are overpayments, apply them immediately
  if (overpaymentPlan) {
    rawSchedule = applyMultipleOverpayments(rawSchedule, [overpaymentPlan]);
  }

  // Process the schedule and add fees
  const paymentData = convertAndProcessScheduleWithFees(rawSchedule, additionalCosts);
  const yearlyData = aggregateYearlyData(paymentData);

  // Calculate total recurring fees
  const recurringFees = paymentData.reduce((sum, payment) => sum + (payment.fees || 0), 0);

  // Calculate total cost (principal + interest + fees)
  const totalInterest = paymentData.length > 0 ? paymentData[paymentData.length - 1].totalInterest : 0;
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

  return {
    monthlyPayment: paymentData[0]?.monthlyPayment || 0,
    totalInterest: totalInterest,
    amortizationSchedule: paymentData,
    yearlyData,
    originalTerm: loanTerm,
    actualTerm: paymentData.length / 12,
    oneTimeFees,
    recurringFees,
    totalCost,
    apr
  };
}

/**
 * Convert raw schedule to payment data and calculate cumulative interest
 */
export function convertAndProcessSchedule(rawSchedule: any[]): PaymentData[] {
  const paymentData: PaymentData[] = rawSchedule.map(item => {
    const converted = convertLegacySchedule(item);
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
    const converted = convertLegacySchedule(item);
    
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

  const newMonthlyPayment = calculateMonthlyPaymentInternal(
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
  // Handle edge cases
  return calculateMonthlyPayment(principal, monthlyRate, totalMonths); // Call the main function for validation
}

/**
 * Apply a one-time overpayment and recalculate the amortization schedule
 */
export function applyOverpayment(
  schedule: PaymentData[],
  overpaymentAmount: number,
  afterPayment: number,
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
  
  const overpaymentMonth = {
    ...targetPayment,
    isOverpayment: true,
    overpaymentAmount: overpaymentAmount,
    balance: targetPayment.balance - overpaymentAmount
  };
  
  const remainingBalance = overpaymentMonth.balance;
  const monthlyRate = schedule[0].interestPayment / schedule[0].balance;
  
  // Calculate remaining schedule based on effect
  const remainingSchedule = effect === 'reduceTerm' 
    ? calculateReducedTermSchedule(
        remainingBalance,
        monthlyRate,
        schedule[0].monthlyPayment,
        afterPayment + 1
      )
    : calculateReducedPaymentSchedule(
        remainingBalance,
        monthlyRate,
        schedule.length - afterPayment,
        schedule[0].monthlyPayment,
        afterPayment + 1
      );

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

  return {
    monthlyPayment: effect === 'reduceTerm' 
      ? schedule[0].monthlyPayment 
      : remainingSchedule[0].monthlyPayment,
    totalInterest: newSchedule.reduce((sum, payment) => sum + payment.interestPayment, 0),
    amortizationSchedule: newSchedule,
    yearlyData: aggregateYearlyData(newSchedule),
    originalTerm: schedule.length / 12,
    actualTerm: newSchedule.filter(p => p.monthlyPayment > 0).length / 12
  };
}

/**
 * Calculate a schedule with reduced term (same payment amount)
 */
export function calculateReducedTermSchedule(
  balance: number,
  monthlyRate: number,
  monthlyPayment: number,
  startPaymentNumber: number
): PaymentData[] {
  const result: PaymentData[] = [];
  let remainingBalance = balance;
  let payment = startPaymentNumber;

  while (remainingBalance > 0.01) {
    payment++;
    const interestPayment = roundToCents(remainingBalance * monthlyRate);
    let principalPayment = roundToCents(monthlyPayment - interestPayment);
    let currentPayment = monthlyPayment;

    if (remainingBalance < monthlyPayment) {
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
  }

  return result;
}

/**
 * Calculate a schedule with reduced payment (same term)
 */
export function calculateReducedPaymentSchedule(
  balance: number,
  monthlyRate: number,
  remainingMonths: number,
  originalPayment: number,
  startPaymentNumber: number
): PaymentData[] {
  // Fix: Calculate new monthly payment using the correct rate conversion
  const newMonthlyPayment = calculateMonthlyPayment(
    balance,
    monthlyRate, // Remove the conversion since monthlyRate is already monthly
    remainingMonths
  );

  const schedule: PaymentData[] = [];
  let remainingBalance = balance;

  for (let i = 0; i < remainingMonths && remainingBalance > 0.01; i++) {
    const payment = startPaymentNumber + i;
    const interestPayment = roundToCents(remainingBalance * monthlyRate);
    let principalPayment = roundToCents(newMonthlyPayment - interestPayment);
    let currentPayment = newMonthlyPayment;

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
      totalInterest: schedule.reduce((sum, p) => sum + p.interestPayment, 0) + interestPayment,
      totalPayment: currentPayment
    });
2  }

  return schedule;
}

/**
 * Create the final result object for an overpayment calculation
 */
export function createFinalOverpaymentResult(
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

  const totalInterest = schedule.reduce((sum, p) => sum + p.interestPayment, 0);
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

/**
 * Apply multiple overpayments to a schedule
 */
export function applyMultipleOverpayments(
  schedule: PaymentData[],
  overpayments: OverpaymentDetails[]
): PaymentData[] {
  return performOverpayments(schedule, overpayments);
}

/**
 * Calculate complex scenario with rate changes and overpayments
 */
export function calculateComplexScenario(
  loanDetails: LoanDetails,
  rateChanges: Array<{ month: number; newRate: number }>,
  overpayments: OverpaymentDetails[]
): CalculationResults {
  // Get base schedule
  const base = calculateLoanDetails(
    loanDetails.principal,
    loanDetails.interestRatePeriods,
    loanDetails.loanTerm
  );

  // Apply rate changes
  const afterRates = performRateChanges(base.amortizationSchedule, rateChanges);

  // Apply overpayments
  const afterAll = performOverpayments(afterRates, overpayments);

  // Build final results
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

/**
 * Check if an overpayment applies in a given month
 */
export function isOverpaymentApplicable(
  overpayment: OverpaymentDetails,
  month: number
): boolean {
  const inWindow = month >= overpayment.startMonth && 
                  (!overpayment.endMonth || month <= overpayment.endMonth);
  
  if (!inWindow) return false;
  if (!overpayment.isRecurring) return month === overpayment.startMonth;
  
  if (overpayment.frequency === "monthly") return true;
  if (overpayment.frequency === "quarterly") return (month - overpayment.startMonth) % 3 === 0;
  if (overpayment.frequency === "annual") return (month - overpayment.startMonth) % 12 === 0;
  
  return false;
}

/**
 * Apply all overpayments in one pass
 */
export function performOverpayments(
  schedule: PaymentData[],
  overpayments: OverpaymentDetails[]
): PaymentData[] {
  if (!overpayments.length) return schedule;
  
  let current = [...schedule];
  
  // Find last payment with positive balance
  const lastActivePayment = current.findIndex(p => p.balance <= 0);
  const effectiveLength = lastActivePayment === -1 ? current.length : lastActivePayment + 1;
  
  for (let m = 1; m <= effectiveLength; m++) {
    // Stop if loan is already paid off
    if (!current[m - 1] || current[m - 1].balance <= 0) {
      break;
    }
    
    // Find applicable overpayments for month m
    const applicableOps = overpayments.filter(op => isOverpaymentApplicable(op, m));
    
    if (applicableOps.length) {
      const totalAmount = applicableOps.reduce((sum, op) => sum + op.amount, 0);
      const effect = applicableOps[0].effect || "reduceTerm";
      
      try {
        // Ensure we don't overpay more than remaining balance
        const maxOverpayment = current[m - 1].balance;
        const safeAmount = Math.min(totalAmount, maxOverpayment);
        
        const result = applyOverpayment(current, safeAmount, m, effect);
        current = result.amortizationSchedule;
      } catch (error) {
        console.warn(`Warning: Stopping overpayments at month ${m}, loan may be paid off`);
        break;
      }
    }
  }
  
  return current;
}

/**
 * Turn a raw schedule into final results
 */
export function finalizeResults(
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
    totalInterest,
    amortizationSchedule: schedule,
    yearlyData,
    originalTerm,
    actualTerm
  };
}
