// Shared API types for frontend-backend communication
// These types mirror the backend API types for type safety

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ErrorResponse {
  error: string;
}

// User Types
export enum UserTier {
  Free = 'free',
  Premium = 'premium'
}

export interface User {
  uid: string;
  email: string;
  createdAt: string;
  displayName?: string;
  photoURL?: string;
  tier: UserTier;
  profile?: UserProfile;
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  displayName?: string;
  photoURL?: string;
  profile?: UserProfile;
}

export interface UpdateUserData {
  displayName?: string;
  photoURL?: string;
  profile?: UserProfile;
}

export interface UpdateUserTierData {
  tier: UserTier;
}

export interface UserLimits {
  maxCalculations: number;
  maxSavedScenarios: number;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends CreateUserData {}

export interface TokenResponse {
  token: string;
  user: Partial<User>;
}

export interface UserResponse {
  user: Partial<User>;
}

// Calculation Types
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

export interface ShareCalculationResponse {
  publicToken: string;
  shareUrl: string;
}

export interface UsageStats {
  userId: string;
  month: string; // Format: YYYY-MM
  calculationsSaved: number;
  lastReset: Date;
}

// Comparison Types
export interface Comparison {
  id: string;
  userId: string;
  title: string;
  calculations: string[]; // Array of calculation IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateComparisonData {
  title: string;
  calculations: string[];
}

export interface UpdateComparisonData {
  title?: string;
  calculations?: string[];
}

export interface ComparisonListResponse {
  comparisons: Comparison[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Scenario Types
export interface Scenario {
  id: string;
  userId: string;
  title: string;
  description?: string;
  baseCalculation: string; // Calculation ID
  variations: ScenarioVariation[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ScenarioVariation {
  id: string;
  name: string;
  parameters: {
    loanAmount?: number;
    interestRate?: number;
    loanTerm?: number;
    downPayment?: number;
    extraPayments?: ExtraPayment[];
  };
  results?: CalculationResults;
}

export interface CreateScenarioData {
  title: string;
  description?: string;
  baseCalculation: string;
  variations: Omit<ScenarioVariation, 'id' | 'results'>[];
}

export interface UpdateScenarioData {
  title?: string;
  description?: string;
  baseCalculation?: string;
  variations?: ScenarioVariation[];
}

export interface ScenarioListResponse {
  scenarios: Scenario[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Export Types
export interface ExportRequest {
  calculationId: string;
  format: 'pdf' | 'csv' | 'excel';
  options?: {
    includeAmortization?: boolean;
    includeCharts?: boolean;
    includeSummary?: boolean;
  };
}

export interface ExportResponse {
  downloadUrl: string;
  expiresAt: string;
}

// Payment Types
export interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
  priceId?: string;
  quantity?: number;
}

export interface PaymentHistory {
  id: string;
  userId: string;
  stripePaymentIntentId: string;
  stripeInvoiceId?: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed' | 'canceled' | 'requires_action';
  description?: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface CreateCheckoutSessionRequest {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  mode?: 'payment' | 'subscription' | 'setup';
}

export interface CreateCheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface SubscriptionStatus {
  subscription: Subscription | null;
  isActive: boolean;
  daysUntilExpiry?: number;
  gracePeriodActive?: boolean;
}

export interface CustomerPortalResponse {
  url: string;
}

export interface PaymentMethodInfo {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  priceId: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
}

// API Request/Response wrapper types
export type ApiRequest<T = any> = T;

// Loading and Error State Types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// Validation Rules
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