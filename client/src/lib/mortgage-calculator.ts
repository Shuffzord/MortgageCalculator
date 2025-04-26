/**
 * This file contains the core calculation logic for the mortgage calculator.
 * It handles amortization schedules, monthly payments and overpayment scenarios.
 */

export interface LoanDetails {
  name: string;
  principal: number;
  interestRate: number;
  loanTerm: number;
  overpaymentAmount: number;
  overpaymentMonth: number;
  reduceTermNotPayment: boolean;
  startDate?: Date;
  dateCreated?: string;
}

import { calculateMonthlyPayment, generateAmortizationSchedule, formatCurrency } from './utils';
import { OverpaymentDetails } from './types';

// Import the unified PaymentData type
import { PaymentData } from './types';

// Use PaymentData for Schedule and add backward compatibility for old property names
export interface Schedule extends PaymentData {
  // For backward compatibility (these will be mapped to PaymentData properties)
  paymentNum?: number;        // Maps to payment
  remainingPrincipal?: number; // Maps to balance
}

// Convert legacy Schedule format to PaymentData
export function convertLegacySchedule(schedule: any): PaymentData {
  return {
    payment: schedule.paymentNum || schedule.payment,
    monthlyPayment: schedule.payment || schedule.monthlyPayment,
    principalPayment: schedule.principalPayment,
    interestPayment: schedule.interestPayment,
    balance: schedule.remainingPrincipal || schedule.balance,
    isOverpayment: schedule.isOverpayment || false,
    overpaymentAmount: schedule.overpaymentAmount || 0,
    totalInterest: schedule.totalInterest || 0,
    totalPayment: schedule.totalPayment || schedule.payment,
    paymentDate: schedule.paymentDate,
    currency: schedule.currency
  };
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
