import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { PaymentData, OverpaymentDetails, RepaymentModel } from "./types";
import { calculateBaseMonthlyPayment, roundToCents as roundToCentsCore } from './calculationCore';
// Re-export formatting functions from formatters.ts for backward compatibility
import { formatCurrency, formatDate, formatTimePeriod, formatDateLegacy } from './formatters';
export { formatCurrency, formatDate, formatTimePeriod, formatDateLegacy };

export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  { code: "PLN", symbol: "zł", name: "Polish Złoty" },
];

export function areMonetaryValuesEqual(a: number, b: number, tolerance = 0.01): boolean {
  return Math.abs(roundToCentsCore(a) - roundToCentsCore(b)) <= tolerance;
}

/**
 * Calculates the monthly payment amount for a loan
 * This is now a wrapper around the core function for backward compatibility
 */
export function calculateMonthlyPayment(
  principal: number,
  monthlyRate: number,
  totalMonths: number
): number {
  return calculateBaseMonthlyPayment(principal, monthlyRate, totalMonths);
}

// Re-export roundToCents for backward compatibility
export function roundToCents(amount: number): number {
  return roundToCentsCore(amount);
}
/**
 * Generates the amortization schedule for the loan
 *
 * This calculates a payment-by-payment breakdown of principal and interest,
 * and handles overpayment scenarios with either term or payment reduction.
 *
 * @param principal Loan principal amount
 * @param annualRate Annual interest rate (percentage)
 * @param termYears Loan term in years
 * @param overpaymentAmount One-time overpayment amount
 * @param overpaymentMonth Month number when overpayment is applied
 * @param reduceTermNotPayment Whether to reduce term (true) or payment (false) after overpayment
 * @returns Array of schedule entries with payment details
 */
// Overloaded signatures for backward compatibility
export function generateAmortizationSchedule(
  principal: number,
  interestRatePeriods: { startMonth: number; interestRate: number; }[],
  termYears: number,
  overpaymentAmount?: number | OverpaymentDetails,
  overpaymentMonth?: number | Date,
  reduceTermNotPayment?: boolean,
  startDate?: Date,
  repaymentModel?: RepaymentModel,
): PaymentData[] {
  // Handle legacy parameters format
  let overpaymentPlan: OverpaymentDetails | undefined;
  let scheduleStartDate = startDate;
  
  if (typeof overpaymentAmount === 'number' && typeof overpaymentMonth === 'number') {
    // Legacy format with separate parameters
    overpaymentPlan = {
      amount: overpaymentAmount,
      startMonth: overpaymentMonth,
      endMonth: overpaymentMonth,
      startDate: scheduleStartDate || new Date(),
      isRecurring: false,
      frequency: 'one-time',
      effect: reduceTermNotPayment ? 'reduceTerm' : 'reducePayment'
    };
  } else if (typeof overpaymentAmount === 'object') {
    // New format with OverpaymentDetails object
    overpaymentPlan = overpaymentAmount;
    if (overpaymentMonth instanceof Date) {
      scheduleStartDate = overpaymentMonth;
    }
  }
  
  // Proceed with calculation
  const originalTotalPayments = termYears * 12;
  const schedule: PaymentData[] = [];
  let monthlyPayment = 0;

  let remainingPrincipal = principal;
  let paymentNum = 1;
  let newMonthlyPayment = 0;
  let totalPayments = originalTotalPayments;

  // Set up date calculation if start date is provided
  let currentDate: Date | undefined;
  if (startDate) {
    currentDate = new Date(startDate);
  }

  // Pre-calculate frequency multiplier
  let frequencyMultiplier = 0;
  if (overpaymentPlan && overpaymentPlan.frequency) {
    frequencyMultiplier =
      overpaymentPlan.frequency === "monthly"
        ? 1
        : overpaymentPlan.frequency === "quarterly"
          ? 3
          : overpaymentPlan.frequency === "annual"
            ? 12
            : 0;
  }

  // Generate schedule until principal is paid off
  while (remainingPrincipal > 0 && paymentNum <= originalTotalPayments) {
    // Determine the interest rate for the current payment
    let currentInterestRate = 0;
    for (const period of interestRatePeriods) {
      if (paymentNum >= period.startMonth) {
        currentInterestRate = period.interestRate;
      }
    }

    const monthlyRate = currentInterestRate / 100 / 12;
    let monthlyPayment: number;
    let interestPayment: number;
    let principalPayment: number;
    let payment: number;

    if (repaymentModel === 'decreasingInstallments') {
      // For decreasing installments, principal portion is fixed and interest portion decreases
      principalPayment = roundToCents(principal / originalTotalPayments);
      interestPayment = roundToCents(remainingPrincipal * monthlyRate);
      monthlyPayment = principalPayment + interestPayment;
      payment = monthlyPayment;
    } else {
      // Default: equal installments (annuity) model
      monthlyPayment = calculateBaseMonthlyPayment(
        remainingPrincipal,
        monthlyRate,
        totalPayments,
      );
      interestPayment = remainingPrincipal * monthlyRate;
      principalPayment = monthlyPayment - interestPayment;
      payment = monthlyPayment;
    }
    let overpaymentAmount = 0;

    // Calculate payment date if start date is provided
    let paymentDate: Date | undefined;
    if (currentDate) {
      paymentDate = new Date(currentDate);
      // Move to next month for next iteration
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Apply overpayment
    if (
      overpaymentPlan &&
      overpaymentPlan.startMonth !== undefined &&
      paymentNum >= overpaymentPlan.startMonth &&
      (!overpaymentPlan.endMonth || paymentNum <= overpaymentPlan.endMonth) &&
      (overpaymentPlan.frequency === "monthly" ||
        (paymentNum - overpaymentPlan.startMonth) % frequencyMultiplier === 0)
    ) {
      overpaymentAmount = overpaymentPlan.amount;
      principalPayment += overpaymentAmount;
      payment += overpaymentAmount;
    }

    // Adjust final payment if it's more than remaining principal + interest
    // or if this is the last scheduled payment
    if (principalPayment > remainingPrincipal || paymentNum === originalTotalPayments) {
      principalPayment = remainingPrincipal;
      payment = principalPayment + interestPayment;
    }

    remainingPrincipal -= principalPayment;

    // Force remaining balance to exactly zero on final payment
    if (paymentNum === originalTotalPayments || Math.abs(remainingPrincipal) < 0.01) {
      remainingPrincipal = 0;
    }

    schedule.push({
      payment: paymentNum, // Payment number
      monthlyPayment: payment, // Monthly payment amount
      principalPayment,
      interestPayment,
      balance: remainingPrincipal, // Remaining balance
      isOverpayment: overpaymentAmount > 0,
      overpaymentAmount: overpaymentAmount,
      totalInterest: 0, // This will be calculated in a separate pass
      totalPayment: 0, // This will be calculated in a separate pass
      paymentDate
    });

    paymentNum++;

    // If reducing payment not term, recalculate monthly payment
    if (overpaymentPlan && overpaymentPlan.amount > 0 && reduceTermNotPayment) {
      newMonthlyPayment = calculateBaseMonthlyPayment(
        remainingPrincipal,
        monthlyRate,
        totalPayments,
      );
      monthlyPayment = newMonthlyPayment;
    }

    totalPayments--;

    // Break if we've reached a reasonable limit to prevent infinite loops
    if (paymentNum > 600) {
      // 50 years maximum
      break;
    }

    // Break if principal is effectively zero (floating point precision issues)
    if (remainingPrincipal < 0.01) {
      break;
    }
  }

  // Calculate running totals for interest and payments
  let runningTotalInterest = 0;
  let runningTotalPayment = 0;
  
  for (let i = 0; i < schedule.length; i++) {
    runningTotalInterest += schedule[i].interestPayment;
    runningTotalPayment += schedule[i].monthlyPayment;
    
    schedule[i].totalInterest = runningTotalInterest;
    schedule[i].totalPayment = runningTotalPayment;
  }
  
  return schedule;
}


export function getCurrencySymbol(code: string): string {
  const currency = CURRENCIES.find(c => c.code === code);
  return currency ? currency.symbol : CURRENCIES[0].symbol;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// These functions have been moved to overpaymentCalculator.ts
// Re-export them from there if needed
