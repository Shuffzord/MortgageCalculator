require('@testing-library/jest-dom');

// Create analytics mock instance
class MockTutorialAnalytics {
  events = [];

  logEvent(event) {
    this.events.push({
      ...event,
      timestamp: Date.now(),
    });
  }

  tutorialStarted(experienceLevel) {
    this.logEvent({
      eventName: 'tutorial_started',
      experienceLevel,
    });
  }

  stepCompleted(stepNumber) {
    this.logEvent({
      eventName: 'step_completed',
      stepNumber,
    });
  }

  tutorialCompleted(experienceLevel) {
    this.logEvent({
      eventName: 'tutorial_completed',
      experienceLevel,
    });
  }

  tutorialAbandoned(stepNumber, experienceLevel) {
    this.logEvent({
      eventName: 'tutorial_abandoned',
      stepNumber,
      experienceLevel,
    });
  }

  experienceLevelChanged(level) {
    this.logEvent({
      eventName: 'experience_level_changed',
      experienceLevel: level,
    });
  }

  getEvents() {
    return this.events;
  }

  clearEvents() {
    this.events = [];
  }
}

const mockAnalytics = new MockTutorialAnalytics();

// Mock the analytics module
jest.mock('./client/src/lib/tutorial/analytics', () => ({
  tutorialAnalytics: mockAnalytics,
}));

// Mock i18next and its plugins
const mockI18n = {
  use: () => mockI18n,
  init: () => mockI18n,
  t: (key) => key,
  changeLanguage: () => Promise.resolve(),
  // Core functionality
  exists: () => true,
  ready: Promise.resolve(),

  // Language handling
  language: 'en',
  languages: ['en'],
  loadLanguages: () => Promise.resolve(),

  // Resource handling
  addResource: () => mockI18n,
  addResources: () => mockI18n,
  addResourceBundle: () => mockI18n,
  getResource: () => undefined,
  hasResourceBundle: () => true,
  reloadResources: () => Promise.resolve(),
  loadResources: () => Promise.resolve(),

  // Namespace handling
  loadNamespaces: () => Promise.resolve(),

  // Store and services
  store: {
    options: {
      defaultNS: 'translation',
      fallbackLng: 'en',
      ns: ['translation'],
    },
  },
  services: {
    resourceStore: {
      data: {},
    },
    backendConnector: {},
    languageDetector: {
      detect: () => 'en',
    },
  },

  // Additional required properties
  isInitialized: true,
  options: {
    defaultNS: 'translation',
    fallbackLng: 'en',
    ns: ['translation'],
  },
  dir: () => 'ltr',
  format: (value) => value,

  // Event handling
  on: () => mockI18n,
  off: () => mockI18n,
  emit: () => mockI18n,

  // Module handling
  modules: {
    external: [],
  },
};

jest.mock('i18next', () => ({
  createInstance: () => mockI18n,
  use: () => mockI18n,
  init: () => mockI18n,
  t: (key) => key,
}));

jest.mock('i18next-http-backend', () => ({
  default: class Backend {
    constructor() {}
    init() {}
    read() {}
  },
}));

jest.mock('i18next-browser-languagedetector', () => ({
  default: class LanguageDetector {
    constructor() {}
    init() {}
    detect() {
      return 'en';
    }
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: mockI18n,
  }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
  I18nextProvider: ({ children }) => children,
}));

// Mock localStorage
const mockLocalStorage = {
  store: {},
  getItem: function (key) {
    return this.store[key] || null;
  },
  setItem: function (key, value) {
    this.store[key] = value;
  },
  clear: function () {
    this.store = {};
  },
  removeItem: function (key) {
    delete this.store[key];
  },
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Suppress console warnings/errors in tests
const originalConsole = { ...console };
global.console = {
  ...console,
  warn: jest.fn(),
  error: (...args) => {
    if (args[0]?.includes?.('Warning:')) return;
    originalConsole.error(...args);
  },
};

// Clear mocks and localStorage before each test
beforeEach(() => {
  mockLocalStorage.clear();
  mockAnalytics.clearEvents();
  jest.clearAllMocks();
});

// Export mocks for use in tests
global.__mocks__ = {
  analytics: mockAnalytics,
  i18n: mockI18n,
};
