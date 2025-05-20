// This file is run after the test environment is set up but before the tests are run
// It's a good place to set up global variables and configurations for all tests

import { jest } from '@jest/globals';

// Set default timeout for all tests
jest.setTimeout(60000);

// Global variables that will be available in all test files
global.BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
global.HEADLESS = process.env.HEADLESS !== 'false';

// You can add more global configurations here