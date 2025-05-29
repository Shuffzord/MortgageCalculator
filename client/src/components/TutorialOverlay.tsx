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
  console.log(`[TutorialOverlay] Finding target element for ID "${targetId}":`, {
    element: targetElement,
    exists: !!targetElement,
    rect: targetElement?.getBoundingClientRect()
  });
  if (!targetElement) return {};

  const rect = targetElement.getBoundingClientRect();
  const scrollY = window.scrollY || window.pageYOffset;
  const positions: PositionStyle = {};
  const PADDING = 16;
  const TUTORIAL_WIDTH = 350;
  const TUTORIAL_HEIGHT = 200;

  // Calculate viewport-relative coordinates
  const viewportTop = rect.top + scrollY;
  const viewportBottom = rect.bottom + scrollY;
  const viewportCenterY = viewportTop + (rect.height / 2);
  const viewportHeight = window.innerHeight;

  // Determine best placement based on viewport space
  let effectivePlacement = placement;
  if (placement === 'top' && rect.top < TUTORIAL_HEIGHT + PADDING * 2) {
    effectivePlacement = 'bottom';
  } else if (placement === 'bottom' && rect.bottom + TUTORIAL_HEIGHT + PADDING * 2 > viewportHeight) {
    effectivePlacement = 'top';
  }

  // Position based on effective placement
  switch (effectivePlacement) {
    case 'top':
      positions.top = viewportTop - TUTORIAL_HEIGHT - PADDING;
      positions.left = rect.left + (rect.width / 2) - (TUTORIAL_WIDTH / 2);
      break;
    case 'bottom':
      positions.top = viewportBottom + PADDING;
      positions.left = rect.left + (rect.width / 2) - (TUTORIAL_WIDTH / 2);
      break;
    case 'left':
      positions.top = viewportCenterY - (TUTORIAL_HEIGHT / 2);
      positions.left = rect.left - TUTORIAL_WIDTH - PADDING;
      break;
    case 'right':
      positions.top = viewportCenterY - (TUTORIAL_HEIGHT / 2);
      positions.left = rect.right + PADDING;
      break;
  }

  // Log positioning details
  console.log(`[TutorialOverlay] Positioning for ${placement} (effective: ${effectivePlacement}):`, {
    rect,
    scrollY,
    positions,
    viewportTop,
    viewportBottom,
    viewportHeight
  });

  // Ensure positions stay within viewport bounds
  const maxLeft = window.innerWidth - TUTORIAL_WIDTH - PADDING;
  const maxTop = document.documentElement.scrollHeight - TUTORIAL_HEIGHT - PADDING;
  
  positions.left = Math.max(PADDING, Math.min(positions.left, maxLeft));
  positions.top = Math.max(PADDING, Math.min(positions.top, maxTop));

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
    
    // Calculate scroll position based on placement
    const rect = targetElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const TUTORIAL_HEIGHT = 200; // Height of tutorial popup
    const PADDING = 20; // Minimum padding from viewport edges
    
    let targetY = 0;
    const placement = currentStep.placement || 'bottom';
    
    switch (placement) {
      case 'top':
        // For top placement, ensure space above element
        targetY = window.pageYOffset + rect.top - (TUTORIAL_HEIGHT + PADDING);
        break;
      case 'bottom':
        // For bottom placement, ensure space below element
        targetY = window.pageYOffset + rect.bottom + PADDING;
        break;
      case 'left':
      case 'right':
        // For side placements, center vertically
        targetY = window.pageYOffset + rect.top - (viewportHeight - rect.height) / 2;
        break;
    }
    
    // Ensure target position is within bounds
    const maxScroll = document.documentElement.scrollHeight - viewportHeight;
    targetY = Math.max(0, Math.min(targetY, maxScroll));
    
    // Scroll to position
    window.scrollTo({
      top: targetY,
      behavior: 'smooth'
    });

    // Cleanup function to remove highlight
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
    <div className="fixed inset-0 z-[100] bg-black/50 tutorial-overlay overflow-hidden">
      <div
        className="absolute rounded-lg bg-white shadow-xl flex flex-col transition-all duration-300 ease-in-out"
        style={{
          maxWidth: '400px',
          maxHeight: '80vh',
          ...(currentStep.target ? {
            position: 'fixed', // Changed to fixed for better stacking
            ...getPositionForTarget(currentStep.target, currentStep.placement)
          } : {
            position: 'fixed',
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