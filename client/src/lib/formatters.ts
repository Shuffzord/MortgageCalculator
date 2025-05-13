/**
 * @fileoverview Formatting utilities for mortgage calculator application
 *
 * This module contains utility functions for formatting various types of data
 * related to mortgage calculations. It serves as a central location for all
 * formatting logic, separating presentation concerns from calculation logic.
 *
 * The formatters handle various types of data including:
 * - Currency values with proper localization
 * - Time periods (converting months to years and months)
 * - Dates with localization support
 * - Interest rates as percentages
 * - Payment schedules and summaries
 *
 * By centralizing formatting logic here, we ensure consistent presentation
 * throughout the application and make it easier to adapt to different
 * locales and currencies.
 */

import { format } from "date-fns";
import { enUS, es, pl } from "date-fns/locale";
import i18n from "@/i18n";
import { PaymentData, YearlyData } from "./types";

/**
 * Formats a number as currency with proper localization
 *
 * @param {number} value - Number to format as currency
 * @param {string} [locale] - Optional locale code (e.g., 'en-US', 'pl-PL', 'es-ES')
 *                           If not provided, uses the current language from i18n
 * @param {string} [currency='USD'] - Currency code to use for formatting
 * @returns {string} Formatted currency string with appropriate symbol and decimal formatting
 *
 * @example
 * // Format as US dollars
 * formatCurrency(1234.56); // Returns: "$1,234.56"
 *
 * @example
 * // Format as Polish złoty
 * formatCurrency(1234.56, 'pl-PL', 'PLN'); // Returns: "1 234,56 zł"
 *
 * @example
 * // Format as Euros
 * formatCurrency(1234.56, 'en-US', 'EUR'); // Returns: "€1,234.56"
 */
export function formatCurrency(
  value: number,
  locale?: string,
  currency: string = "USD",
): string {
  // Use the current language from i18n if locale is not provided
  const currentLocale = locale || (i18n.language === 'pl' ? 'pl-PL' :
                                   i18n.language === 'es' ? 'es-ES' : 'en-US');
  
  return new Intl.NumberFormat(currentLocale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats a time period in months as years and months
 *
 * @param {number} months - Number of months to format
 * @returns {string} Formatted time period string (e.g., "2 years 3 months", "1 year", "5 months")
 *
 * @example
 * formatTimePeriod(15); // Returns: "1 year 3 months"
 * formatTimePeriod(24); // Returns: "2 years"
 * formatTimePeriod(5);  // Returns: "5 months"
 * formatTimePeriod(0);  // Returns: "" (empty string)
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
 * Formats a date to a human-readable string with language-specific formatting
 *
 * Uses date-fns library with locale support to format dates according to the
 * current application language setting.
 *
 * @param {Date} date - Date object to format
 * @param {string} [formatStr="PPP"] - Format string pattern (default: "PPP" for long date format)
 *                                    See date-fns documentation for format string options
 * @returns {string} Formatted date string based on the current language
 *
 * @example
 * // With English locale
 * formatDate(new Date(2023, 0, 15)); // Returns: "January 15th, 2023"
 *
 * @example
 * // With Polish locale (assuming i18n.language is 'pl')
 * formatDate(new Date(2023, 0, 15)); // Returns: "15 stycznia 2023"
 *
 * @example
 * // With custom format
 * formatDate(new Date(2023, 0, 15), "MM/dd/yyyy"); // Returns: "01/15/2023"
 */
export function formatDate(date: Date, formatStr: string = "PPP"): string {
  const language = i18n.language || 'en';
  const locale = language === 'pl' ? pl : language === 'es' ? es : enUS;
  
  return format(date, formatStr, { locale });
}

/**
 * Legacy date formatting function for backward compatibility
 *
 * @param {Date} date - Date object to format
 * @returns {string} Date formatted in US locale with short month, day, and year
 * @deprecated Use formatDate instead which supports localization and custom formats
 *
 * @example
 * formatDateLegacy(new Date(2023, 0, 15)); // Returns: "Jan 15, 2023"
 */
export function formatDateLegacy(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Formats a payment amount with appropriate currency symbol
 *
 * This is a convenience wrapper around formatCurrency specifically for payment amounts.
 *
 * @param {number} amount - Payment amount to format
 * @param {string} [currency="USD"] - Currency code to use for formatting
 * @returns {string} Formatted payment string with currency symbol
 *
 * @example
 * formatPaymentAmount(1234.56); // Returns: "$1,234.56"
 * formatPaymentAmount(1234.56, "EUR"); // Returns: "€1,234.56"
 */
export function formatPaymentAmount(amount: number, currency: string = "USD"): string {
  return formatCurrency(amount, undefined, currency);
}

/**
 * Formats an interest rate as a percentage string
 *
 * Converts a decimal interest rate (e.g., 0.05) to a percentage string (e.g., "5.00%")
 * with two decimal places.
 *
 * @param {number} rate - Interest rate as a decimal (e.g., 0.05 for 5%)
 * @returns {string} Formatted percentage string with two decimal places
 *
 * @example
 * formatInterestRate(0.05); // Returns: "5.00%"
 * formatInterestRate(0.0375); // Returns: "3.75%"
 * formatInterestRate(0); // Returns: "0.00%"
 */
export function formatInterestRate(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

/**
 * Formats a payment schedule entry for display
 *
 * Creates a human-readable string representation of a payment data entry,
 * including payment number, monthly payment amount, principal payment, and interest payment.
 *
 * @param {PaymentData} entry - Payment data entry from amortization schedule
 * @param {string} [currency="USD"] - Currency code to use for formatting monetary values
 * @returns {string} Formatted payment entry string
 *
 * @example
 * // Format a payment entry
 * const entry = {
 *   payment: 1,
 *   monthlyPayment: 1000,
 *   principalPayment: 800,
 *   interestPayment: 200,
 *   balance: 99000,
 *   isOverpayment: false,
 *   overpaymentAmount: 0,
 *   totalInterest: 200,
 *   totalPayment: 1000
 * };
 * formatPaymentEntry(entry);
 * // Returns: "Payment #1: $1,000.00 (Principal: $800.00, Interest: $200.00)"
 */
export function formatPaymentEntry(entry: PaymentData, currency: string = "USD"): string {
  return `Payment #${entry.payment}: ${formatCurrency(entry.monthlyPayment, undefined, currency)} (Principal: ${formatCurrency(entry.principalPayment, undefined, currency)}, Interest: ${formatCurrency(entry.interestPayment, undefined, currency)})`;
}

/**
 * Formats yearly summary data for display
 *
 * Creates a human-readable string representation of yearly payment summary data,
 * including year number, total payment, principal payment, and interest payment.
 *
 * @param {YearlyData} yearData - Yearly summary data object
 * @param {string} [currency="USD"] - Currency code to use for formatting monetary values
 * @returns {string} Formatted yearly summary string
 *
 * @example
 * // Format a yearly summary
 * const yearData = {
 *   year: 1,
 *   principal: 10000,
 *   interest: 2000,
 *   payment: 12000,
 *   balance: 90000,
 *   totalInterest: 2000
 * };
 * formatYearlySummary(yearData);
 * // Returns: "Year 1: Paid $12,000.00 (Principal: $10,000.00, Interest: $2,000.00)"
 */
export function formatYearlySummary(yearData: YearlyData, currency: string = "USD"): string {
  return `Year ${yearData.year}: Paid ${formatCurrency(yearData.payment, undefined, currency)} (Principal: ${formatCurrency(yearData.principal, undefined, currency)}, Interest: ${formatCurrency(yearData.interest, undefined, currency)})`;
}

/**
 * Formats loan summary information into a human-readable string
 *
 * Creates a multi-line string containing key loan information including
 * principal amount, monthly payment, total interest, and loan term.
 *
 * @param {number} principal - Loan principal amount
 * @param {number} monthlyPayment - Monthly payment amount
 * @param {number} totalInterest - Total interest paid over the life of the loan
 * @param {number} term - Loan term in years (can include fractional years)
 * @param {string} [currency="USD"] - Currency code to use for formatting monetary values
 * @returns {string} Multi-line formatted loan summary string
 *
 * @example
 * // Format a basic loan summary
 * formatLoanSummary(
 *   300000,    // $300,000 principal
 *   1500,      // $1,500 monthly payment
 *   240000,    // $240,000 total interest
 *   30         // 30-year term
 * );
 * // Returns:
 * // "Loan Amount: $300,000.00
 * // Monthly Payment: $1,500.00
 * // Total Interest: $240,000.00
 * // Term: 30 years"
 *
 * @example
 * // Format with fractional term
 * formatLoanSummary(100000, 500, 20000, 15.5, "EUR");
 * // Returns loan summary with "Term: 15 years 6 months" and Euro currency
 */
export function formatLoanSummary(
  principal: number,
  monthlyPayment: number,
  totalInterest: number,
  term: number,
  currency: string = "USD"
): string {
  return `Loan Amount: ${formatCurrency(principal, undefined, currency)}
Monthly Payment: ${formatCurrency(monthlyPayment, undefined, currency)}
Total Interest: ${formatCurrency(totalInterest, undefined, currency)}
Term: ${formatTimePeriod(term * 12)}`;
}