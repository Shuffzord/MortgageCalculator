import {
  GlossaryTerm,
  InteractiveExample,
  ConceptExplanation,
  getFinancialGlossary,
  getMortgageConcepts,
  getInteractiveExamples
} from '../educationalContent';
import { useTranslation } from 'react-i18next';
import type { ExperienceLevel } from '../../components/ExperienceLevelAssessment';

export interface BeginnerTutorialStep {
  id: string;
  title: string;
  content: string;
  target?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  glossaryTerms?: GlossaryTerm[];
  concepts?: string[];
  interactiveExample?: string;
  requiredForProgress?: boolean;
  isLastStep?: boolean;
}

export const getBeginnerTutorialSteps = (): BeginnerTutorialStep[] => {
  const { t } = useTranslation();
  const glossary = getFinancialGlossary(t);
  const concepts = getMortgageConcepts(t);
  const examples = getInteractiveExamples(t);

  const steps: BeginnerTutorialStep[] = [
    // Step 1: Loan Amount
    {
      id: 'principal-amount',
      title: t('form.loanAmount'),
      content: `${t('form.loanAmountTooltip')}\n\n${t('education.example')}: ${glossary.principal?.example || ''}`,
      target: 'principal-input',
      placement: 'right',
      glossaryTerms: [glossary.principal].filter(Boolean),
      requiredForProgress: true
    },
    {
      id: 'loan-term',
      title: t('form.loanTerm'),
      content: `${t('form.loanTermTooltip')}\n\n${t('education.example')}: ${glossary.loanTerm?.example || ''}`,
      target: 'loan-term-input',
      placement: 'right',
      glossaryTerms: [glossary.loanTerm].filter(Boolean),
      interactiveExample: 'term-comparison',
      requiredForProgress: true
    },
    {
      id: 'repayment-model',
      title: t('form.repaymentModel'),
      content: `${t('form.repaymentModelTooltip')}\n\n${glossary.equalInstallments?.definition || ''}\n\n${glossary.decreasingInstallments?.definition || ''}`,
      target: 'repayment-model-selector',
      placement: 'right',
      glossaryTerms: [
        glossary.equalInstallments,
        glossary.decreasingInstallments
      ].filter(Boolean),
      requiredForProgress: true
    },
    {
      id: 'interest-rate',
      title: t('form.interestRate'),
      content: `${t('form.interestRateTooltip')}\n\n${glossary.apr?.definition || ''}`,
      target: 'interest-rate-input',
      placement: 'right',
      glossaryTerms: [glossary.interest, glossary.apr].filter(Boolean),
      interactiveExample: 'interest-rate-impact',
      requiredForProgress: true
    },
    {
      id: 'overpayment-section',
      title: t('overpayment.title'),
      content: `${t('overpayment.optimizationTip')}`,
      target: 'overpayments-section',
      placement: 'right',
      glossaryTerms: [glossary.overpayment].filter(Boolean),
      interactiveExample: 'overpayment-impact',
      requiredForProgress: true
    },
    {
      id: 'additional-costs',
      title: t('form.additionalCosts'),
      content: `${t('form.additionalCostsTooltip')}\n\n${t('education.tooltips.originationFee')}\n\n${t('education.tooltips.loanInsurance')}`,
      target: 'additional-costs-section',
      placement: 'left',
      glossaryTerms: [
        glossary.originationFee,
        glossary.loanInsurance
      ].filter(Boolean),
      requiredForProgress: true
    }

    // // Step 8: Calculate Button (NEW)
    // {
    //   id: 'calculate-button',
    //   title: t('form.calculate'),
    //   content: t('education.tooltips.calculateButton'),
    //   target: '[data-testid="calculate-button"]',
    //   placement: 'top',
    //   requiredForProgress: true
    // },
    // // Step 9: Loan Summary (fixed content and target)
    // {
    //   id: 'loan-summary',
    //   title: t('summary.title'),
    //   content: `This loan summary displays the key financial details of your mortgage:\n\n• **Monthly Payment**: ${t('education.tooltips.monthlyPayment')}\n\n• **Total Interest**: ${t('education.tooltips.totalInterest')}\n\n• **Total Payment**: ${t('education.tooltips.totalPayment')}\n\n• **APR**: ${t('education.tooltips.apr')}\n\nThese figures help you understand the true cost of your loan and compare different mortgage options.`,
    //   target: '[data-testid="loan-summary"]',
    //   placement: 'right',
    //   glossaryTerms: [glossary.monthlyPayment, glossary.totalInterest, glossary.apr].filter(Boolean),
    //   requiredForProgress: true
    // },
    // // Step 10: Payment Breakdown (fixed target)
    // {
    //   id: 'payment-breakdown',
    //   title: t('chart.title'),
    //   content: t('education.tooltips.paymentBreakdown'),
    //   target: 'id="payment-breakdown"',
    //   placement: 'right',
    //   requiredForProgress: true
    // },
    // // Step 11: Overpayment Spotlight (NEW)
    // {
    //   id: 'overpayment-spotlight',
    //   title: t('overpayment.savingsSpotlight'),
    //   content: `${t('education.tooltips.overpaymentSpotlight')}\n\nThis visualization shows you:\n\n• **Interest Savings**: How much total interest you can save by making extra payments\n\n• **Time Savings**: How many months or years you can reduce from your loan term\n\n• **Break-even Analysis**: When your overpayments start providing meaningful benefits\n\nEven small additional payments can result in significant long-term savings, making this one of the most powerful tools for optimizing your mortgage.`,
    //   target: '#overpayment-savings-spotlight',
    //   placement: 'right',
    //   glossaryTerms: [glossary.overpayment].filter(Boolean),
    //   requiredForProgress: true
    // },
    // // Step 12: Amortization Schedule (NEW)
    // {
    //   id: 'amortization-schedule',
    //   title: t('schedule.title'),
    //   content: `${glossary.amortization?.definition || ''}\n\n${t('education.tooltips.amortizationSchedule')}`,
    //   target: '#amortization-schedule',
    //   placement: 'top',
    //   glossaryTerms: [glossary.amortization].filter(Boolean),
    //   requiredForProgress: true
    // }
  ];

  // Mark the last step
  if (steps.length > 0) {
    steps[steps.length - 1].isLastStep = true;
  }

  return steps;
};

// Helper function to get steps filtered by experience level
export function getBeginnerSteps(includeOptional: boolean = false): BeginnerTutorialStep[] {
  const steps = getBeginnerTutorialSteps();
  return steps.filter(step =>
    includeOptional || step.requiredForProgress
  );
}

// Helper function to get educational content for a step
export function getStepEducationalContent(stepId: string): {
  glossaryTerms: GlossaryTerm[];
  concepts: ConceptExplanation[];
  interactiveExample: InteractiveExample | null;
} {
  const { t } = useTranslation();
  const steps = getBeginnerTutorialSteps();
  const step = steps.find(s => s.id === stepId);
  if (!step) return { glossaryTerms: [], concepts: [], interactiveExample: null };

  const examples = getInteractiveExamples(t);
  const concepts = getMortgageConcepts(t);

  return {
    glossaryTerms: step.glossaryTerms || [],
    concepts: (step.concepts || []).map(conceptId => concepts[conceptId]).filter(Boolean),
    interactiveExample: step.interactiveExample ?
      examples.find(ex => ex.id === step.interactiveExample) || null :
      null
  };
}