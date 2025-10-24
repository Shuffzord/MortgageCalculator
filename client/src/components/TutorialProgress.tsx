import React from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

interface TutorialProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function TutorialProgress({
  currentStep,
  totalSteps
}: TutorialProgressProps) {
  const { t } = useTranslation();
  const displayStep = currentStep + 1; // Convert to 1-based index for display

  return (
    <div className="mb-4 space-y-2">
      <p className="text-sm text-gray-600">
        {t('tutorial.progress.step', {
          current: displayStep,
          total: totalSteps
        })}
      </p>
      
      <ul className="flex space-x-2">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <li
            key={index}
            className={clsx(
              'h-1 flex-1 rounded',
              {
                'bg-blue-500': index <= currentStep,
                'bg-gray-300': index > currentStep
              }
            )}
            aria-label={
              index === currentStep
                ? 'Current step'
                : index < currentStep
                ? 'Completed step'
                : 'Future step'
            }
          />
        ))}
      </ul>
    </div>
  );
}