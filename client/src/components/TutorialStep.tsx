import React from 'react';
import { useTranslation } from 'react-i18next';
import type { TutorialStep as TutorialStepType } from '../lib/tutorial/tutorialSteps';

export interface TutorialStepProps {
  step: TutorialStepType;
  onComplete: () => void;
  onSkip: () => void;
  isLastStep: boolean;
}

export function TutorialStep({
  step,
  onComplete,
  onSkip,
  isLastStep
}: TutorialStepProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{step.title}</h3>
      <p className="text-gray-600">{step.content}</p>
      
      <div className="flex justify-end space-x-4">
        <button
          onClick={onSkip}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          {t('tutorial.common.skip')}
        </button>
        
        <button
          onClick={onComplete}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          {isLastStep ? t('tutorial.common.last') : t('tutorial.common.next')}
        </button>
      </div>
    </div>
  );
}