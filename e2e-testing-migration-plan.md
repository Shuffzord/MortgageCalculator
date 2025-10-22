# E2E Testing Migration Plan: From MCP to Standard Puppeteer

This document outlines the steps needed to migrate from the Model Context Protocol (MCP) Puppeteer setup to standard Puppeteer for end-to-end testing.

## Current Setup

The current setup uses MCP as a proxy layer between the tests and Puppeteer:

```
Test Files → MCP Client → MCP Server → Puppeteer → Browser
```

This adds unnecessary complexity for standard e2e testing without AI assistance.

## Migration Steps

### 1. Create a New Puppeteer Setup File

Replace `client/e2e-tests/utils/setup-mcp.ts` with a new `setup-puppeteer.ts` file:

```typescript
/**
 * Standard Puppeteer Setup
 * 
 * This file initializes Puppeteer for end-to-end testing.
 * It should be imported at the beginning of each test file.
 */

import puppeteer, { Browser, Page } from 'puppeteer';

// Declare global variables for TypeScript
declare global {
  namespace NodeJS {
    interface Global {
      browser: Browser;
      page: Page;
    }
  }
  var browser: Browser;
  var page: Page;
}

/**
 * Initialize Puppeteer
 * This function creates a browser and page instance for testing
 */
export async function initPuppeteer() {
  // Launch browser with specified options
  const browser = await puppeteer.launch({
    headless: process.env.HEADLESS !== 'false',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });
  
  // Create a new page
  const page = await browser.newPage();
  
  // Set global variables
  global.browser = browser;
  global.page = page;
  
  return { browser, page };
}

// Setup before tests
beforeAll(async () => {
  await initPuppeteer();
});

// Cleanup after tests
afterAll(async () => {
  if (global.browser) {
    await global.browser.close();
  }
});

// Export a default instance
export default { browser: global.browser, page: global.page };
```

### 2. Create New Puppeteer Helper Functions

Replace `client/e2e-tests/utils/mcp-puppeteer.ts` with a new `puppeteer-helpers.ts` file:

```typescript
/**
 * Puppeteer Helper Functions
 * 
 * This file contains utility functions for working with Puppeteer.
 * These functions make it easier to interact with the Puppeteer API.
 */

// Helper function to navigate to a URL
export async function navigateToUrl(url: string) {
  await global.page.goto(url, { waitUntil: 'networkidle2' });
}

// Helper function to take a screenshot
export async function takeScreenshot(name: string, selector?: string) {
  if (selector) {
    const element = await global.page.$(selector);
    if (element) {
      await element.screenshot({ path: `./screenshots/${name}.png` });
    }
  } else {
    await global.page.screenshot({ path: `./screenshots/${name}.png` });
  }
}

// Helper function to click an element
export async function clickElement(selector: string) {
  await global.page.waitForSelector(selector);
  await global.page.click(selector);
}

// Helper function to fill a form field
export async function fillFormField(selector: string, value: string) {
  await global.page.waitForSelector(selector);
  await global.page.type(selector, value);
}

// Helper function to select an option from a dropdown
export async function selectOption(selector: string, value: string) {
  await global.page.waitForSelector(selector);
  await global.page.select(selector, value);
}

// Helper function to hover over an element
export async function hoverElement(selector: string) {
  await global.page.waitForSelector(selector);
  await global.page.hover(selector);
}

// Helper function to execute JavaScript in the browser
export async function evaluateInBrowser(script: string) {
  return await global.page.evaluate(script);
}

// Helper function to wait for an element to be visible
export async function waitForElement(selector: string, timeout = 5000) {
  await global.page.waitForSelector(selector, { timeout });
}

// Helper function to get text content of an element
export async function getElementText(selector: string) {
  await global.page.waitForSelector(selector);
  return await global.page.$eval(selector, (element) => element.textContent);
}

// Helper function to check if an element exists
export async function elementExists(selector: string) {
  const element = await global.page.$(selector);
  return element !== null;
}

// Helper function to wait for page to load completely
export async function waitForPageLoad() {
  await global.page.waitForNavigation({ waitUntil: 'networkidle2' });
}
```

### 3. Update Test Files

Update all test files to import from the new files instead of the MCP files:

#### Update `client/e2e-tests/specs/basic-page-load.spec.ts`:

```typescript
/**
 * Basic Page Load Tests
 * 
 * This file contains tests for verifying that the mortgage calculator application
 * loads correctly and all main components are visible.
 */

import '../utils/setup-puppeteer';
import { 
  navigateToUrl, 
  takeScreenshot, 
  waitForPageLoad, 
  elementExists, 
  getElementText 
} from '../utils/puppeteer-helpers';
import * as selectors from '../utils/selectors';

// Rest of the file remains the same
```

#### Update `client/e2e-tests/specs/form-input.spec.ts`:

```typescript
/**
 * Form Input Tests
 * 
 * This file contains tests for verifying the form input functionality
 * of the mortgage calculator application.
 */

import '../utils/setup-puppeteer';
import { 
  navigateToUrl, 
  takeScreenshot, 
  waitForPageLoad, 
  elementExists, 
  getElementText,
  fillFormField,
  clickElement,
  evaluateInBrowser
} from '../utils/puppeteer-helpers';
import * as selectors from '../utils/selectors';

// Rest of the file remains the same
```

### 4. Update Run Tests Script

Update `client/e2e-tests/run-tests.js` to ensure it works with the new setup:

```javascript
// Update the runTests function to ensure it sets up the screenshots directory
function runTests() {
  console.log('Running Puppeteer tests...');
  
  // Create screenshots directory if it doesn't exist
  const screenshotsDir = path.resolve(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  // Set environment variables for the tests
  const env = {
    ...process.env,
    BASE_URL: `http://localhost:${config.devServerPort}`,
    HEADLESS: config.headless.toString(),
    NODE_OPTIONS: '--experimental-vm-modules', // Enable ES modules in Jest
  };
  
  // Rest of the function remains the same
}
```

### 5. Update Jest Configuration

Ensure the Jest configuration in `client/e2e-tests/config/jest.config.js` is set up correctly for Puppeteer:

```javascript
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
  testMatch: ['**/*.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/setup.js'],
  // Add global setup/teardown if needed
  globalSetup: '<rootDir>/global-setup.js',
  globalTeardown: '<rootDir>/global-teardown.js',
};
```

### 6. Create Global Setup/Teardown Files (Optional)

Create `client/e2e-tests/config/global-setup.js` and `client/e2e-tests/config/global-teardown.js` if needed for additional setup/teardown operations.

### 7. Update Package.json Dependencies

Ensure the package.json has the correct dependencies:

```json
"devDependencies": {
  // ... other dependencies
  "jest": "^29.7.0",
  "jest-puppeteer": "^11.0.0",
  "puppeteer": "^24.9.0",
  // ... other dependencies
}
```

### 8. Remove MCP Configuration

Remove or update the MCP configuration in `.roo/mcp.json` if it's no longer needed.

## Benefits of Migration

1. **Simplicity**: Direct use of Puppeteer without the MCP layer
2. **Performance**: Potentially faster tests without the proxy layer
3. **Maintainability**: Standard approach that's well-documented and widely used
4. **Compatibility**: Better compatibility with standard testing practices and tools

## Implementation Timeline

1. Create new setup and helper files
2. Update one test file and verify it works
3. Update remaining test files
4. Update run-tests.js and configuration
5. Remove MCP configuration
6. Run full test suite to verify everything works

## Conclusion

This migration will simplify the e2e testing setup by removing the MCP layer and using Puppeteer directly. The changes are designed to be minimally invasive, preserving the existing test structure and functionality while removing the unnecessary complexity.