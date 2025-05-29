import React, { useEffect, memo, CSSProperties, useCallback } from 'react';
import { tutorialAnalytics } from '../lib/tutorial/analytics';
import { useTutorialStore } from '../lib/tutorial/tutorialState';
import { getBeginnerSteps, getStepEducationalContent } from '../lib/tutorial/beginnerTutorialSteps';
import { getTutorialSteps, type TutorialStep as BaseTutorialStep } from '../lib/tutorial/tutorialSteps';
import type { BeginnerTutorialStep } from '../lib/tutorial/beginnerTutorialSteps';
import type { ExperienceLevel } from './ExperienceLevelAssessment';
import { TutorialStep as StepComponent } from './TutorialStep';
import { TutorialProgress } from './TutorialProgress';
import { EducationalContent } from './tutorial/EducationalContent';

interface TutorialOverlayProps {
  isActive: boolean;
  experienceLevel: ExperienceLevel;
  onComplete: () => void;
  onSkip: () => void;
}

type Placement = 'top' | 'bottom' | 'left' | 'right';
type PositionStyle = Partial<Record<'top' | 'bottom' | 'left' | 'right', number>>;

function getPositionForTarget(targetId: string, placement: Placement = 'bottom'): PositionStyle {
  const targetElement = document.getElementById(targetId);
  if (!targetElement) return {};

  // Add highlight class to target element
  targetElement.classList.add('tutorial-target');
  
  const rect = targetElement.getBoundingClientRect();
  const positions: PositionStyle = {};
  const PADDING = 10; // Reduced padding from window edges
  const TUTORIAL_WIDTH = 350; // Slightly reduced width for better positioning
  const TUTORIAL_HEIGHT = 350; // Reduced height to match width

  switch (placement) {
    case 'top':
      positions.bottom = Math.min(
        window.innerHeight - rect.top + 10,
        window.innerHeight - TUTORIAL_HEIGHT - PADDING
      );
      positions.left = Math.min(
        Math.max(rect.left + (rect.width / 2), TUTORIAL_WIDTH / 2 + PADDING),
        window.innerWidth - TUTORIAL_WIDTH / 2 - PADDING
      );
      break;
    case 'bottom':
      positions.top = Math.min(
        rect.bottom + 10,
        window.innerHeight - TUTORIAL_HEIGHT - PADDING
      );
      positions.left = Math.min(
        Math.max(rect.left + (rect.width / 2), TUTORIAL_WIDTH / 2 + PADDING),
        window.innerWidth - TUTORIAL_WIDTH / 2 - PADDING
      );
      break;
    case 'left':
      positions.right = Math.min(
        window.innerWidth - rect.left + 10,
        window.innerWidth - TUTORIAL_WIDTH - PADDING
      );
      positions.top = Math.min(
        Math.max(rect.top + (rect.height / 2), TUTORIAL_HEIGHT / 2 + PADDING),
        window.innerHeight - TUTORIAL_HEIGHT / 2 - PADDING
      );
      break;
    case 'right':
      positions.left = Math.min(
        rect.right + 10,
        window.innerWidth - TUTORIAL_WIDTH - PADDING
      );
      positions.top = Math.min(
        Math.max(rect.top + (rect.height / 2), TUTORIAL_HEIGHT / 2 + PADDING),
        window.innerHeight - TUTORIAL_HEIGHT / 2 - PADDING
      );
      break;
  }

  return positions;
}

const UnmemoizedTutorialOverlay: React.FC<TutorialOverlayProps> = ({
  isActive,
  experienceLevel,
  onComplete,
  onSkip
}) => {
  const {
    currentStep: stepIndex,
    startTutorial,
    completeStep,
    completeTutorial,
    abandonTutorial
  } = useTutorialStore();

  // Get appropriate steps based on experience level
  const steps = experienceLevel === 'beginner'
    ? getBeginnerSteps()
    : getTutorialSteps(experienceLevel);
  
  const currentStep = steps[stepIndex];
  
  // Type guard for beginner tutorial step
  const isBeginnerStep = (
    step: BeginnerTutorialStep | BaseTutorialStep
  ): step is BeginnerTutorialStep => {
    return experienceLevel === 'beginner';
  };

  // Get educational content only for beginner steps
  const educationalContent = currentStep && isBeginnerStep(currentStep)
    ? getStepEducationalContent(currentStep.id)
    : null;

  useEffect(() => {
    if (isActive) {
      tutorialAnalytics.tutorialStarted(experienceLevel);
      startTutorial();
    }
    
    // Cleanup function to handle component unmount
    return () => {
      if (isActive) {
        abandonTutorial();
      }
      // Remove highlight class from any previous target
      const prevTarget = document.querySelector('.tutorial-target');
      if (prevTarget) {
        prevTarget.classList.remove('tutorial-target');
      }
    };
  }, [isActive, experienceLevel, startTutorial, abandonTutorial]);

  // Handle cleanup of previous target when step changes
  useEffect(() => {
    return () => {
      const prevTarget = document.querySelector('.tutorial-target');
      if (prevTarget) {
        prevTarget.classList.remove('tutorial-target');
      }
    };
  }, [stepIndex]);

  // Track when educational content is viewed
  const handleEducationalContentView = useCallback((contentId: string) => {
    if (currentStep && isBeginnerStep(currentStep)) {
      useTutorialStore.getState().viewEducationalContent(contentId);
      tutorialAnalytics.educationalContentViewed(contentId);
    }
  }, [currentStep, experienceLevel]);

  const handleStepComplete = (currentStepIndex: number): void => {
    tutorialAnalytics.stepCompleted(currentStepIndex);
    
    if (currentStep && isBeginnerStep(currentStep)) {
      // Complete section and any interactive examples
      useTutorialStore.getState().completeSection(currentStep.id);
      if (educationalContent?.interactiveExample) {
        useTutorialStore.getState().completeInteractiveExample(currentStep.id);
      }
    }
    
    completeStep(currentStepIndex);

    if (currentStepIndex === steps.length - 1) {
      tutorialAnalytics.tutorialCompleted(experienceLevel);
      completeTutorial();
      onComplete();
    }
  };

  const handleExampleComplete = () => {
    if (currentStep && isBeginnerStep(currentStep)) {
      useTutorialStore.getState().completeInteractiveExample(currentStep.id);
      tutorialAnalytics.interactiveExampleCompleted(currentStep.id);
    }
  };

  const handleSkip = (): void => {
    tutorialAnalytics.tutorialAbandoned(stepIndex, experienceLevel);
    abandonTutorial();
    onSkip();
  };

  if (!isActive || !currentStep) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/50">
      <div
        className="absolute rounded-lg bg-white shadow-xl flex flex-col transition-all duration-300 ease-in-out"
        style={{
          maxWidth: '400px',
          maxHeight: '80vh',
          ...(currentStep.target ? {
            position: 'fixed',
            ...getPositionForTarget(currentStep.target, currentStep.placement)
          } : {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            // Ensure centered tutorial stays within bounds
            margin: '20px',
            maxHeight: 'calc(100vh - 40px)'
          })
        } as CSSProperties}
      >
        <div className="p-4 border-b">
          <TutorialProgress
            currentStep={stepIndex}
            totalSteps={steps.length}
          />
        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
          <div className="space-y-4">
            <StepComponent
              step={currentStep}
              onComplete={() => handleStepComplete(stepIndex)}
              onSkip={handleSkip}
              isLastStep={stepIndex === steps.length - 1}
            />

            {educationalContent && (
              <EducationalContent
                glossaryTerms={educationalContent.glossaryTerms}
                concepts={educationalContent.concepts}
                interactiveExample={educationalContent.interactiveExample}
                onExampleComplete={handleExampleComplete}
                onContentView={handleEducationalContentView}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const TutorialOverlay = memo(UnmemoizedTutorialOverlay);