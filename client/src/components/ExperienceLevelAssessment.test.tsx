import React from 'react';
import { render, screen, within } from '../test-utils/test-wrapper';
import { userActions } from '../test-utils/helpers';
import { tutorialAnalytics } from '../lib/tutorial/analytics';
import type { ExperienceLevel } from './ExperienceLevelAssessment';
import { mockStore, createMockStore } from '../test-utils/mockStore';

// Mock tutorial store before importing component
jest.mock('../lib/tutorial/tutorialState', () => ({
  useTutorialStore: {
    getState: jest.fn().mockReturnValue(mockStore)
  }
}));

// Import component after mocks are set up
const { ExperienceLevelAssessment } = require('./ExperienceLevelAssessment');
const { useTutorialStore } = require('../lib/tutorial/tutorialState');

describe('ExperienceLevelAssessment', () => {
  const mockOnClose = jest.fn();
  const mockOnExperienceLevelSet = jest.fn();

  beforeEach(() => {
    tutorialAnalytics.getEvents().length = 0;
    jest.clearAllMocks();
  });

  it('renders correctly when open', () => {
    render(
      <ExperienceLevelAssessment
        isOpen={true}
        onClose={mockOnClose}
        onExperienceLevelSet={mockOnExperienceLevelSet}
      />
    );

    const dialog = screen.getByRole('dialog');
    
    // Check title and options are rendered
    expect(within(dialog).getByText('tutorial.welcome.title')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('tutorial.experience.beginner')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('tutorial.experience.intermediate')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('tutorial.experience.advanced')).toBeInTheDocument();

    // Check buttons are rendered
    expect(within(dialog).getByRole('button', { name: 'common.skip' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'common.start' })).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <ExperienceLevelAssessment
        isOpen={false}
        onClose={mockOnClose}
        onExperienceLevelSet={mockOnExperienceLevelSet}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('handles experience level selection', async () => {
    render(
      <ExperienceLevelAssessment
        isOpen={true}
        onClose={mockOnClose}
        onExperienceLevelSet={mockOnExperienceLevelSet}
      />
    );

    const dialog = screen.getByRole('dialog');

    // Select intermediate level
    const intermediateRadio = within(dialog).getByLabelText('tutorial.experience.intermediate');
    await userActions.click(intermediateRadio);

    // Click submit
    const submitButton = within(dialog).getByRole('button', { name: 'common.start' });
    await userActions.click(submitButton);

    // Verify correct actions were triggered
    expect(useTutorialStore.getState().setExperienceLevel).toHaveBeenCalledWith('intermediate');
    
    const events = tutorialAnalytics.getEvents();
    expect(events).toContainEqual(expect.objectContaining({
      eventName: 'experience_level_changed',
      experienceLevel: 'intermediate'
    }));
    
    expect(mockOnExperienceLevelSet).toHaveBeenCalledWith('intermediate');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles skip action', async () => {
    render(
      <ExperienceLevelAssessment
        isOpen={true}
        onClose={mockOnClose}
        onExperienceLevelSet={mockOnExperienceLevelSet}
      />
    );

    const dialog = screen.getByRole('dialog');

    // Click skip button
    const skipButton = within(dialog).getByRole('button', { name: 'common.skip' });
    await userActions.click(skipButton);

    // Verify correct actions were triggered
    expect(useTutorialStore.getState().abandonTutorial).toHaveBeenCalled();
    
    const events = tutorialAnalytics.getEvents();
    expect(events).toContainEqual(expect.objectContaining({
      eventName: 'tutorial_abandoned',
      stepNumber: 0,
      experienceLevel: 'not_selected'
    }));
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles dialog close', async () => {
    render(
      <ExperienceLevelAssessment
        isOpen={true}
        onClose={mockOnClose}
        onExperienceLevelSet={mockOnExperienceLevelSet}
      />
    );

    const dialog = screen.getByRole('dialog');
    const closeButton = within(dialog).getByRole('button', { name: 'Close' });
    await userActions.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});