import { CalculationResults } from './calculation';

export interface ScenarioData {
  id: string;
  name: string;
  type: 'rate-change' | 'stress-test' | 'what-if';
  parameters: {
    rateChange?: number; // For rate-change scenarios
    stressLevel?: 'mild' | 'moderate' | 'severe'; // For stress-test scenarios
    paymentChange?: number; // For what-if scenarios
    extraPayment?: number; // For what-if scenarios
    termChange?: number; // For what-if scenarios
  };
}

export interface ScenarioResults {
  baseline: CalculationResults;
  scenarios: Array<{
    scenario: ScenarioData;
    results: CalculationResults;
    impact: {
      monthlyPaymentDiff: number;
      totalInterestDiff: number;
      totalCostDiff: number;
      payoffDateDiff: string; // e.g., "+2 years, 3 months"
      riskLevel: 'low' | 'medium' | 'high';
    };
  }>;
  analysis: {
    bestCase: {
      scenarioId: string;
      savings: number;
      description: string;
    };
    worstCase: {
      scenarioId: string;
      additionalCost: number;
      description: string;
    };
    recommendations: string[];
    riskAssessment: {
      overall: 'low' | 'medium' | 'high';
      factors: string[];
    };
  };
}

export interface ScenarioAnalysis {
  id: string;
  userId: string;
  title: string;
  baseCalculationId: string;
  scenarios: ScenarioData[];
  results: ScenarioResults;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateScenarioData {
  title: string;
  baseCalculationId: string;
  scenarios: ScenarioData[];
}

export interface UpdateScenarioData {
  title?: string;
  scenarios?: ScenarioData[];
}

export interface ScenarioListResponse {
  scenarios: ScenarioAnalysis[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Predefined stress test scenarios
export const STRESS_TEST_SCENARIOS = {
  mild: {
    rateIncrease: 1.0, // 1% increase
    description: 'Mild economic downturn'
  },
  moderate: {
    rateIncrease: 2.5, // 2.5% increase
    description: 'Moderate recession'
  },
  severe: {
    rateIncrease: 5.0, // 5% increase
    description: 'Severe economic crisis'
  }
};

// Rate change scenario templates
export const RATE_CHANGE_TEMPLATES = [
  { change: 0.5, description: 'Small rate increase (+0.5%)' },
  { change: 1.0, description: 'Moderate rate increase (+1.0%)' },
  { change: 2.0, description: 'Large rate increase (+2.0%)' },
  { change: -0.5, description: 'Small rate decrease (-0.5%)' },
  { change: -1.0, description: 'Moderate rate decrease (-1.0%)' }
];

// Validation rules for scenarios
export const SCENARIO_VALIDATION_RULES = {
  title: {
    minLength: 1,
    maxLength: 100
  },
  scenarios: {
    min: 1,
    max: 10
  },
  rateChange: {
    min: -10,
    max: 10
  },
  paymentChange: {
    min: -50,
    max: 200
  },
  extraPayment: {
    min: 0,
    max: 100000
  },
  termChange: {
    min: -20,
    max: 20
  }
};