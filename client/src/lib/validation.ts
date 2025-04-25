import { OverpaymentDetails } from "./types";

export function validateInputs(
  principal: number,
  interestRate: number,
  loanTerm: number,
  overpaymentPlan?: OverpaymentDetails
): boolean {
  try {
    if (principal <= 0) throw new Error('Principal must be greater than 0');
    if (interestRate < 0) throw new Error('Interest rate cannot be negative');
    if (loanTerm <= 0) throw new Error('Loan term must be greater than 0');
    
    if (overpaymentPlan) {
      if (overpaymentPlan.amount <= 0) throw new Error('Overpayment amount must be greater than 0');
      if (overpaymentPlan.startMonth < 1) throw new Error('Start month must be greater than 0');
      if (overpaymentPlan.endMonth && overpaymentPlan.endMonth <= overpaymentPlan.startMonth) {
        throw new Error('End month must be after start month');
      }
    }
    return true;
  } catch (error) {
    return false;
  }
}