/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
        },
      },
    ],
  },
  moduleDirectories: ['node_modules', 'src'],
  testPathIgnorePatterns: ['/node_modules/', '/client/e2e-tests/'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['client/src/**/*.{ts,tsx}', '!client/src/**/*.d.ts'],
  modulePathIgnorePatterns: ['<rootDir>/node_modules/'],
  transformIgnorePatterns: ['/node_modules/(?!@testing-library|@babel)'],
};
