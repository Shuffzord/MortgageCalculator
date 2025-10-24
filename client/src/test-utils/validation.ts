export function isValidLoanAmount(amount: number): boolean {
  return amount >= 1000 && amount <= 10000000;
}

export function isValidInterestRate(rate: number): boolean {
  return rate >= 0.1 && rate <= 20;
}

export function isValidLoanTerm(term: number): boolean {
  return term >= 1 && term <= 40;
}