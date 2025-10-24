import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
    }],
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/specs/**/*.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  rootDir: '../',
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/config/setup.ts'],
  globalSetup: '<rootDir>/config/global-setup.ts',
  globalTeardown: '<rootDir>/config/global-teardown.ts',
  // Add transformIgnorePatterns to handle ES modules in node_modules
  transformIgnorePatterns: [
    // Allow transformation of ES modules in node_modules
    'node_modules/(?!(pixelmatch|pngjs|axe-core)/)'
  ],
  // Add moduleNameMapper for ES modules
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'Mortgage Calculator E2E Test Report',
      outputPath: './reports/test-report.html',
      includeFailureMsg: true,
      includeConsoleLog: true,
      dateFormat: 'yyyy-mm-dd HH:MM:ss'
    }]
  ],
};

export default config;