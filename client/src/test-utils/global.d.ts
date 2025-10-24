declare global {
  namespace NodeJS {
    interface Global {
      __mocks__: {
        analytics: {
          tutorialStarted: jest.Mock;
          stepCompleted: jest.Mock;
          tutorialCompleted: jest.Mock;
          tutorialAbandoned: jest.Mock;
          experienceLevelChanged: jest.Mock;
          getEvents: jest.Mock;
        };
        i18n: {
          use: () => any;
          init: () => any;
          t: (key: string) => string;
          changeLanguage: () => Promise<void>;
        };
      }
    }
  }
}

export {};