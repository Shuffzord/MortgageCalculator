// Core Types

export interface LoanDetails {
  principal: number;
  interestRatePeriods: InterestRatePeriod[];
  loanTerm: number;
  overpaymentPlans: OverpaymentDetails[];
  startDate?: Date;
  name?: string;
}

export interface InterestRatePeriod {
  startMonth: number;
  interestRate: number;
}

export interface OverpaymentDetails {
  amount: number;
  startMonth: number;
  endMonth?: number;
  isRecurring: boolean;
  frequency: 'monthly' | 'quarterly' | 'annual' | 'one-time';
  afterPayment?: number; // For backwards compatibility
  effect?: 'reduceTerm' | 'reducePayment';
}

// Data Structure Types

export interface MonthlyData {
  payment: number;
  monthlyPayment: number;
  principalPayment: number;
  interestPayment: number;
  balance: number;
  isOverpayment: boolean;
  overpaymentAmount: number;
  totalInterest: number;
  totalPayment: number;
  paymentDate?: Date;  // Optional payment date
}

export interface YearlyData {
  year: number;
  principal: number;
  interest: number;
  payment: number;
  balance: number;
  totalInterest: number;
}

export interface CalculationResults {
  monthlyPayment: number;
  totalInterest: number;
  amortizationSchedule: MonthlyData[];
  yearlyData: YearlyData[];
  originalTerm: number;
  actualTerm: number;
  timeOrPaymentSaved?: number;
}

// Storage Related Types

export interface SavedCalculation {
  id: number;
  name: string;
  date: string;
  loanDetails: LoanDetails;
}


export interface CalculationPeriod {
  startMonth: number;
  endMonth: number;
  basePayment: number;
  overpaymentAmount: number;
}