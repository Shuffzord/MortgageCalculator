# Test Setup Improvements Plan

## 1. Mock Structure

Create the following mock structure in `jest.setup.cjs`:

```js
// Mock i18next and its plugins
const mockI18n = {
  use: () => mockI18n,
  init: () => mockI18n,
  t: (key) => key,
  changeLanguage: () => Promise.resolve(),
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
  }
}));

jest.mock('i18next-browser-languagedetector', () => ({
  default: class LanguageDetector {
    constructor() {}
    init() {}
    detect() { return 'en'; }
  }
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: mockI18n
  }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {}
  },
  I18nextProvider: ({ children }) => children
}));
```

## 2. Tutorial Analytics Mock

```js
const mockAnalytics = {
  tutorialStarted: jest.fn(),
  stepCompleted: jest.fn(),
  tutorialCompleted: jest.fn(),
  tutorialAbandoned: jest.fn(),
  experienceLevelChanged: jest.fn(),
  getEvents: jest.fn().mockReturnValue([])
};

jest.mock('./client/src/lib/tutorial/analytics', () => ({
  tutorialAnalytics: mockAnalytics
}));

// Make mocks available globally
global.__mocks__ = {
  analytics: mockAnalytics,
  i18n: mockI18n
};
```

## 3. Test Wrapper Updates

```tsx
import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const AllTheProviders = ({ children }) => {
  return <>{children}</>;
};

const customRender = (ui, options = {}) => {
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllTheProviders, ...options })
  };
};

export * from '@testing-library/react';
export { customRender as render };
```

## 4. Jest Configuration

```js
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.cjs'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      }
    }]
  },
  moduleDirectories: ['node_modules', 'src'],
  testPathIgnorePatterns: ['/node_modules/', '/client/e2e-tests/'],
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  }
};
```

## 5. Implementation Steps

1. Update `jest.setup.cjs` with the complete mock configuration
2. Update `jest.config.cjs` with the new configuration
3. Simplify `test-wrapper.tsx`
4. Remove old i18n mock files
5. Run tests and verify fixes

## 6. Benefits

- Centralized mock configuration
- Complete i18n plugin mocking
- Proper module initialization order
- Consistent analytics mocking
- Simplified test setup

## Next Steps

1. Switch to Code mode to implement these changes
2. Apply changes in the specified order
3. Run tests after each change to verify
4. Address any remaining issues incrementally