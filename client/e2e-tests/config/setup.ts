// This file is run after the test environment is set up but before the tests are run
// It's a good place to set up global variables and configurations for all tests

import { jest } from '@jest/globals';

// Declare global variables for TypeScript
declare global {
  namespace NodeJS {
    interface Global {
      BASE_URL: string;
      HEADLESS: boolean;
    }
  }
  
  var BASE_URL: string;
  var HEADLESS: boolean;
}

// Set default timeout for all tests
jest.setTimeout(60000);

// Global variables that will be available in all test files
let baseUrl = process.env.BASE_URL || 'http://localhost:3000';

// Check if we need to use a different port
if (baseUrl.includes('localhost')) {
  // Try to detect if a different port is being used
  try {
    // Get the port from the BASE_URL environment variable
    const urlObj = new URL(baseUrl);
    const portFromEnv = urlObj.port;
    
    // If the port is explicitly set in the environment variable, use it
    if (portFromEnv) {
      console.log(`Using port ${portFromEnv} from BASE_URL environment variable`);
    }
    // Otherwise check the server output for port information
    else {
      const output = process.env.DEV_SERVER_OUTPUT || '';
      const portMatch = output.match(/Local:\s+http:\/\/localhost:(\d+)/);
      if (portMatch && portMatch[1]) {
        const detectedPort = parseInt(portMatch[1], 10);
        if (detectedPort !== 3000) {
          console.log(`Detected dev server running on port: ${detectedPort} instead of 3000`);
          baseUrl = `http://localhost:${detectedPort}`;
        }
      }
    }
  } catch (error) {
    console.error('Error detecting port:', error);
  }
}

// Validate the BASE_URL to ensure it's properly formatted
function validateBaseUrl(url: string): string {
  try {
    // Check if the URL is valid
    new URL(url);
    return url;
  } catch (error) {
    console.error(`Invalid BASE_URL: ${url}`);
    console.error('Falling back to default: http://localhost:3000');
    return 'http://localhost:3000';
  }
}

global.BASE_URL = validateBaseUrl(baseUrl);
global.HEADLESS = process.env.HEADLESS !== 'false';

console.log(`Using BASE_URL: ${global.BASE_URL}`);

// You can add more global configurations here