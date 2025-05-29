import React from 'react';
import { render, screen } from '../../test-utils/test-wrapper';
import { tutorialAnalytics } from './analytics';
import type { ExperienceLevel } from '../../components/ExperienceLevelAssessment';
import type { TutorialStep as TutorialStepType } from './tutorialSteps';
import { mockStore, createMockStore } from '../../test-utils/mockStore';

// Mock modules before importing components
jest.mock('./tutorialState', () => ({
  useTutorialStore: {
    getState: jest.fn().mockReturnValue(mockStore)
  }
}));

jest.mock('../../components/TutorialStep', () => ({
  TutorialStep: ({ 
    onComplete, 
    onSkip 
  }: { 
    step: TutorialStepType;
    onComplete: () => void;
    onSkip: () => void;
    isLastStep: boolean;
  }) => (
    <div>
      <button onClick={() => onComplete()}>Complete Step</button>
      <button onClick={onSkip}>Skip Tutorial</button>
    </div>
  )
}));

// Import components after mocks are set up
const { TutorialOverlay } = require('../../components/TutorialOverlay');
const { useTutorialStore } = require('./tutorialState');

describe('Tutorial Implementation Tests', () => {
  beforeEach(() => {
    tutorialAnalytics.getEvents().length = 0;
    jest.clearAllMocks();
    // Reset mock store to initial state
    jest.spyOn(useTutorialStore, 'getState').mockReturnValue(createMockStore());
  });

  describe('Tutorial Progress', () => {
    it('should track step completion', () => {
      const mockStore = createMockStore({
        currentStep: 0,
        completedSteps: [],
      });
      
      jest.spyOn(useTutorialStore, 'getState').mockReturnValue(mockStore);

      render(
        <TutorialOverlay
          isActive={true}
          experienceLevel={'beginner' as ExperienceLevel}
          onComplete={jest.fn()}
          onSkip={jest.fn()}
        />
      );

      // Complete first step
      const completeButton = screen.getByText('Complete Step');
      completeButton.click();

      const events = tutorialAnalytics.getEvents();
      expect(events).toContainEqual(expect.objectContaining({
        eventName: 'step_completed',
        stepNumber: 0
      }));
    });

    it('should handle tutorial completion', () => {
      const onComplete = jest.fn();
      const mockStore = createMockStore({
        currentStep: 2, // Last step
        completedSteps: [0, 1],
      });
      
      jest.spyOn(useTutorialStore, 'getState').mockReturnValue(mockStore);
      
      render(
        <TutorialOverlay
          isActive={true}
          experienceLevel={'beginner' as ExperienceLevel}
          onComplete={onComplete}
          onSkip={jest.fn()}
        />
      );

      // Complete final step
      const completeButton = screen.getByText('Complete Step');
      completeButton.click();

      const events = tutorialAnalytics.getEvents();
      expect(events).toContainEqual(expect.objectContaining({
        eventName: 'tutorial_completed',
        experienceLevel: 'beginner'
      }));
      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle tutorial abandonment', () => {
      const onSkip = jest.fn();
      const mockStore = createMockStore({
        currentStep: 0,
        completedSteps: [],
      });
      
      jest.spyOn(useTutorialStore, 'getState').mockReturnValue(mockStore);
      
      render(
        <TutorialOverlay
          isActive={true}
          experienceLevel={'beginner' as ExperienceLevel}
          onComplete={jest.fn()}
          onSkip={onSkip}
        />
      );

      // Skip tutorial
      const skipButton = screen.getByText('Skip Tutorial');
      skipButton.click();

      const events = tutorialAnalytics.getEvents();
      expect(events).toContainEqual(expect.objectContaining({
        eventName: 'tutorial_abandoned',
        stepNumber: 0,
        experienceLevel: 'beginner'
      }));
      expect(onSkip).toHaveBeenCalled();
    });

    it('should persist state across rerenders', () => {
      const mockStore = createMockStore({
        currentStep: 0,
        completedSteps: [],
      });
      
      jest.spyOn(useTutorialStore, 'getState').mockReturnValue(mockStore);

      const { rerender } = render(
        <TutorialOverlay
          isActive={true}
          experienceLevel={'beginner' as ExperienceLevel}
          onComplete={jest.fn()}
          onSkip={jest.fn()}
        />
      );

      // Complete first step
      const completeButton = screen.getByText('Complete Step');
      completeButton.click();

      // Rerender with same props
      rerender(
        <TutorialOverlay
          isActive={true}
          experienceLevel={'beginner' as ExperienceLevel}
          onComplete={jest.fn()}
          onSkip={jest.fn()}
        />
      );

      const events = tutorialAnalytics.getEvents();
      expect(events).toContainEqual(expect.objectContaining({
        eventName: 'step_completed',
        stepNumber: 0
      }));
    });
  });
});