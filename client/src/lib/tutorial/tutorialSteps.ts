import type { ExperienceLevel } from '../../components/ExperienceLevelAssessment';

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  showFor?: ExperienceLevel[];
  isLastStep?: boolean;
}

// Intermediate and Advanced tutorial steps
const INTERMEDIATE_ADVANCED_STEPS: TutorialStep[] = [
  {
    id: 'advanced-features',
    title: 'Advanced Features',
    content: 'Explore overpayment options and scenario comparisons.',
    target: '#advanced-features',
    placement: 'right',
    showFor: ['intermediate', 'advanced'],
  },
  {
    id: 'optimization-tools',
    title: 'Optimization Tools',
    content: 'Use these tools to optimize your mortgage payments and explore different scenarios.',
    target: '#optimization-tools',
    placement: 'right',
    showFor: ['intermediate', 'advanced'],
  },
  {
    id: 'comparative-analysis',
    title: 'Comparative Analysis',
    content: 'Compare different mortgage scenarios side by side.',
    target: '#comparison-section',
    placement: 'bottom',
    showFor: ['intermediate', 'advanced'],
  },
  {
    id: 'advanced-calculations',
    title: 'Advanced Calculations',
    content: 'Access detailed amortization schedules and advanced payment calculations.',
    target: '#advanced-calculations',
    placement: 'left',
    showFor: ['advanced'],
  },
  {
    id: 'power-features',
    title: 'Power User Features',
    content: 'Quick shortcuts and batch scenario analysis tools.',
    target: '#power-features',
    placement: 'top',
    showFor: ['advanced'],
  },
];

export function getTutorialSteps(experienceLevel: ExperienceLevel): TutorialStep[] {
  return INTERMEDIATE_ADVANCED_STEPS.filter(
    (step) => !step.showFor || step.showFor.includes(experienceLevel)
  );
}
