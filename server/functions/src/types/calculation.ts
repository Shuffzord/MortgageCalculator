export interface ExtraPayment {
  month: number;
  amount: number;
  type: 'monthly' | 'yearly' | 'one-time';
}

export interface CalculationResults {
  monthlyPayment: number;
  totalInterest: number;
  totalAmount: number;
  payoffDate: string;
  amortizationSchedule: AmortizationEntry[];
  summary: {
    principalPaid: number;
    interestPaid: number;
    totalPayments: number;
    interestSaved?: number;
    timeSaved?: string;
  };
}

export interface AmortizationEntry {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  extraPayment?: number;
  totalPayment: number;
}

export interface Calculation {
  id: string;
  userId: string;
  title: string;
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  downPayment?: number;
  extraPayments?: ExtraPayment[];
  results: CalculationResults;
  isPublic: boolean;
  publicToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCalculationData {
  title: string;
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  downPayment?: number;
  extraPayments?: ExtraPayment[];
  isPublic?: boolean;
}

export interface UpdateCalculationData {
  title?: string;
  loanAmount?: number;
  interestRate?: number;
  loanTerm?: number;
  downPayment?: number;
  extraPayments?: ExtraPayment[];
  isPublic?: boolean;
}

export interface CalculationListResponse {
  calculations: Calculation[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface UsageStats {
  userId: string;
  month: string; // Format: YYYY-MM
  calculationsSaved: number;
  lastReset: Date;
}

export interface ShareCalculationResponse {
  publicToken: string;
  shareUrl: string;
}

// Validation schemas
export interface CalculationValidationRules {
  loanAmount: {
    min: number;
    max: number;
  };
  interestRate: {
    min: number;
    max: number;
  };
  loanTerm: {
    min: number;
    max: number;
  };
  downPayment: {
    min: number;
    max: number;
  };
  title: {
    minLength: number;
    maxLength: number;
  };
}

export const CALCULATION_VALIDATION_RULES: CalculationValidationRules = {
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
  },
  downPayment: {
    min: 0,
    max: 10000000
  },
  title: {
    minLength: 1,
    maxLength: 100
  }
};

export const TIER_LIMITS = {
  free: {
    maxCalculations: 3
  },
  premium: {
    maxCalculations: -1 // Unlimited
  }
};