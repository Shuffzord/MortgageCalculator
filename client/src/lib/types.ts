// Core Types

export type RepaymentModel = 'equalInstallments' | 'decreasingInstallments' | 'custom';

export interface LoanDetails {
  principal: number;
  interestRatePeriods: InterestRatePeriod[];
  loanTerm: number;
  overpaymentPlans: OverpaymentDetails[];
  startDate: Date;
  name: string;
  currency?: string;
  dateCreated?: string;
  repaymentModel?: RepaymentModel;
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

/**
 * Unified payment data structure for amortization schedule and calculations
 * Provides a consistent interface for all payment-related operations
 */
export interface PaymentData {
  // Payment identifier
  payment: number;             // Payment number (1-based index)
  
  // Payment amounts
  monthlyPayment: number;      // Total monthly payment amount
  principalPayment: number;    // Portion of payment going to principal
  interestPayment: number;     // Portion of payment going to interest
  
  // Balances and totals
  balance: number;             // Remaining loan balance after payment
  totalInterest: number;       // Cumulative interest paid up to this payment
  totalPayment: number;        // Total amount paid up to this payment
  
  // Overpayment related
  isOverpayment: boolean;      // Whether this payment includes an overpayment
  overpaymentAmount: number;   // Extra amount paid toward principal
  
  // Additional data
  paymentDate?: Date;          // Date when payment is made
  currency?: string;           // Currency symbol for display purposes
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
  amortizationSchedule: PaymentData[];
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

export interface OverpaymentResult {
  originalCalculation: CalculationResults;
  newCalculation: CalculationResults;
  interestSaved: number;
}