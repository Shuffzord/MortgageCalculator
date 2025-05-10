"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CURRENCIES = void 0;
exports.areMonetaryValuesEqual = areMonetaryValuesEqual;
exports.calculateMonthlyPayment = calculateMonthlyPayment;
exports.roundToCents = roundToCents;
exports.generateAmortizationSchedule = generateAmortizationSchedule;
exports.formatCurrency = formatCurrency;
exports.formatTimePeriod = formatTimePeriod;
exports.formatDate = formatDate;
exports.getCurrencySymbol = getCurrencySymbol;
exports.cn = cn;
exports.calculateReducedTermSchedule = calculateReducedTermSchedule;
exports.calculateReducedPaymentSchedule = calculateReducedPaymentSchedule;
var clsx_1 = require("clsx");
var tailwind_merge_1 = require("tailwind-merge");
exports.CURRENCIES = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
    { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
    { code: "AUD", symbol: "A$", name: "Australian Dollar" },
    { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
    { code: "PLN", symbol: "zł", name: "Polish Złoty" },
];
function areMonetaryValuesEqual(a, b, tolerance) {
    if (tolerance === void 0) { tolerance = 0.01; }
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
function calculateMonthlyPayment(principal, monthlyRate, totalMonths) {
    // For extremely low rates (near-zero), use simple division
    if (Math.abs(monthlyRate) < 0.0001) { // 0.01% annual rate threshold
        return roundToCents(principal / totalMonths);
    }
    // For very low rates, use simplified calculation
    if (monthlyRate < 0.001) { // 0.12% annual rate threshold
        var totalPayment = principal * (1 + (monthlyRate * totalMonths));
        return roundToCents(totalPayment / totalMonths);
    }
    // Standard formula for normal interest rates
    var compoundFactor = Math.pow(1 + monthlyRate, totalMonths);
    var payment = principal * (monthlyRate * compoundFactor) / (compoundFactor - 1);
    return roundToCents(payment);
}
function roundToCents(amount) {
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
function generateAmortizationSchedule(principal, interestRatePeriods, termYears, overpaymentAmount, overpaymentMonth, reduceTermNotPayment, startDate, repaymentModel) {
    // Handle legacy parameters format
    var overpaymentPlan;
    var scheduleStartDate = startDate;
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
    }
    else if (typeof overpaymentAmount === 'object') {
        // New format with OverpaymentDetails object
        overpaymentPlan = overpaymentAmount;
        if (overpaymentMonth instanceof Date) {
            scheduleStartDate = overpaymentMonth;
        }
    }
    // Proceed with calculation
    var originalTotalPayments = termYears * 12;
    var schedule = [];
    var monthlyPayment = 0;
    var remainingPrincipal = principal;
    var paymentNum = 1;
    var newMonthlyPayment = 0;
    var totalPayments = originalTotalPayments;
    // Set up date calculation if start date is provided
    var currentDate;
    if (startDate) {
        currentDate = new Date(startDate);
    }
    // Pre-calculate frequency multiplier
    var frequencyMultiplier = 0;
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
        var currentInterestRate = 0;
        for (var _i = 0, interestRatePeriods_1 = interestRatePeriods; _i < interestRatePeriods_1.length; _i++) {
            var period = interestRatePeriods_1[_i];
            if (paymentNum >= period.startMonth) {
                currentInterestRate = period.interestRate;
            }
        }
        var monthlyRate = currentInterestRate / 100 / 12;
        var monthlyPayment_1 = void 0;
        var interestPayment = void 0;
        var principalPayment = void 0;
        var payment = void 0;
        if (repaymentModel === 'decreasingInstallments') {
            // For decreasing installments, principal portion is fixed and interest portion decreases
            principalPayment = roundToCents(principal / originalTotalPayments);
            interestPayment = roundToCents(remainingPrincipal * monthlyRate);
            monthlyPayment_1 = principalPayment + interestPayment;
            payment = monthlyPayment_1;
        }
        else {
            // Default: equal installments (annuity) model
            monthlyPayment_1 = calculateMonthlyPayment(remainingPrincipal, monthlyRate, totalPayments);
            interestPayment = remainingPrincipal * monthlyRate;
            principalPayment = monthlyPayment_1 - interestPayment;
            payment = monthlyPayment_1;
        }
        var overpaymentAmount_1 = 0;
        // Calculate payment date if start date is provided
        var paymentDate = void 0;
        if (currentDate) {
            paymentDate = new Date(currentDate);
            // Move to next month for next iteration
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        // Apply overpayment
        if (overpaymentPlan &&
            overpaymentPlan.startMonth !== undefined &&
            paymentNum >= overpaymentPlan.startMonth &&
            (!overpaymentPlan.endMonth || paymentNum <= overpaymentPlan.endMonth) &&
            (overpaymentPlan.frequency === "monthly" ||
                (paymentNum - overpaymentPlan.startMonth) % frequencyMultiplier === 0)) {
            overpaymentAmount_1 = overpaymentPlan.amount;
            principalPayment += overpaymentAmount_1;
            payment += overpaymentAmount_1;
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
            principalPayment: principalPayment,
            interestPayment: interestPayment,
            balance: remainingPrincipal, // Remaining balance
            isOverpayment: overpaymentAmount_1 > 0,
            overpaymentAmount: overpaymentAmount_1,
            totalInterest: 0, // This will be calculated in a separate pass
            totalPayment: 0, // This will be calculated in a separate pass
            paymentDate: paymentDate
        });
        paymentNum++;
        // If reducing payment not term, recalculate monthly payment
        if (overpaymentPlan && overpaymentPlan.amount > 0 && reduceTermNotPayment) {
            newMonthlyPayment = calculateMonthlyPayment(remainingPrincipal, monthlyRate, totalPayments);
            monthlyPayment_1 = newMonthlyPayment;
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
    var runningTotalInterest = 0;
    var runningTotalPayment = 0;
    for (var i = 0; i < schedule.length; i++) {
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
function formatCurrency(value, locale, currency) {
    if (locale === void 0) { locale = "en-US"; }
    if (currency === void 0) { currency = "USD"; }
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
function formatTimePeriod(months) {
    var years = Math.floor(months / 12);
    var remainingMonths = months % 12;
    var formattedString = "";
    if (years > 0) {
        formattedString += "".concat(years, " year").concat(years > 1 ? "s" : "", " ");
    }
    if (remainingMonths > 0) {
        formattedString += "".concat(remainingMonths, " month").concat(remainingMonths > 1 ? "s" : "");
    }
    return formattedString.trim();
}
/**
 * Format date to a human-readable string
 * @param date Date to format
 * @returns Formatted date string (e.g., "Jan 15, 2025")
 */
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}
function getCurrencySymbol(code) {
    var currency = exports.CURRENCIES.find(function (c) { return c.code === code; });
    return currency ? currency.symbol : exports.CURRENCIES[0].symbol;
}
function cn() {
    var inputs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        inputs[_i] = arguments[_i];
    }
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
/**
 * Calculate a schedule with reduced term (same payment amount)
 */
function calculateReducedTermSchedule(balance, interestRatePeriods, monthlyPayment, startPaymentNumber) {
    var result = [];
    var remainingBalance = balance;
    var payment = startPaymentNumber;
    while (remainingBalance > 0.01) {
        payment++;
        // Determine the interest rate for the current payment
        var currentInterestRate = 0;
        for (var _i = 0, interestRatePeriods_2 = interestRatePeriods; _i < interestRatePeriods_2.length; _i++) {
            var period = interestRatePeriods_2[_i];
            if (payment >= period.startMonth) {
                currentInterestRate = period.interestRate;
            }
        }
        var monthlyRate = currentInterestRate / 100 / 12;
        var interestPayment = roundToCents(remainingBalance * monthlyRate);
        var principalPayment = roundToCents(monthlyPayment - interestPayment);
        var currentPayment = monthlyPayment;
        if (remainingBalance < principalPayment) {
            principalPayment = remainingBalance;
            currentPayment = roundToCents(principalPayment + interestPayment);
            remainingBalance = 0;
        }
        else {
            remainingBalance = roundToCents(remainingBalance - principalPayment);
        }
        result.push({
            payment: payment,
            monthlyPayment: currentPayment,
            principalPayment: principalPayment,
            interestPayment: interestPayment,
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
function calculateReducedPaymentSchedule(balance, interestRatePeriods, remainingMonths, originalPayment, startPaymentNumber) {
    var schedule = [];
    var remainingBalance = balance;
    for (var i = 0; i < remainingMonths && remainingBalance > 0.01; i++) {
        var payment = startPaymentNumber + i;
        // Determine the interest rate for the current payment
        var currentInterestRate = 0;
        for (var _i = 0, interestRatePeriods_3 = interestRatePeriods; _i < interestRatePeriods_3.length; _i++) {
            var period = interestRatePeriods_3[_i];
            if (payment >= period.startMonth) {
                currentInterestRate = period.interestRate;
            }
        }
        var monthlyRate = currentInterestRate / 100 / 12;
        var newMonthlyPayment = calculateMonthlyPayment(remainingBalance, monthlyRate, remainingMonths);
        var interestPayment = roundToCents(remainingBalance * monthlyRate);
        var principalPayment = roundToCents(newMonthlyPayment - interestPayment);
        var currentPayment = newMonthlyPayment;
        if (remainingBalance < principalPayment) {
            principalPayment = remainingBalance;
            currentPayment = roundToCents(principalPayment + interestPayment);
            remainingBalance = 0;
        }
        else {
            remainingBalance = roundToCents(remainingBalance - principalPayment);
        }
        schedule.push({
            payment: payment,
            monthlyPayment: currentPayment,
            principalPayment: principalPayment,
            interestPayment: interestPayment,
            balance: remainingBalance,
            isOverpayment: false,
            overpaymentAmount: 0,
            totalInterest: 0,
            totalPayment: currentPayment
        });
    }
    return schedule;
}
