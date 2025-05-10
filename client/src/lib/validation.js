"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateInputs = validateInputs;
function validateInputs(principal, interestRatePeriods, loanTerm, overpaymentPlan) {
    try {
        if (principal <= 0)
            throw new Error('Principal must be greater than 0');
        if (!interestRatePeriods || interestRatePeriods.length === 0)
            throw new Error('Interest rate periods must not be empty');
        for (var _i = 0, interestRatePeriods_1 = interestRatePeriods; _i < interestRatePeriods_1.length; _i++) {
            var period = interestRatePeriods_1[_i];
            if (period.interestRate < 0)
                throw new Error('Interest rate cannot be negative');
        }
        if (loanTerm <= 0)
            throw new Error('Loan term must be greater than 0');
        if (overpaymentPlan) {
            if (overpaymentPlan.amount <= 0)
                throw new Error('Overpayment amount must be greater than 0');
            if (overpaymentPlan.startMonth !== undefined && overpaymentPlan.startMonth < 1)
                throw new Error('Start month must be greater than 0');
            if (overpaymentPlan.endMonth && overpaymentPlan.startMonth !== undefined &&
                overpaymentPlan.endMonth <= overpaymentPlan.startMonth) {
                throw new Error('End month must be after start month');
            }
        }
        return true;
    }
    catch (error) {
        return false;
    }
}
