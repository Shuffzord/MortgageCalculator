// Local minimal type to avoid dependency on react-joyride
type JoyrideStep = {
  disableBeacon?: boolean;
  placement?: 'top' | 'bottom' | 'left' | 'right' | (string & {});
  styles?: unknown;
  [key: string]: unknown;
};

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
  defaultStepOptions: Partial<JoyrideStep>;
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
