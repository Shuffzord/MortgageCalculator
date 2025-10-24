/**
 * Utility functions for handling payment indices and date conversions
 * These functions help bridge the gap between business concepts (payment months)
 * and technical implementation (zero-based array indices)
 */

/**
 * Convert a payment month (1-based) to an array index (0-based)
 * @param paymentMonth The payment month number (1-based)
 * @returns The corresponding array index (0-based)
 */
export function paymentMonthToIndex(paymentMonth: number): number {
  if (paymentMonth <= 0) {
    throw new Error(`Invalid payment month: ${paymentMonth}. Payment months must be positive.`);
  }
  return paymentMonth - 1;
}

/**
 * Convert an array index (0-based) to a payment month (1-based)
 * @param index The array index (0-based)
 * @returns The corresponding payment month (1-based)
 */
export function indexToPaymentMonth(index: number): number {
  if (index < 0) {
    throw new Error(`Invalid index: ${index}. Indices must be non-negative.`);
  }
  return index + 1;
}

/**
 * Calculate the number of months between two dates
 * @param startDate The starting date
 * @param endDate The ending date
 * @returns The number of months between the two dates
 */
export function monthsBetweenDates(startDate: Date, endDate: Date): number {
  return (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
         (endDate.getMonth() - startDate.getMonth());
}

/**
 * Add a specified number of months to a date
 * @param date The starting date
 * @param months The number of months to add
 * @returns A new date with the months added
 */
export function addMonthsToDate(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Convert a date to a payment month number based on a loan start date
 * @param date The date to convert
 * @param loanStartDate The loan start date (payment month 1)
 * @returns The payment month number
 */
export function dateToPaymentMonth(date: Date, loanStartDate: Date): number {
  const months = monthsBetweenDates(loanStartDate, date);
  return months + 1; // Add 1 because payment months are 1-based
}

/**
 * Convert a payment month to a date based on a loan start date
 * @param paymentMonth The payment month number
 * @param loanStartDate The loan start date (payment month 1)
 * @returns The date corresponding to the payment month
 */
export function paymentMonthToDate(paymentMonth: number, loanStartDate: Date): Date {
  return addMonthsToDate(loanStartDate, paymentMonth - 1);
}