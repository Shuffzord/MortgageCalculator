/** @type {import('jest').Config} */
export default {
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
  setupFilesAfterEnv: ['<rootDir>/config/setup.js'],
  globalSetup: '<rootDir>/config/global-setup.js',
  globalTeardown: '<rootDir>/config/global-teardown.js',
};