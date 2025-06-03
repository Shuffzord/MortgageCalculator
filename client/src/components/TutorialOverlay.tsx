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
  
  // Constants for positioning
  const MARGIN = 12; // Space between target and tutorial
  const PADDING = 400; // Minimum space from viewport edges
  const TUTORIAL_WIDTH = 500;
  const TUTORIAL_HEIGHT = 450; // Increased for better content visibility
  
  // Calculate center points
  const targetCenterX = rect.left + (rect.width / 2);
  const targetCenterY = rect.top + (rect.height / 2);
  
  // Get scroll position
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  
  // Get viewport dimensions
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Calculate initial position based on placement
  switch (placement) {
    case 'top':
      positions.top = rect.top - TUTORIAL_HEIGHT - MARGIN;
      positions.left = targetCenterX - (TUTORIAL_WIDTH / 2);
      break;
    case 'bottom':
      positions.top = rect.bottom + MARGIN;
      positions.left = targetCenterX - (TUTORIAL_WIDTH / 2);
      break;
    case 'left':
      positions.top = targetCenterY - (TUTORIAL_HEIGHT / 2);
      positions.left = rect.left - TUTORIAL_WIDTH - MARGIN;
      break;
    case 'right':
      positions.top = targetCenterY - (TUTORIAL_HEIGHT / 2);
      positions.left = rect.right + MARGIN;
      break;
  }

  // Adjust for viewport bounds
  const bounds = {
    left: PADDING,
    right: viewportWidth - TUTORIAL_WIDTH - PADDING,
    top: 100,
    bottom: viewportHeight - TUTORIAL_HEIGHT - PADDING
  };

  // Keep tutorial within viewport bounds
  if (positions.left < bounds.left) {
    positions.left = bounds.left;
    // If we're pushing against left edge, try to flip to right side
    if (placement === 'left' && rect.right + TUTORIAL_WIDTH + MARGIN < viewportWidth) {
      positions.left = rect.right + MARGIN;
    }
  }
  if (positions.left > bounds.right) {
    positions.left = bounds.right;
    // If we're pushing against right edge, try to flip to left side
    if (placement === 'right' && rect.left - TUTORIAL_WIDTH - MARGIN > 0) {
      positions.left = rect.left - TUTORIAL_WIDTH - MARGIN;
    }
  }
  if (positions.top < bounds.top) {
    positions.top = bounds.top;
    // If we're pushing against top edge, try to flip to bottom
    if (placement === 'top' && rect.bottom + TUTORIAL_HEIGHT + MARGIN < viewportHeight) {
      positions.top = rect.bottom + MARGIN;
    }
  }
  if (positions.top > bounds.bottom) {
    positions.top = bounds.bottom;
    // If we're pushing against bottom edge, try to flip to top
    if (placement === 'bottom' && rect.top - TUTORIAL_HEIGHT - MARGIN > 0) {
      positions.top = rect.top - TUTORIAL_HEIGHT - MARGIN;
    }
  }

  // Add scroll offset to convert viewport coordinates to absolute
  positions.top! += scrollY;
  positions.left! += scrollX;

  // Log positioning details
  console.log('[TutorialOverlay] Positioning:', {
    targetId,
    placement,
    rect,
    positions,
    viewport: { width: viewportWidth, height: viewportHeight },
    scroll: { x: scrollX, y: scrollY },
    bounds
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
    goToPreviousStep,
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
    
    // Get element position
    const rect = targetElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // Calculate the visible area needed
    const visibleAreaNeeded = 400; // Enough space for element + tutorial
    const elementCenter = rect.top + rect.height / 2;
    
    // Calculate target scroll position to center the visible area
    const scrollTarget = window.scrollY + elementCenter - viewportHeight / 2;
    
    // Apply scroll with a slight upward bias to ensure tutorial is visible
    window.scrollTo({
      top: Math.max(0, scrollTarget - 100), // Bias upward by 100px
      behavior: 'smooth'
    });

    // Log scroll adjustment
    console.log('[TutorialOverlay] Scroll adjustment:', {
      elementPosition: rect,
      viewportHeight,
      elementCenter,
      scrollTarget: Math.max(0, scrollTarget - 100)
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

  const handlePrevious = (): void => {
    console.log('[TutorialOverlay] Going to previous step');
    tutorialAnalytics.stepCompleted(stepIndex - 1); // Track backward navigation
    goToPreviousStep();
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
              onPrevious={handlePrevious}
              isLastStep={stepIndex === steps.length - 1}
              isFirstStep={stepIndex === 0}
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