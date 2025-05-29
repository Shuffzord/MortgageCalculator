import type { ExperienceLevel } from '../../components/ExperienceLevelAssessment';

export interface TutorialStep {
  title: string;
  content: string;
  target?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  showFor?: ExperienceLevel[];
}

const ALL_STEPS: TutorialStep[] = [
  {
    title: 'Welcome to the Mortgage Calculator',
    content: 'This tutorial will help you understand how to use the calculator effectively.',
    placement: 'top'
  },
  {
    title: 'Enter Loan Details',
    content: 'Start by entering your loan amount, interest rate, and term.',
    target: '#loan-form',
    placement: 'left'
  },
  {
    title: 'Advanced Features',
    content: 'Explore overpayment options and scenario comparisons.',
    target: '#advanced-features',
    placement: 'right',
    showFor: ['intermediate', 'advanced']
  },
  {
    title: 'View Results',
    content: 'See your monthly payments and amortization schedule.',
    target: '#results-section',
    placement: 'bottom'
  }
];

export function getTutorialSteps(experienceLevel: ExperienceLevel): TutorialStep[] {
  return ALL_STEPS.filter(step => 
    !step.showFor || step.showFor.includes(experienceLevel)
  );
}