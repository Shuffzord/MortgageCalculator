import { Step } from 'react-joyride';

export interface TutorialConfig {
  defaultOptions: {
    arrowColor: string;
    backgroundColor: string;
    overlayColor: string;
    primaryColor: string;
    textColor: string;
    spotlightPadding: number;
    zIndex: number;
  };
  defaultStepOptions: Partial<Step>;
}

export const joyrideConfig: TutorialConfig = {
  defaultOptions: {
    arrowColor: '#ffffff',
    backgroundColor: '#ffffff',
    overlayColor: 'rgba(0, 0, 0, 0.5)',
    primaryColor: '#007bff',
    textColor: '#333333',
    spotlightPadding: 5,
    zIndex: 10000, // Aligned with defaultStepOptions
  },
  defaultStepOptions: {
    disableBeacon: true,
    placement: 'bottom',
    styles: {
      options: {
        zIndex: 10000,
        width: 320,
      },
    },
  },
};