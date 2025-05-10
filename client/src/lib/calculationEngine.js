"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDecreasingInstallment = calculateDecreasingInstallment;
exports.calculateOneTimeFees = calculateOneTimeFees;
exports.calculateRecurringFees = calculateRecurringFees;
exports.calculateAPR = calculateAPR;
exports.calculateLoanDetails = calculateLoanDetails;
exports.convertAndProcessSchedule = convertAndProcessSchedule;
exports.convertAndProcessScheduleWithFees = convertAndProcessScheduleWithFees;
exports.aggregateYearlyData = aggregateYearlyData;
exports.recalculateScheduleWithNewRate = recalculateScheduleWithNewRate;
exports.calculateMonthlyPaymentInternal = calculateMonthlyPaymentInternal;
exports.applyOverpayment = applyOverpayment;
exports.calculateReducedTermSchedule = calculateReducedTermSchedule;
exports.calculateReducedPaymentSchedule = calculateReducedPaymentSchedule;
exports.createFinalOverpaymentResult = createFinalOverpaymentResult;
exports.applyRateChange = applyRateChange;
exports.applyMultipleOverpayments = applyMultipleOverpayments;
exports.calculateComplexScenario = calculateComplexScenario;
exports.performRateChanges = performRateChanges;
exports.isOverpaymentApplicable = isOverpaymentApplicable;
exports.performOverpayments = performOverpayments;
exports.finalizeResults = finalizeResults;
//import { validateInputs } from "./validation";
var utils_1 = require("./utils");
var mortgage_calculator_1 = require("./mortgage-calculator");
/**
 * Calculate monthly payment for decreasing installments model
 * In this model, the principal portion remains constant and the interest portion decreases over time
 */
function calculateDecreasingInstallment(principal, monthlyRate, totalMonths, currentMonth) {
    // Fixed principal portion
    var principalPortion = principal / totalMonths;
    // Remaining balance after previous payments
    var remainingBalance = principal - (principalPortion * (currentMonth - 1));
    // Interest portion based on remaining balance
    var interestPortion = remainingBalance * monthlyRate;
    // Total payment for this month
    return (0, utils_1.roundToCents)(principalPortion + interestPortion);
}
/**
 * Calculate one-time fees
 */
function calculateOneTimeFees(principal, additionalCosts) {
    if (!additionalCosts)
        return 0;
    var totalFees = 0;
    // Origination fee
    if (additionalCosts.originationFeeType === 'fixed') {
        totalFees += additionalCosts.originationFee;
    }
    else {
        totalFees += (principal * additionalCosts.originationFee / 100);
    }
    return (0, utils_1.roundToCents)(totalFees);
}
/**
 * Calculate recurring fees for a specific payment
 */
function calculateRecurringFees(remainingBalance, additionalCosts) {
    if (!additionalCosts)
        return 0;
    var monthlyFees = 0;
    // Loan insurance
    if (additionalCosts.loanInsuranceType === 'fixed') {
        monthlyFees += additionalCosts.loanInsurance;
    }
    else {
        monthlyFees += (remainingBalance * additionalCosts.loanInsurance / 100 / 12);
    }
    // Administrative fees
    if (additionalCosts.administrativeFeesType === 'fixed') {
        monthlyFees += additionalCosts.administrativeFees;
    }
    else {
        monthlyFees += (remainingBalance * additionalCosts.administrativeFees / 100 / 12);
    }
    return (0, utils_1.roundToCents)(monthlyFees);
}
/**
 * Calculate Annual Percentage Rate (APR)
 * Uses iterative approach to find the rate that makes the present value
 * of all cash flows equal to the initial loan amount
 */
function calculateAPR(principal, monthlyPayment, loanTermMonths, oneTimeFees, recurringFees) {
    // Initial guess: standard interest rate + 1%
    var guess = 0.05;
    var step = 0.01;
    var tolerance = 0.0001;
    var maxIterations = 100;
    // Newton-Raphson method to find APR
    for (var i = 0; i < maxIterations; i++) {
        // Calculate present value with current guess
        var pv = 0;
        for (var month = 1; month <= loanTermMonths; month++) {
            pv += (monthlyPayment + recurringFees) / Math.pow(1 + guess / 12, month);
        }
        // Calculate difference from principal
        var diff = pv - (principal - oneTimeFees);
        if (Math.abs(diff) < tolerance) {
            break;
        }
        // Adjust guess
        if (diff > 0) {
            guess += step;
        }
        else {
            guess -= step;
        }
        // Reduce step size
        step *= 0.9;
    }
    // Convert to annual percentage rate
    return (0, utils_1.roundToCents)(guess * 12 * 100);
}
function calculateLoanDetails(principal, interestRatePeriods, loanTerm, overpaymentPlan, repaymentModel, additionalCosts, overpaymentPlans, startDate, loanDetails) {
    var _a;
    if (repaymentModel === void 0) { repaymentModel = 'equalInstallments'; }
    if (loanDetails === void 0) { loanDetails = { principal: 0, interestRatePeriods: [], loanTerm: 0, overpaymentPlans: [], startDate: new Date(), name: '' }; }
    if (principal === 0) {
        return {
            monthlyPayment: 0,
            totalInterest: 0,
            amortizationSchedule: [],
            yearlyData: [],
            originalTerm: loanTerm,
            actualTerm: 0
        };
    }
    //validateInputs(principal, interestRatePeriods, loanTerm, overpaymentPlan);
    // Calculate one-time fees
    var oneTimeFees = calculateOneTimeFees(principal, additionalCosts);
    var rawSchedule = (0, utils_1.generateAmortizationSchedule)(principal, interestRatePeriods, loanTerm, overpaymentPlan, undefined, // overpaymentMonth (not used)
    undefined, // reduceTermNotPayment (not used)
    undefined, // startDate (not used)
    repaymentModel);
    // If there are overpayments, apply them immediately
    if (overpaymentPlans && overpaymentPlans.length > 0) {
        rawSchedule = applyMultipleOverpayments(rawSchedule, overpaymentPlans, startDate);
    }
    else if (overpaymentPlan) {
        // For backward compatibility
        rawSchedule = applyMultipleOverpayments(rawSchedule, [overpaymentPlan], startDate);
    }
    // Process the schedule and add fees
    var paymentData = convertAndProcessScheduleWithFees(rawSchedule, additionalCosts);
    var yearlyData = aggregateYearlyData(paymentData);
    // Calculate total recurring fees
    var recurringFees = paymentData.reduce(function (sum, payment) { return sum + (payment.fees || 0); }, 0);
    // Calculate total cost (principal + interest + fees)
    var totalInterest = paymentData.length > 0 ? paymentData[paymentData.length - 1].totalInterest : 0;
    var totalCost = principal + totalInterest + oneTimeFees + recurringFees;
    // Calculate APR if we have all the necessary data
    var apr;
    if (paymentData.length > 0) {
        apr = calculateAPR(principal, paymentData[0].monthlyPayment, loanTerm * 12, oneTimeFees, recurringFees / paymentData.length // average monthly recurring fees
        );
    }
    loanDetails = { principal: principal, interestRatePeriods: interestRatePeriods, loanTerm: loanTerm, overpaymentPlans: overpaymentPlans || [], startDate: startDate || new Date(), name: loanDetails.name || '' };
    return {
        monthlyPayment: ((_a = paymentData[0]) === null || _a === void 0 ? void 0 : _a.monthlyPayment) || 0,
        totalInterest: totalInterest,
        amortizationSchedule: paymentData,
        yearlyData: yearlyData,
        originalTerm: loanTerm,
        actualTerm: paymentData.length / 12,
        oneTimeFees: oneTimeFees,
        recurringFees: recurringFees,
        totalCost: totalCost,
        apr: apr
    };
}
/**
 * Convert raw schedule to payment data and calculate cumulative interest
 */
function convertAndProcessSchedule(rawSchedule) {
    var paymentData = rawSchedule.map(function (item) {
        var _a;
        var converted = (0, mortgage_calculator_1.convertLegacySchedule)(item);
        return {
            payment: converted.payment || 0,
            isOverpayment: converted.isOverpayment,
            overpaymentAmount: converted.overpaymentAmount || 0,
            monthlyPayment: (0, utils_1.roundToCents)(converted.monthlyPayment),
            interestPayment: (0, utils_1.roundToCents)(converted.interestPayment),
            principalPayment: (0, utils_1.roundToCents)(converted.principalPayment),
            balance: (0, utils_1.roundToCents)(converted.balance),
            totalPayment: (0, utils_1.roundToCents)((_a = converted.totalPayment) !== null && _a !== void 0 ? _a : converted.monthlyPayment),
            totalInterest: 0
        };
    });
    // Calculate cumulative interest
    var cumulativeInterest = 0;
    for (var _i = 0, paymentData_1 = paymentData; _i < paymentData_1.length; _i++) {
        var pd = paymentData_1[_i];
        cumulativeInterest += pd.interestPayment;
        pd.totalInterest = (0, utils_1.roundToCents)(cumulativeInterest);
    }
    return paymentData;
}
/**
 * Convert raw schedule to payment data, calculate cumulative interest, and add fees
 */
function convertAndProcessScheduleWithFees(rawSchedule, additionalCosts) {
    var paymentData = rawSchedule.map(function (item) {
        var _a;
        var converted = (0, mortgage_calculator_1.convertLegacySchedule)(item);
        // Calculate recurring fees for this payment
        var fees = additionalCosts ? calculateRecurringFees(converted.balance, additionalCosts) : 0;
        return {
            payment: converted.payment || 0,
            isOverpayment: converted.isOverpayment,
            overpaymentAmount: converted.overpaymentAmount || 0,
            monthlyPayment: (0, utils_1.roundToCents)(converted.monthlyPayment),
            interestPayment: (0, utils_1.roundToCents)(converted.interestPayment),
            principalPayment: (0, utils_1.roundToCents)(converted.principalPayment),
            balance: (0, utils_1.roundToCents)(converted.balance),
            totalPayment: (0, utils_1.roundToCents)(((_a = converted.totalPayment) !== null && _a !== void 0 ? _a : converted.monthlyPayment) + fees),
            totalInterest: 0,
            fees: fees
        };
    });
    // Calculate cumulative interest
    var cumulativeInterest = 0;
    for (var _i = 0, paymentData_2 = paymentData; _i < paymentData_2.length; _i++) {
        var pd = paymentData_2[_i];
        cumulativeInterest += pd.interestPayment;
        pd.totalInterest = (0, utils_1.roundToCents)(cumulativeInterest);
    }
    return paymentData;
}
/**
 * Aggregate monthly payment data into yearly summaries for display
 */
function aggregateYearlyData(schedule) {
    if (!schedule.length)
        return [];
    return schedule.reduce(function (acc, month, idx) {
        var yearIndex = Math.floor(idx / 12);
        if (!acc[yearIndex]) {
            acc[yearIndex] = {
                year: yearIndex + 1,
                principal: 0,
                interest: 0,
                payment: 0,
                balance: 0,
                totalInterest: 0
            };
        }
        acc[yearIndex].principal = (0, utils_1.roundToCents)(acc[yearIndex].principal + month.principalPayment);
        acc[yearIndex].interest = (0, utils_1.roundToCents)(acc[yearIndex].interest + month.interestPayment);
        acc[yearIndex].payment = (0, utils_1.roundToCents)(acc[yearIndex].payment + month.monthlyPayment);
        acc[yearIndex].balance = month.balance;
        acc[yearIndex].totalInterest = (0, utils_1.roundToCents)(acc[yearIndex].totalInterest + month.interestPayment);
        return acc;
    }, []);
}
/**
 * Recalculate an amortization schedule from a given balance using a new interest rate and term
 */
function recalculateScheduleWithNewRate(startingBalance, annualInterestRate, // as percentage (e.g., 5 for 5%)
remainingTermInYears) {
    var monthlyRate = annualInterestRate / 100 / 12;
    var totalMonths = Math.round(remainingTermInYears * 12);
    var newMonthlyPayment = calculateMonthlyPaymentInternal(startingBalance, monthlyRate, totalMonths);
    var newSchedule = [];
    var balance = startingBalance;
    for (var i = 0; i < totalMonths && balance > 0.01; i++) {
        var payment = i + 1;
        var interestPayment = (0, utils_1.roundToCents)(balance * monthlyRate);
        var principalPayment = (0, utils_1.roundToCents)(newMonthlyPayment - interestPayment);
        var monthlyPayment = newMonthlyPayment;
        if (principalPayment > balance || i === totalMonths - 1) {
            principalPayment = (0, utils_1.roundToCents)(balance);
            monthlyPayment = (0, utils_1.roundToCents)(principalPayment + interestPayment);
            balance = 0;
        }
        else {
            balance = (0, utils_1.roundToCents)(balance - principalPayment);
        }
        newSchedule.push({
            payment: payment,
            monthlyPayment: monthlyPayment,
            principalPayment: principalPayment,
            interestPayment: interestPayment,
            balance: balance,
            isOverpayment: false,
            overpaymentAmount: 0,
            totalInterest: 0,
            totalPayment: monthlyPayment
        });
    }
    return newSchedule;
}
/**
 * Calculate monthly payment directly
 */
function calculateMonthlyPaymentInternal(principal, monthlyRate, totalMonths) {
    // Handle edge cases
    return (0, utils_1.calculateMonthlyPayment)(principal, monthlyRate, totalMonths); // Call the main function for validation
}
/**
 * Apply a one-time overpayment and recalculate the amortization schedule
 */
function applyOverpayment(schedule, overpaymentAmount, afterPayment, loanDetails, effect) {
    var _a;
    // Add validation
    if (afterPayment <= 0 || afterPayment > schedule.length) {
        throw new Error("Invalid payment number: ".concat(afterPayment));
    }
    var targetPayment = schedule[afterPayment - 1];
    if (!targetPayment || targetPayment.balance <= 0) {
        // Return unchanged schedule if payment not found or loan already paid
        return {
            monthlyPayment: ((_a = schedule[0]) === null || _a === void 0 ? void 0 : _a.monthlyPayment) || 0,
            totalInterest: schedule.reduce(function (sum, p) { return sum + p.interestPayment; }, 0),
            amortizationSchedule: schedule,
            yearlyData: aggregateYearlyData(schedule),
            originalTerm: schedule.length / 12,
            actualTerm: schedule.length / 12
        };
    }
    var preOverpaymentSchedule = schedule.slice(0, afterPayment - 1);
    var overpaymentMonth = __assign(__assign({}, targetPayment), { isOverpayment: true, overpaymentAmount: overpaymentAmount, balance: targetPayment.balance - overpaymentAmount });
    var remainingBalance = overpaymentMonth.balance;
    var interestRatePeriods = loanDetails.interestRatePeriods;
    // Calculate remaining schedule based on effect
    var remainingSchedule = effect === 'reduceTerm'
        ? calculateReducedTermSchedule(remainingBalance, interestRatePeriods, schedule[0].monthlyPayment, afterPayment + 1)
        : calculateReducedPaymentSchedule(remainingBalance, interestRatePeriods, schedule.length - afterPayment, schedule[0].monthlyPayment, afterPayment + 1);
    // Combine schedules
    var newSchedule = __spreadArray(__spreadArray(__spreadArray([], preOverpaymentSchedule, true), [
        overpaymentMonth
    ], false), remainingSchedule, true);
    // For reduce payment, pad schedule if needed
    if (effect === 'reducePayment' && newSchedule.length < schedule.length) {
        var lastPayment = newSchedule[newSchedule.length - 1];
        while (newSchedule.length < schedule.length) {
            newSchedule.push(__assign(__assign({}, lastPayment), { payment: newSchedule.length + 1, monthlyPayment: 0, principalPayment: 0, interestPayment: 0, balance: 0, isOverpayment: false, overpaymentAmount: 0 }));
        }
    }
    return {
        monthlyPayment: effect === 'reduceTerm'
            ? schedule[0].monthlyPayment
            : remainingSchedule[0].monthlyPayment,
        totalInterest: newSchedule.reduce(function (sum, payment) { return sum + payment.interestPayment; }, 0),
        amortizationSchedule: newSchedule,
        yearlyData: aggregateYearlyData(newSchedule),
        originalTerm: schedule.length / 12,
        actualTerm: newSchedule.filter(function (p) { return p.monthlyPayment > 0; }).length / 12
    };
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
        for (var _i = 0, interestRatePeriods_1 = interestRatePeriods; _i < interestRatePeriods_1.length; _i++) {
            var period = interestRatePeriods_1[_i];
            if (payment >= period.startMonth) {
                currentInterestRate = period.interestRate;
            }
        }
        var monthlyRate = currentInterestRate / 100 / 12;
        var interestPayment = (0, utils_1.roundToCents)(remainingBalance * monthlyRate);
        var principalPayment = (0, utils_1.roundToCents)(monthlyPayment - interestPayment);
        var currentPayment = monthlyPayment;
        if (remainingBalance < monthlyPayment) {
            principalPayment = remainingBalance;
            currentPayment = (0, utils_1.roundToCents)(principalPayment + interestPayment);
            remainingBalance = 0;
        }
        else {
            remainingBalance = (0, utils_1.roundToCents)(remainingBalance - principalPayment);
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
        for (var _i = 0, interestRatePeriods_2 = interestRatePeriods; _i < interestRatePeriods_2.length; _i++) {
            var period = interestRatePeriods_2[_i];
            if (payment >= period.startMonth) {
                currentInterestRate = period.interestRate;
            }
        }
        var monthlyRate = currentInterestRate / 100 / 12;
        var newMonthlyPayment = (0, utils_1.calculateMonthlyPayment)(remainingBalance, monthlyRate, remainingMonths);
        var interestPayment = (0, utils_1.roundToCents)(remainingBalance * monthlyRate);
        var principalPayment = (0, utils_1.roundToCents)(newMonthlyPayment - interestPayment);
        var currentPayment = newMonthlyPayment;
        if (remainingBalance < principalPayment) {
            principalPayment = remainingBalance;
            currentPayment = (0, utils_1.roundToCents)(principalPayment + interestPayment);
            remainingBalance = 0;
        }
        else {
            remainingBalance = (0, utils_1.roundToCents)(remainingBalance - principalPayment);
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
/**
 * Create the final result object for an overpayment calculation
 */
function createFinalOverpaymentResult(schedule, monthlyPayment, originalLength, savingsAmount) {
    // Recalculate totalInterest field
    var runningInterest = 0;
    for (var i = 0; i < schedule.length; i++) {
        runningInterest += schedule[i].interestPayment;
        schedule[i].totalInterest = (0, utils_1.roundToCents)(runningInterest);
    }
    var totalInterest = schedule.reduce(function (sum, p) { return sum + p.interestPayment; }, 0);
    var yearlyData = aggregateYearlyData(schedule);
    return {
        newCalculation: {
            monthlyPayment: monthlyPayment,
            totalInterest: totalInterest,
            amortizationSchedule: schedule,
            yearlyData: yearlyData,
            originalTerm: originalLength / 12,
            actualTerm: schedule.length / 12
        },
        timeOrPaymentSaved: savingsAmount
    };
}
/**
 * Handle rate changes during the loan term
 */
function applyRateChange(originalSchedule, changeAtMonth, newRate, remainingTerm) {
    if (changeAtMonth <= 0 || changeAtMonth >= originalSchedule.length) {
        throw new Error("Invalid month for rate change: ".concat(changeAtMonth));
    }
    // Get the balance at the change point
    var remainingBalance = (0, utils_1.roundToCents)(originalSchedule[changeAtMonth].balance);
    // Calculate term in years
    var monthsLeft = originalSchedule.length - changeAtMonth;
    var termYears = (remainingTerm !== undefined) ? remainingTerm : monthsLeft / 12;
    // Calculate the new schedule
    var newTail = recalculateScheduleWithNewRate(remainingBalance, newRate, termYears);
    // Combine head and tail
    var combined = __spreadArray(__spreadArray([], originalSchedule.slice(0, changeAtMonth), true), newTail.map(function (p) { return (__assign(__assign({}, p), { payment: p.payment + changeAtMonth })); }), true);
    // Recalculate totalInterest 
    var runningInterest = combined[changeAtMonth - 1].totalInterest;
    for (var i = changeAtMonth; i < combined.length; i++) {
        runningInterest += combined[i].interestPayment;
        combined[i].totalInterest = (0, utils_1.roundToCents)(runningInterest);
    }
    return combined;
}
/**
 * Apply multiple overpayments to a schedule
 */
function applyMultipleOverpayments(schedule, overpayments, loanStartDate) {
    return performOverpayments(schedule, overpayments, loanStartDate);
}
/**
 * Calculate complex scenario with rate changes and overpayments
 */
function calculateComplexScenario(loanDetails, rateChanges, overpayments) {
    // Get base schedule
    var base = calculateLoanDetails(loanDetails.principal, loanDetails.interestRatePeriods, loanDetails.loanTerm, undefined, loanDetails.repaymentModel, loanDetails.additionalCosts, overpayments, loanDetails.startDate, loanDetails);
    // Apply rate changes
    var afterRates = performRateChanges(base.amortizationSchedule, rateChanges);
    // Apply overpayments
    var afterAll = performOverpayments(afterRates, overpayments, loanDetails.startDate, loanDetails);
    // Build final results
    return finalizeResults(afterAll, loanDetails.loanTerm);
}
/**
 * Apply a series of rate changes in chronological order
 */
function performRateChanges(schedule, rateChanges) {
    var sorted = __spreadArray([], rateChanges, true).sort(function (a, b) { return a.month - b.month; });
    var current = schedule;
    for (var _i = 0, sorted_1 = sorted; _i < sorted_1.length; _i++) {
        var _a = sorted_1[_i], month = _a.month, newRate = _a.newRate;
        current = applyRateChange(current, month, newRate);
    }
    return current;
}
/**
 * Check if an overpayment applies in a given month
 */
function isOverpaymentApplicable(overpayment, month, loanStartDate) {
    // Get the startMonth and endMonth
    var startMonth = overpayment.startMonth;
    var endMonth = overpayment.endMonth;
    // If startMonth is not explicitly provided but we have date-based overpayment and loan start date
    if (startMonth === undefined && overpayment.startDate && loanStartDate) {
        // Calculate months difference between loan start date and overpayment start date
        startMonth = (overpayment.startDate.getFullYear() - loanStartDate.getFullYear()) * 12 +
            (overpayment.startDate.getMonth() - loanStartDate.getMonth());
        // If we have an end date but no explicit endMonth, calculate end month as well
        if (overpayment.endDate && endMonth === undefined) {
            endMonth = (overpayment.endDate.getFullYear() - loanStartDate.getFullYear()) * 12 +
                (overpayment.endDate.getMonth() - loanStartDate.getMonth());
        }
    }
    // Ensure we have valid startMonth (default to 0 if undefined)
    startMonth = startMonth !== null && startMonth !== void 0 ? startMonth : 0;
    // Check if month is within the valid range
    if (month < startMonth)
        return false;
    if (endMonth && month > endMonth)
        return false;
    // For one-time payments, only apply at the exact start month
    if (!overpayment.isRecurring)
        return month === startMonth;
    // For recurring payments, apply based on frequency
    if (overpayment.frequency === "monthly") {
        return month >= startMonth && (!endMonth || month <= endMonth); // Apply every month within the range
    }
    if (overpayment.frequency === "quarterly") {
        // Apply at start month and every 3 months after
        return month === startMonth || (month - startMonth) % 3 === 0;
    }
    if (overpayment.frequency === "annual") {
        // Apply at start month and every 12 months after
        return month === startMonth || (month - startMonth) % 12 === 0;
    }
    return false;
}
/**
 * Apply all overpayments in one pass
 */
function performOverpayments(schedule, overpayments, loanStartDate, loanDetails) {
    if (loanDetails === void 0) { loanDetails = { principal: 0, interestRatePeriods: [], loanTerm: 0, overpaymentPlans: [], startDate: new Date(), name: '' }; }
    if (!overpayments.length)
        return schedule;
    var current = __spreadArray([], schedule, true);
    // Find last payment with positive balance
    var lastActivePayment = current.findIndex(function (p) { return p.balance <= 0; });
    var effectiveLength = lastActivePayment === -1 ? current.length : lastActivePayment + 1;
    var _loop_1 = function (m) {
        // Stop if loan is already paid off
        if (!current[m - 1] || current[m - 1].balance <= 0) {
            return "break";
        }
        // Find applicable overpayments for month m
        var applicableOps = overpayments.filter(function (op) { return isOverpaymentApplicable(op, m, loanStartDate); });
        if (applicableOps.length) {
            var totalAmount = applicableOps.reduce(function (sum, op) { return sum + op.amount; }, 0);
            // Use the effect from the largest overpayment if multiple are applied
            var primaryOverpayment = applicableOps.reduce(function (prev, current) { return (current.amount > prev.amount ? current : prev); }, applicableOps[0]);
            var effect = primaryOverpayment.effect || "reduceTerm";
            try {
                // Ensure we don't overpay more than remaining balance
                var maxOverpayment = current[m - 1].balance;
                var safeAmount = Math.min(totalAmount, maxOverpayment);
                var result = applyOverpayment(current, safeAmount, m, loanDetails, effect);
                current = result.amortizationSchedule;
                // Recalculate totalInterest for all payments after this overpayment
                var cumulativeInterest = m > 1 ? current[m - 2].totalInterest : 0;
                for (var i = m - 1; i < current.length; i++) {
                    cumulativeInterest += current[i].interestPayment;
                    current[i].totalInterest = (0, utils_1.roundToCents)(cumulativeInterest);
                }
            }
            catch (error) {
                return "break";
            }
        }
    };
    for (var m = 1; m <= effectiveLength; m++) {
        var state_1 = _loop_1(m);
        if (state_1 === "break")
            break;
    }
    return current;
}
/**
 * Turn a raw schedule into final results
 */
function finalizeResults(schedule, originalTerm) {
    var _a;
    var totalInterest = schedule.reduce(function (sum, p) { return sum + p.interestPayment; }, 0);
    var yearlyData = aggregateYearlyData(schedule);
    var lastPayment = schedule.find(function (p) { return p.balance === 0; });
    var actualTerm = lastPayment
        ? lastPayment.payment / 12
        : schedule.length / 12;
    return {
        monthlyPayment: ((_a = schedule[0]) === null || _a === void 0 ? void 0 : _a.monthlyPayment) || 0,
        totalInterest: totalInterest,
        amortizationSchedule: schedule,
        yearlyData: yearlyData,
        originalTerm: originalTerm,
        actualTerm: actualTerm
    };
}
