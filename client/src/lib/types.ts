// Core Types

export interface LoanDetails {
  principal: number;
  interestRate: number;
  loanTerm: number;
}

export interface OverpaymentDetails {
  amount: number;
  afterPayment: number;
  effect: 'reduceTerm' | 'reducePayment';
}

// Data Structure Types

export interface MonthlyData {
  payment: number;
  monthlyPayment: number;
  principalPayment: number;
  interestPayment: number;
  balance: number;
}

export interface YearlyData {
  year: number;
  principal: number;
  interest: number;
  payment: number;
  balance: number;
}

export interface CalculationResults {
  monthlyPayment: number;
  totalInterest: number;
  amortizationSchedule: MonthlyData[];
  yearlyData: YearlyData[];
  timeOrPaymentSaved?: number;
}

// Storage Related Types

export interface SavedCalculation {
  id: number;
  name: string;
  date: string;
  loanDetails: LoanDetails;
  overpayment: OverpaymentDetails;
}
