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

import { calculateMonthlyPayment, generateAmortizationSchedule, formatCurrency, formatDate } from './utils';
import { OverpaymentDetails } from './types';

export interface Schedule {
  currency?: string;
}

export interface Schedule {
  paymentNum: number;
  payment: number;
  principalPayment: number;
  interestPayment: number;
  remainingPrincipal: number;
  isOverpayment: boolean;
  paymentDate?: Date;
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

