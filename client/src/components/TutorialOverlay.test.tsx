import React from 'react';
import { render, screen } from '../test-utils/test-wrapper';
import { tutorialAnalytics } from '../lib/tutorial/analytics';
import type { ExperienceLevel } from './ExperienceLevelAssessment';
import type { TutorialStep as TutorialStepType } from '../lib/tutorial/tutorialSteps';
import { mockStore, createMockStore } from '../test-utils/mockStore';

// Mock modules before importing the component
jest.mock('../lib/tutorial/tutorialState', () => ({
  useTutorialStore: {
    getState: jest.fn().mockReturnValue(mockStore)
  }
}));

// Mock TutorialStep to make it easier to trigger events
jest.mock('./TutorialStep', () => ({
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

// Import component after mocks are set up
const { TutorialOverlay } = require('./TutorialOverlay');
const { useTutorialStore } = require('../lib/tutorial/tutorialState');

describe('TutorialOverlay', () => {
  beforeEach(() => {
    tutorialAnalytics.getEvents().length = 0;
    jest.clearAllMocks();
    // Reset mock store to initial state
    jest.spyOn(useTutorialStore, 'getState').mockReturnValue(createMockStore());
  });

  it('initializes correctly for beginner experience level', () => {
    render(
      <TutorialOverlay
        isActive={true}
        experienceLevel={'beginner' as ExperienceLevel}
        onComplete={jest.fn()}
        onSkip={jest.fn()}
      />
    );

    const events = tutorialAnalytics.getEvents();
    expect(events).toContainEqual(expect.objectContaining({
      eventName: 'tutorial_started',
      experienceLevel: 'beginner'
    }));
    expect(useTutorialStore.getState().startTutorial).toHaveBeenCalled();
  });

  it('filters steps for non-beginner experience levels', () => {
    render(
      <TutorialOverlay
        isActive={true}
        experienceLevel={'intermediate' as ExperienceLevel}
        onComplete={jest.fn()}
        onSkip={jest.fn()}
      />
    );

    const events = tutorialAnalytics.getEvents();
    expect(events).toContainEqual(expect.objectContaining({
      eventName: 'tutorial_started',
      experienceLevel: 'intermediate'
    }));
  });

  it('tracks step completion', async () => {
    render(
      <TutorialOverlay
        isActive={true}
        experienceLevel={'beginner' as ExperienceLevel}
        onComplete={jest.fn()}
        onSkip={jest.fn()}
      />
    );

    // Click the complete step button
    const completeButton = screen.getByText('Complete Step');
    completeButton.click();

    const events = tutorialAnalytics.getEvents();
    expect(events).toContainEqual(expect.objectContaining({
      eventName: 'step_completed',
      stepNumber: 0
    }));
  });

  it('handles tutorial completion', () => {
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

    // Complete the final step
    const completeButton = screen.getByText('Complete Step');
    completeButton.click();

    const events = tutorialAnalytics.getEvents();
    expect(events).toContainEqual(expect.objectContaining({
      eventName: 'tutorial_completed',
      experienceLevel: 'beginner'
    }));
    expect(onComplete).toHaveBeenCalled();
  });

  it('handles tutorial skip', () => {
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

    // Click the skip button
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

  it('respects isActive prop changes', () => {
    const { rerender } = render(
      <TutorialOverlay
        isActive={false}
        experienceLevel={'beginner' as ExperienceLevel}
        onComplete={jest.fn()}
        onSkip={jest.fn()}
      />
    );

    let events = tutorialAnalytics.getEvents();
    expect(events).not.toContainEqual(expect.objectContaining({
      eventName: 'tutorial_started'
    }));

    rerender(
      <TutorialOverlay
        isActive={true}
        experienceLevel={'beginner' as ExperienceLevel}
        onComplete={jest.fn()}
        onSkip={jest.fn()}
      />
    );

    events = tutorialAnalytics.getEvents();
    expect(events).toContainEqual(expect.objectContaining({
      eventName: 'tutorial_started',
      experienceLevel: 'beginner'
    }));
  });
});