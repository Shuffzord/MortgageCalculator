import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { PaymentData, OverpaymentDetails, RepaymentModel } from "./types";

export function areMonetaryValuesEqual(a: number, b: number, tolerance = 0.01): boolean {
  return Math.abs(roundToCents(a) - roundToCents(b)) <= tolerance;
}

/**
 * Calculates the monthly payment amount for a loan
 *
 * Formula: M = P[r(1+r)^n]/[(1+r)^n-1] where:
 * M = monthly payment
 * P = loan principal
 * r = monthly interest rate (annual rate / 12 / 100)
 * n = number of monthly payments (term * 12)
 *
 * @param principal Loan principal amount
 * @param annualRate Annual interest rate (percentage)
 * @param termYears Loan term in years
 * @returns Monthly payment amount
 */
export function calculateMonthlyPayment(
  principal: number,
  monthlyRate: number,
  totalMonths: number
): number {
  // For extremely low rates (near-zero), use simple division
  if (Math.abs(monthlyRate) < 0.0001) { // 0.01% annual rate threshold
    return roundToCents(principal / totalMonths);
  }
  
  // For very low rates, use simplified calculation
  if (monthlyRate < 0.001) { // 0.12% annual rate threshold
    const totalPayment = principal * (1 + (monthlyRate * totalMonths));
    return roundToCents(totalPayment / totalMonths);
  }
  
  // Standard formula for normal interest rates
  const compoundFactor = Math.pow(1 + monthlyRate, totalMonths);
  const payment = principal * (monthlyRate * compoundFactor) / (compoundFactor - 1);
  return roundToCents(payment);
}

export function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
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
      monthlyPayment = calculateMonthlyPayment(
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
      newMonthlyPayment = calculateMonthlyPayment(
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

/**
 * Formats a number as currency
 * @param value Number to format
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  locale: string = "en-US",
  currency: string = "USD",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats a time period in months as years and months
 * @param months Number of months
 * @returns Formatted time period string
 */
export function formatTimePeriod(months: number): string {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  let formattedString = "";

  if (years > 0) {
    formattedString += `${years} year${years > 1 ? "s" : ""} `;
  }

  if (remainingMonths > 0) {
    formattedString += `${remainingMonths} month${remainingMonths > 1 ? "s" : ""}`;
  }

  return formattedString.trim();
}

/**
 * Format date to a human-readable string
 * @param date Date to format
 * @returns Formatted date string (e.g., "Jan 15, 2025")
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
