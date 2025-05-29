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
    {
      id: 'principal-amount',
      title: t('form.loanAmount'),
      content: `${glossary.principal.definition}\n\n${t('education.example')}: ${glossary.principal.example}`,
      target: '#principal-input',
      placement: 'left',
      glossaryTerms: [glossary.principal],
      concepts: ['repaymentModels'],
      requiredForProgress: true
    },
    {
      id: 'interest-rate',
      title: t('form.interestRate'),
      content: `${glossary.interest.definition}\n\n${glossary.apr.definition}\n\n${t('education.example')}: ${glossary.interest.example}`,
      target: '#interest-rate-input',
      placement: 'left',
      glossaryTerms: [glossary.interest, glossary.apr],
      concepts: ['interestRateChanges'],
      interactiveExample: 'interest-rate-impact',
      requiredForProgress: true
    },
    {
      id: 'loan-term',
      title: t('form.loanTerm'),
      content: `${glossary.loanTerm.definition}\n\n${t('education.example')}: ${glossary.loanTerm.example}`,
      target: '#loan-term-input',
      placement: 'left',
      glossaryTerms: [glossary.loanTerm],
      interactiveExample: 'term-comparison',
      requiredForProgress: true
    },
    {
      id: 'repayment-model',
      title: t('form.repaymentModel'),
      content: `${concepts.repaymentModels.explanation}\n\n${glossary.equalInstallments.definition}\n\n${glossary.decreasingInstallments.definition}`,
      target: '#repayment-model-selector',
      placement: 'right',
      glossaryTerms: [
        glossary.equalInstallments,
        glossary.decreasingInstallments
      ],
      concepts: ['repaymentModels'],
      requiredForProgress: true
    },
    {
      id: 'amortization-intro',
      title: t('financialGlossary.amortization.term'),
      content: `${glossary.amortization.definition}\n\n${concepts.amortizationSchedule.explanation}\n\n${t('education.example')}: ${glossary.amortization.example}`,
      target: '#amortization-schedule',
      placement: 'top',
      glossaryTerms: [glossary.amortization],
      concepts: ['amortizationSchedule'],
      requiredForProgress: true
    },
    {
      id: 'monthly-payment',
      title: t('summary.monthlyPayment'),
      content: `${t('education.tooltips.principal')}\n\n${t('education.tooltips.interestRate')}`,
      target: '#payment-breakdown',
      placement: 'bottom',
      glossaryTerms: [glossary.principal, glossary.interest],
      requiredForProgress: true
    },
    {
      id: 'additional-costs',
      title: t('form.additionalCosts'),
      content: `${concepts.additionalCosts.explanation}\n\n${t('education.tooltips.originationFee')}\n\n${t('education.tooltips.loanInsurance')}`,
      target: '#additional-costs-section',
      placement: 'right',
      glossaryTerms: [
        glossary.originationFee,
        glossary.loanInsurance
      ],
      concepts: ['additionalCosts'],
      requiredForProgress: false
    },
    {
      id: 'overpayment-intro',
      title: t('overpayment.title'),
      content: `${concepts.overpayments.explanation}\n\n${glossary.overpayment.definition}\n\n${t('education.example')}: ${glossary.overpayment.example}`,
      target: '#overpayment-section',
      placement: 'left',
      glossaryTerms: [glossary.overpayment],
      concepts: ['overpayments'],
      interactiveExample: 'overpayment-impact',
      requiredForProgress: false
    },
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