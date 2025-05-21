/**
 * Overpayment Calculator Fixes
 * 
 * This file contains the fixes for the issues identified in the overpayment calculator.
 * The main issues addressed are:
 * 
 * 1. Interest rate period handling after overpayments
 * 2. Schedule reconstruction logic (payment numbering)
 * 3. Interest calculation in multiple rate scenarios
 * 4. Term calculation with rate changes
 */

// Import necessary types and functions
import {
  CalculationResults,
  PaymentData,
  LoanDetails,
  OverpaymentDetails
} from "./types";
import { roundToCents, calculateBaseMonthlyPayment } from './calculationCore';
import {
  calculateReducedTermSchedule,
  calculateReducedPaymentSchedule,
  applyOverpayment,
  isOverpaymentApplicable,
  aggregateYearlyData
} from './overpaymentCalculator';

// Fix 1: Modify applyOverpaymentImpl to properly adjust interest rate periods
// and fix payment numbering in the remaining schedule

/**
 * Implementation of overpayment application with fixes
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
  
  // FIX: Adjust interest rate periods based on the current payment number
  // This ensures that rate changes are correctly applied after overpayments
  const adjustedInterestRatePeriods = loanDetails.interestRatePeriods.map(period => {
    return {
      startMonth: Math.max(1, period.startMonth - afterPayment),
      interestRate: period.interestRate
    };
  });
  
  // Calculate remaining schedule based on effect
  let remainingSchedule;
  
  if (effect === 'reduceTerm') {
    // For term reduction, keep the same payment amount but recalculate how quickly the loan will be paid off
    remainingSchedule = calculateReducedTermSchedule({
      balance: remainingBalance,
      interestRatePeriods: adjustedInterestRatePeriods, // Use adjusted periods
      monthlyPayment: schedule[0].monthlyPayment,
      startPaymentNumber: afterPayment // Keep the original payment numbering
    });
  } else {
    // For payment reduction, keep the same term but recalculate a lower monthly payment
    // Make sure we're using the correct remaining term
    const remainingMonths = Math.min(
      schedule.length - afterPayment,
      Math.ceil((schedule.length / 12) * 12) - afterPayment // Ensure we don't exceed the original term
    );
    
    remainingSchedule = calculateReducedPaymentSchedule({
      balance: remainingBalance,
      interestRatePeriods: adjustedInterestRatePeriods, // Use adjusted periods
      remainingMonths: remainingMonths,
      originalPayment: schedule[0].monthlyPayment,
      startPaymentNumber: afterPayment // Keep the original payment numbering
    });
  }

  // FIX: Ensure payment numbers are sequential
  const fixedRemainingSchedule = remainingSchedule.map((payment, index) => {
    return {
      ...payment,
      payment: afterPayment + 1 + index
    };
  });

  // Combine schedules
  const newSchedule = [
    ...preOverpaymentSchedule,
    overpaymentMonth,
    ...fixedRemainingSchedule
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

  // FIX: Calculate the actual term based on payments with positive balances
  // Ensure it never exceeds the original term
  const actualTerm = Math.min(
    newSchedule.filter(p => p.balance > 0 || p.principalPayment > 0).length / 12,
    schedule.length / 12 // Original term
  );

  return {
    monthlyPayment: effect === 'reduceTerm'
      ? schedule[0].monthlyPayment
      : fixedRemainingSchedule[0]?.monthlyPayment || 0,
    totalInterest: cumulativeInterest,
    amortizationSchedule: newSchedule,
    yearlyData: aggregateYearlyData(newSchedule),
    originalTerm: schedule.length / 12,
    actualTerm: actualTerm
  };
}

// Fix 2: Modify calculateReducedTermScheduleImpl to handle interest rate transitions correctly

/**
 * Implementation of reduced term schedule calculation with fixes
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
    
    // FIX: Don't increment payment number here, we'll set it explicitly
    // This avoids payment number gaps
    
    // Determine the interest rate for the current payment
    // FIX: Use the absolute payment number for rate determination
    let currentInterestRate = sortedRatePeriods[0]?.interestRate || 0;
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
    
    // FIX: Set payment number explicitly to avoid gaps
    const currentPaymentNumber = payment + iterations;
    
    result.push({
      payment: currentPaymentNumber,
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

// Fix 3: Modify calculateReducedPaymentScheduleImpl to handle interest rate transitions correctly

/**
 * Implementation of reduced payment schedule calculation with fixes
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
  let initialInterestRate = sortedRatePeriods[0]?.interestRate || 0;
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
    const currentPaymentNumber = startPaymentNumber + i;
    
    // Determine the interest rate for the current payment
    // FIX: Use the absolute payment number for rate determination
    let currentInterestRate = initialInterestRate;
    for (const period of sortedRatePeriods) {
      if (currentPaymentNumber >= period.startMonth) {
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
      payment: currentPaymentNumber,
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

// Fix 4: Modify performOverpaymentsImpl to handle interest rate transitions correctly

/**
 * Implementation of applying all overpayments in one pass with fixes
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
          
          // FIX: Use the fixed applyOverpayment implementation
          const result = applyOverpayment(current, safeAmount, month, currentLoanDetails, effect);
          current = result.amortizationSchedule;
        } catch (error) {
          console.error(`Error applying overpayment at month ${month}:`, error);
        }
      }
    }
    
    // FIX: Ensure payment numbers are sequential
    for (let i = 1; i < current.length; i++) {
      if (current[i].payment !== current[i-1].payment + 1) {
        current[i].payment = current[i-1].payment + 1;
      }
    }
    
    // FIX: Recalculate totalInterest for all payments
    let cumulativeInterest = 0;
    for (const payment of current) {
      cumulativeInterest += payment.interestPayment;
      payment.totalInterest = roundToCents(cumulativeInterest);
    }
    
    return current;
  } catch (error) {
    console.error("Error in performOverpayments:", error);
    return schedule;
  }
}

// Fix 5: Modify finalizeResultsImpl to ensure term never exceeds original term

/**
 * Implementation of finalizing results with fixes
 */
function finalizeResultsImpl(
  schedule: PaymentData[],
  originalTerm: number
): CalculationResults {
  // Recalculate totalInterest field
  let runningInterest = 0;
  for (let i = 0; i < schedule.length; i++) {
    runningInterest += schedule[i].interestPayment;
    schedule[i].totalInterest = roundToCents(runningInterest);
  }

  const totalInterest = schedule.reduce((sum: number, p: PaymentData) => sum + p.interestPayment, 0);
  const yearlyData = aggregateYearlyData(schedule);
  
  // FIX: Ensure actual term never exceeds original term
  const actualTerm = Math.min(
    schedule.filter(p => p.balance > 0 || p.principalPayment > 0).length / 12,
    originalTerm
  );

  return {
    monthlyPayment: schedule[0]?.monthlyPayment || 0,
    totalInterest,
    amortizationSchedule: schedule,
    yearlyData,
    originalTerm,
    actualTerm
  };
}

// Export the fixed implementations
export {
  applyOverpaymentImpl,
  calculateReducedTermScheduleImpl,
  calculateReducedPaymentScheduleImpl,
  performOverpaymentsImpl,
  finalizeResultsImpl
};