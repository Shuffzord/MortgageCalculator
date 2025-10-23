import React, { ReactElement } from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import '@testing-library/jest-dom';

// Initialize i18n instance for tests
const i18nInstance = i18n.createInstance();
i18nInstance.init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  resources: {
    en: {
      translation: {
        'tutorial.welcome.title': 'Welcome to the Tutorial',
        'tutorial.experience.beginner': 'Beginner',
        'tutorial.experience.intermediate': 'Intermediate',
        'tutorial.experience.advanced': 'Advanced',
        'tutorial.progress.step': 'Step {{current}} of {{total}}',
        'tutorial.common.skip': 'Skip',
        'tutorial.common.next': 'Next',
        'tutorial.common.last': 'Finish',
        'common.skip': 'Skip',
        'common.start': 'Start',
        'common.close': 'Close',
      },
    },
  },
  interpolation: {
    escapeValue: false,
  },
});

// Simple provider wrapper
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
};

// Custom render function
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => {
  const rendered = rtlRender(ui, {
    wrapper: AllTheProviders,
    ...options,
  });

  return {
    user: userEvent.setup(),
    ...rendered,
  };
};

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Export analytics mock from global mocks
export const { tutorialAnalytics } = jest.requireMock('../lib/tutorial/analytics');
