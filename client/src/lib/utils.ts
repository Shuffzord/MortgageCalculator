/**
 * Utility functions for mortgage calculations
 */

import { Schedule } from "./types";

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
  termYears: number
): number {
  const monthlyRate = annualRate / 100 / 12;
  const totalPayments = termYears * 12;

  // If interest rate is 0, simple division
  if (monthlyRate === 0) {
    return principal / totalPayments;
  }

  // Standard mortgage formula
  const x = Math.pow(1 + monthlyRate, totalPayments);
  return principal * monthlyRate * x / (x - 1);
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
export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  termYears: number,
  overpaymentPlan?: any, // OverpaymentDetails,
  startDate?: Date
): Schedule[] {
  const monthlyRate = annualRate / 100 / 12;
  const originalTotalPayments = termYears * 12;
  let monthlyPayment = calculateMonthlyPayment(principal, annualRate, termYears);
  const schedule: Schedule[] = [];

  let remainingPrincipal = principal;
  let paymentNum = 1;
  let overpaymentApplied = false;
  let newMonthlyPayment = monthlyPayment;

  // Set up date calculation if start date is provided
  let currentDate: Date | undefined;
  if (startDate) {
    currentDate = new Date(startDate);
  }

  // Generate schedule until principal is paid off
  while (remainingPrincipal > 0) {
    const interestPayment = remainingPrincipal * monthlyRate;
    let principalPayment = monthlyPayment - interestPayment;
    let payment = monthlyPayment;

    // Calculate payment date if start date is provided
    let paymentDate: Date | undefined;
    if (currentDate) {
      paymentDate = new Date(currentDate);
      // Move to next month for next iteration
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Apply overpayment if this is the specified month
    if (overpaymentPlan && paymentNum === overpaymentPlan.startMonth && overpaymentPlan.amount > 0 && !overpaymentApplied) {
      principalPayment += overpaymentPlan.amount;
      payment += overpaymentPlan.amount;
      overpaymentApplied = true;

      // If reducing payment not term, recalculate monthly payment
      if (!overpaymentPlan.isRecurring) {
        remainingPrincipal -= principalPayment;
        const remainingMonths = originalTotalPayments - paymentNum;
        newMonthlyPayment = calculateMonthlyPayment(remainingPrincipal, annualRate, remainingMonths / 12);
        monthlyPayment = newMonthlyPayment;

        // Add to schedule and continue to next iteration to use updated monthly payment
        schedule.push({
          paymentNum,
          payment,
          principalPayment,
          interestPayment,
          remainingPrincipal,
          isOverpayment: true,
          paymentDate
        });

        paymentNum++;
        continue;
      }
    }

    // Adjust final payment if it's more than remaining principal + interest
    if (principalPayment > remainingPrincipal) {
      principalPayment = remainingPrincipal;
      payment = principalPayment + interestPayment;
    }

    remainingPrincipal -= principalPayment;

    schedule.push({
      paymentNum,
      payment,
      principalPayment,
      interestPayment,
      remainingPrincipal,
      isOverpayment: (overpaymentPlan && paymentNum === overpaymentPlan.startMonth && overpaymentPlan.amount > 0) ?? false,
      paymentDate
    });

    paymentNum++;

    // Break if we've reached a reasonable limit to prevent infinite loops
    if (paymentNum > 600) { // 50 years maximum
      break;
    }

    // Break if principal is effectively zero (floating point precision issues)
    if (remainingPrincipal < 0.01) {
      break;
    }
  }

  return schedule;
}

/**
 * Formats a number as currency
 * @param value Number to format
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, locale: string = 'en-US', currency: string = 'USD'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
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
