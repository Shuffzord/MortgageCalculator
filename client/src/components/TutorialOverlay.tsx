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

  const rect = targetElement.getBoundingClientRect();
  const positions: PositionStyle = {};
  const PADDING = 16;
  const TUTORIAL_WIDTH = 400;
  const TUTORIAL_HEIGHT = 200;

  // Simple viewport-relative positioning
  switch (placement) {
    case 'top':
      positions.top = rect.top - TUTORIAL_HEIGHT - PADDING;
      positions.left = rect.left + (rect.width / 2) - (TUTORIAL_WIDTH / 2);
      break;
    case 'bottom':
      positions.top = rect.bottom + PADDING;
      positions.left = rect.left + (rect.width / 2) - (TUTORIAL_WIDTH / 2);
      break;
    case 'left':
      positions.top = rect.top + (rect.height / 2) - (TUTORIAL_HEIGHT / 2);
      positions.left = rect.left - TUTORIAL_WIDTH - PADDING;
      break;
    case 'right':
      positions.top = rect.top + (rect.height / 2) - (TUTORIAL_HEIGHT / 2);
      positions.left = rect.right + PADDING;
      break;
  }

  // Simple viewport bounds check
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (positions.left < PADDING) positions.left = PADDING;
  if (positions.left + TUTORIAL_WIDTH > viewportWidth - PADDING) {
    positions.left = viewportWidth - TUTORIAL_WIDTH - PADDING;
  }
  if (positions.top < PADDING) positions.top = PADDING;
  if (positions.top + TUTORIAL_HEIGHT > viewportHeight - PADDING) {
    positions.top = viewportHeight - TUTORIAL_HEIGHT - PADDING;
  }

  // Log positioning details
  console.log(`[TutorialOverlay] Positioning:`, {
    placement,
    rect,
    positions,
    viewportWidth,
    viewportHeight
  });

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

  // Handle tutorial start/stop
  useEffect(() => {
    if (isActive) {
      tutorialAnalytics.tutorialStarted(experienceLevel);
      startTutorial();
    }
    
    return () => {
      if (isActive) {
        abandonTutorial();
      }
    };
  }, [isActive, experienceLevel, startTutorial, abandonTutorial]);

  // Handle highlight class and scroll position
  useEffect(() => {
    if (!currentStep?.target) return;
    
    const targetElement = document.getElementById(currentStep.target);
    if (!targetElement) return;

    // Add highlight class
    targetElement.classList.add('tutorial-highlight');
    
    // Always scroll element into view
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });

    return () => {
      targetElement.classList.remove('tutorial-highlight');
    };
  }, [currentStep?.target]);

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
    <div className="fixed inset-0 z-[100] bg-black/50 tutorial-overlay">
      <div
        className="fixed rounded-lg bg-white shadow-xl flex flex-col transition-all duration-300 ease-in-out"
        style={{
          maxWidth: '400px',
          maxHeight: '80vh',
          ...(currentStep.target ? {
            ...getPositionForTarget(currentStep.target, currentStep.placement)
          } : {
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
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