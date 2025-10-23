export interface LoanTestData {
  amount: string;
  interestRate: string;
  term: string;
  expectedMonthlyPayment?: string;
}

export function createBasicLoanData(): LoanTestData {
  return {
    amount: '250000',
    interestRate: '4.5',
    term: '30',
    expectedMonthlyPayment: '1266.71',
  };
}

export function createShortTermLoanData(): LoanTestData {
  return {
    amount: '200000',
    interestRate: '3.5',
    term: '15',
    expectedMonthlyPayment: '1429.77',
  };
}
