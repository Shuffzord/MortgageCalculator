import type { ExperienceLevel } from '../components/ExperienceLevelAssessment';

export const createMockStore = (overrides = {}) => ({
  currentStep: 0,
  completedSteps: [],
  isActive: true,
  hasCompletedTutorial: false,
  experienceLevel: 'beginner' as ExperienceLevel,
  startTutorial: jest.fn(),
  completeTutorial: jest.fn(),
  abandonTutorial: jest.fn(),
  completeStep: jest.fn(),
  setExperienceLevel: jest.fn(),
  resetTutorial: jest.fn(),
  ...overrides,
});

export const mockStore = createMockStore();
