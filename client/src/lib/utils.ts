/**
 * Utility functions for mortgage calculations
 */

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
  annualRate: number,
  termYears: number,
): number {
  const monthlyRate = annualRate / 100 / 12;
  const totalPayments = termYears * 12;

  // If interest rate is 0 or near-zero, use simple division
  // This prevents floating point precision issues with very small rates
  if (monthlyRate === 0 || annualRate < 0.01) {
    return Math.round((principal / totalPayments) * 100) / 100;
  }
  
  // Standard mortgage formula
  const x = Math.pow(1 + monthlyRate, totalPayments);
  let payment = (principal * monthlyRate * x) / (x - 1);
  
  // Round to 2 decimal places for consistency with financial calculations
  // Use Math.round(payment * 100) / 100 for standard rounding
  // This ensures consistent results with expected values in tests
  return Math.round(payment * 100) / 100;
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
  annualRate: number,
  termYears: number,
  overpaymentAmount?: number | OverpaymentDetails,
  overpaymentMonth?: number | Date,
  reduceTermNotPayment?: boolean,
  startDate?: Date,
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
  const monthlyRate = annualRate / 100 / 12;
  const originalTotalPayments = termYears * 12;
  let monthlyPayment = calculateMonthlyPayment(
    principal,
    annualRate,
    termYears,
  );
  const schedule: PaymentData[] = [];

  let remainingPrincipal = principal;
  let paymentNum = 1;
  let newMonthlyPayment = monthlyPayment;
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
    const interestPayment = remainingPrincipal * monthlyRate;
    let principalPayment = monthlyPayment - interestPayment;
    let payment = monthlyPayment;
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
        annualRate,
        totalPayments / 12,
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

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { PaymentData, OverpaymentDetails } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
