import React, { useEffect } from 'react';
import { tutorialAnalytics } from '../lib/tutorial/analytics';
import { useTutorialStore } from '../lib/tutorial/tutorialState';
import { getTutorialSteps } from '../lib/tutorial/tutorialSteps';
import type { ExperienceLevel } from './ExperienceLevelAssessment';
import { TutorialStep } from './TutorialStep';
import { TutorialProgress } from './TutorialProgress';

interface TutorialOverlayProps {
  isActive: boolean;
  experienceLevel: ExperienceLevel;
  onComplete: () => void;
  onSkip: () => void;
}

export function TutorialOverlay({
  isActive,
  experienceLevel,
  onComplete,
  onSkip
}: TutorialOverlayProps) {
  const tutorialState = useTutorialStore.getState();
  const steps = getTutorialSteps(experienceLevel);

  useEffect(() => {
    if (isActive) {
      tutorialAnalytics.tutorialStarted(experienceLevel);
      tutorialState.startTutorial();
    }
  }, [isActive, experienceLevel]);

  const handleStepComplete = (stepIndex: number) => {
    tutorialAnalytics.stepCompleted(stepIndex);
    tutorialState.completeStep(stepIndex);

    if (stepIndex === steps.length - 1) {
      tutorialAnalytics.tutorialCompleted(experienceLevel);
      tutorialState.completeTutorial();
      onComplete();
    }
  };

  const handleSkip = () => {
    tutorialAnalytics.tutorialAbandoned(tutorialState.currentStep, experienceLevel);
    tutorialState.abandonTutorial();
    onSkip();
  };

  if (!isActive) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <TutorialProgress
          currentStep={tutorialState.currentStep}
          totalSteps={steps.length}
        />
        
        <TutorialStep
          step={steps[tutorialState.currentStep]}
          onComplete={() => handleStepComplete(tutorialState.currentStep)}
          onSkip={handleSkip}
          isLastStep={tutorialState.currentStep === steps.length - 1}
        />
      </div>
    </div>
  );
}