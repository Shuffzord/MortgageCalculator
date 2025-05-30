// Mock localStorage
export const mockLocalStorage = {
  store: {} as { [key: string]: string },
  getItem(key: string) {
    return this.store[key] || null;
  },
  setItem(key: string, value: string) {
    this.store[key] = value;
  },
  removeItem(key: string) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  }
};

// Mock analytics
export const mockAnalytics = {
  tutorialStarted: jest.fn(),
  stepCompleted: jest.fn(),
  tutorialCompleted: jest.fn(),
  tutorialAbandoned: jest.fn(),
  experienceLevelChanged: jest.fn(),
  getEvents: jest.fn().mockReturnValue([])
};

// Mock i18n translations
export const mockTranslations = {
  en: {
    translation: {}
  }
};

// Common test data generators
export const generateTestId = (prefix: string) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

// Common test helpers
export const waitForMockCall = (mock: jest.Mock, callIndex = 0) => {
  return new Promise<void>((resolve) => {
    const checkCall = () => {
      if (mock.mock.calls.length > callIndex) {
        resolve();
      } else {
        setTimeout(checkCall, 50);
      }
    };
    checkCall();
  });
};

export const clearMocks = () => {
  mockLocalStorage.clear();
  mockAnalytics.tutorialStarted.mockClear();
  mockAnalytics.stepCompleted.mockClear();
  mockAnalytics.tutorialCompleted.mockClear();
  mockAnalytics.tutorialAbandoned.mockClear();
  mockAnalytics.experienceLevelChanged.mockClear();
  mockAnalytics.getEvents.mockClear();
};