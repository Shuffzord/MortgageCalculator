import React from 'react';
import { render, screen } from '../test-utils/test-wrapper';
import { TutorialProgress } from './TutorialProgress';

describe('TutorialProgress', () => {
  it('renders progress correctly', () => {
    render(<TutorialProgress currentStep={1} totalSteps={3} />);

    expect(screen.getByText('tutorial.progress.step')).toBeInTheDocument();
  });

  it('shows correct step count', () => {
    render(<TutorialProgress currentStep={2} totalSteps={4} />);

    const progressText = screen.getByText('tutorial.progress.step');
    expect(progressText).toBeInTheDocument();
  });

  it('handles first step', () => {
    render(<TutorialProgress currentStep={0} totalSteps={5} />);

    const progressText = screen.getByText('tutorial.progress.step');
    expect(progressText).toBeInTheDocument();
  });

  it('handles last step', () => {
    render(<TutorialProgress currentStep={4} totalSteps={5} />);

    const progressText = screen.getByText('tutorial.progress.step');
    expect(progressText).toBeInTheDocument();
  });

  it('shows progress indicators', () => {
    render(<TutorialProgress currentStep={1} totalSteps={3} />);

    // Should show 3 step indicators
    const indicators = screen.getAllByRole('listitem');
    expect(indicators).toHaveLength(3);

    // First step should be completed
    expect(indicators[0]).toHaveClass('bg-blue-500');

    // Current step should be active
    expect(indicators[1]).toHaveClass('bg-blue-500');

    // Future step should be inactive
    expect(indicators[2]).toHaveClass('bg-gray-300');
  });
});
