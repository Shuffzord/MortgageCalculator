import { CalculationResults } from './calculation';

export interface LoanData {
  id: string;
  title: string;
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  downPayment?: number;
  extraPayments?: Array<{
    month: number;
    amount: number;
    type: 'monthly' | 'yearly' | 'one-time';
  }>;
}

export interface ComparisonMetrics {
  totalCost: number;
  monthlyPayment: number;
  totalInterest: number;
  interestSavings: number;
  payoffDate: string;
  rank: number;
}

export interface ComparisonResults {
  loans: Array<{
    loan: LoanData;
    results: CalculationResults;
    metrics: ComparisonMetrics;
  }>;
  summary: {
    bestLoan: {
      id: string;
      title: string;
      reason: string;
    };
    worstLoan: {
      id: string;
      title: string;
      reason: string;
    };
    totalSavings: number;
    averageRate: number;
  };
  charts: {
    monthlyPayments: Array<{ loanId: string; amount: number }>;
    totalCosts: Array<{ loanId: string; amount: number }>;
    interestComparison: Array<{ loanId: string; amount: number }>;
  };
}

export interface LoanComparison {
  id: string;
  userId: string;
  title: string;
  loans: LoanData[];
  results: ComparisonResults;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateComparisonData {
  title: string;
  loans: LoanData[];
}

export interface UpdateComparisonData {
  title?: string;
  loans?: LoanData[];
}

export interface ComparisonListResponse {
  comparisons: LoanComparison[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Validation rules for loan comparison
export const COMPARISON_VALIDATION_RULES = {
  title: {
    minLength: 1,
    maxLength: 100
  },
  loans: {
    min: 2,
    max: 5
  },
  loanAmount: {
    min: 1000,
    max: 10000000
  },
  interestRate: {
    min: 0.01,
    max: 50
  },
  loanTerm: {
    min: 1,
    max: 50
  }
};