import { useTranslation } from 'react-i18next';

export interface GlossaryTerm {
  term: string;
  definition: string;
  example?: string;
}

export interface ConceptExplanation {
  concept: string;
  explanation: string;
  impact: string;
  example?: string;
  relatedTerms?: string[];
}

export interface InteractiveExample {
  id: string;
  title: string;
  description: string;
  defaultValues: {
    principal: number;
    interestRate: number;
    term: number;
    [key: string]: any;
  };
  scenarios: {
    name: string;
    values: {
      [key: string]: any;
    };
    outcome: string;
  }[];
}

export const getFinancialGlossary = (t: (key: string) => string): Record<string, GlossaryTerm> => ({
  'principal': {
    term: t('financialGlossary.principal.term'),
    definition: t('financialGlossary.principal.definition'),
    example: t('financialGlossary.principal.example')
  },
  'interest': {
    term: t('financialGlossary.interest.term'),
    definition: t('financialGlossary.interest.definition'),
    example: t('financialGlossary.interest.example')
  },
  'apr': {
    term: t('financialGlossary.apr.term'),
    definition: t('financialGlossary.apr.definition'),
    example: t('financialGlossary.apr.example')
  },
  'amortization': {
    term: t('financialGlossary.amortization.term'),
    definition: t('financialGlossary.amortization.definition'),
    example: t('financialGlossary.amortization.example')
  },
  'equalInstallments': {
    term: t('financialGlossary.equalInstallments.term'),
    definition: t('financialGlossary.equalInstallments.definition'),
    example: t('financialGlossary.equalInstallments.example')
  },
  'decreasingInstallments': {
    term: t('financialGlossary.decreasingInstallments.term'),
    definition: t('financialGlossary.decreasingInstallments.definition'),
    example: t('financialGlossary.decreasingInstallments.example')
  },
  'overpayment': {
    term: t('financialGlossary.overpayment.term'),
    definition: t('financialGlossary.overpayment.definition'),
    example: t('financialGlossary.overpayment.example')
  },
  'loanTerm': {
    term: t('financialGlossary.loanTerm.term'),
    definition: t('financialGlossary.loanTerm.definition'),
    example: t('financialGlossary.loanTerm.example')
  },
  'interestRatePeriods': {
    term: t('financialGlossary.interestRatePeriods.term'),
    definition: t('financialGlossary.interestRatePeriods.definition'),
    example: t('financialGlossary.interestRatePeriods.example')
  },
  'originationFee': {
    term: t('financialGlossary.originationFee.term'),
    definition: t('financialGlossary.originationFee.definition'),
    example: t('financialGlossary.originationFee.example')
  },
  'loanInsurance': {
    term: t('financialGlossary.loanInsurance.term'),
    definition: t('financialGlossary.loanInsurance.definition'),
    example: t('financialGlossary.loanInsurance.example')
  },
  'earlyRepaymentFee': {
    term: t('financialGlossary.earlyRepaymentFee.term'),
    definition: t('financialGlossary.earlyRepaymentFee.definition'),
    example: t('financialGlossary.earlyRepaymentFee.example')
  },
  'breakEvenPoint': {
    term: t('financialGlossary.breakEvenPoint.term'),
    definition: t('financialGlossary.breakEvenPoint.definition'),
    example: t('financialGlossary.breakEvenPoint.example')
  }
});

export const getMortgageConcepts = (t: (key: string) => string): Record<string, ConceptExplanation> => ({
  'repaymentModels': {
    concept: t('mortgageConcepts.repaymentModels.concept'),
    explanation: t('mortgageConcepts.repaymentModels.explanation'),
    impact: t('mortgageConcepts.repaymentModels.impact'),
    example: t('mortgageConcepts.repaymentModels.example'),
    relatedTerms: ['equalInstallments', 'decreasingInstallments', 'amortization']
  },
  'overpayments': {
    concept: t('mortgageConcepts.overpayments.concept'),
    explanation: t('mortgageConcepts.overpayments.explanation'),
    impact: t('mortgageConcepts.overpayments.impact'),
    example: t('mortgageConcepts.overpayments.example'),
    relatedTerms: ['principal', 'interest', 'loanTerm']
  },
  'interestRateChanges': {
    concept: t('mortgageConcepts.interestRateChanges.concept'),
    explanation: t('mortgageConcepts.interestRateChanges.explanation'),
    impact: t('mortgageConcepts.interestRateChanges.impact'),
    example: t('mortgageConcepts.interestRateChanges.example'),
    relatedTerms: ['interestRatePeriods', 'apr']
  },
  'additionalCosts': {
    concept: t('mortgageConcepts.additionalCosts.concept'),
    explanation: t('mortgageConcepts.additionalCosts.explanation'),
    impact: t('mortgageConcepts.additionalCosts.impact'),
    example: t('mortgageConcepts.additionalCosts.example'),
    relatedTerms: ['originationFee', 'loanInsurance', 'earlyRepaymentFee', 'apr']
  },
  'amortizationSchedule': {
    concept: t('mortgageConcepts.amortizationSchedule.concept'),
    explanation: t('mortgageConcepts.amortizationSchedule.explanation'),
    impact: t('mortgageConcepts.amortizationSchedule.impact'),
    example: t('mortgageConcepts.amortizationSchedule.example'),
    relatedTerms: ['amortization', 'principal', 'interest']
  },
  'comparativeAnalysis': {
    concept: t('mortgageConcepts.comparativeAnalysis.concept'),
    explanation: t('mortgageConcepts.comparativeAnalysis.explanation'),
    impact: t('mortgageConcepts.comparativeAnalysis.impact'),
    example: t('mortgageConcepts.comparativeAnalysis.example'),
    relatedTerms: ['breakEvenPoint', 'loanTerm', 'interestRatePeriods']
  }
});

export const getInteractiveExamples = (t: (key: string) => string): InteractiveExample[] => [
  {
    id: 'term-comparison',
    title: t('interactiveExamples.term-comparison.title'),
    description: t('interactiveExamples.term-comparison.description'),
    defaultValues: {
      principal: 300000,
      interestRate: 4.0,
      term: 30
    },
    scenarios: [
      {
        name: t('interactiveExamples.term-comparison.scenarios.15year.name'),
        values: {
          term: 15
        },
        outcome: t('interactiveExamples.term-comparison.scenarios.15year.outcome')
      },
      {
        name: t('interactiveExamples.term-comparison.scenarios.30year.name'),
        values: {
          term: 30
        },
        outcome: t('interactiveExamples.term-comparison.scenarios.30year.outcome')
      }
    ]
  },
  {
    id: 'overpayment-impact',
    title: t('interactiveExamples.overpayment-impact.title'),
    description: t('interactiveExamples.overpayment-impact.description'),
    defaultValues: {
      principal: 300000,
      interestRate: 4.0,
      term: 30,
      overpayment: 0
    },
    scenarios: [
      {
        name: t('interactiveExamples.overpayment-impact.scenarios.none.name'),
        values: {
          overpayment: 0
        },
        outcome: t('interactiveExamples.overpayment-impact.scenarios.none.outcome')
      },
      {
        name: t('interactiveExamples.overpayment-impact.scenarios.small.name'),
        values: {
          overpayment: 100
        },
        outcome: t('interactiveExamples.overpayment-impact.scenarios.small.outcome')
      },
      {
        name: t('interactiveExamples.overpayment-impact.scenarios.large.name'),
        values: {
          overpayment: 500
        },
        outcome: t('interactiveExamples.overpayment-impact.scenarios.large.outcome')
      }
    ]
  },
  {
    id: 'interest-rate-impact',
    title: t('interactiveExamples.interest-rate-impact.title'),
    description: t('interactiveExamples.interest-rate-impact.description'),
    defaultValues: {
      principal: 300000,
      interestRate: 4.0,
      term: 30
    },
    scenarios: [
      {
        name: t('interactiveExamples.interest-rate-impact.scenarios.lower.name'),
        values: {
          interestRate: 3.0
        },
        outcome: t('interactiveExamples.interest-rate-impact.scenarios.lower.outcome')
      },
      {
        name: t('interactiveExamples.interest-rate-impact.scenarios.standard.name'),
        values: {
          interestRate: 4.0
        },
        outcome: t('interactiveExamples.interest-rate-impact.scenarios.standard.outcome')
      },
      {
        name: t('interactiveExamples.interest-rate-impact.scenarios.higher.name'),
        values: {
          interestRate: 5.0
        },
        outcome: t('interactiveExamples.interest-rate-impact.scenarios.higher.outcome')
      }
    ]
  }
];