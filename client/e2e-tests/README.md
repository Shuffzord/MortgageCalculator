# Mortgage Calculator E2E Tests

This directory contains end-to-end tests for the Mortgage Calculator application using Puppeteer.

## Directory Structure

```
e2e-tests/
├── config/                # Test configuration files
│   ├── jest.config.js     # Jest configuration for E2E tests
│   ├── setup.js           # Setup file for Jest
│   ├── global-setup.js    # Global setup for Jest
│   └── global-teardown.js # Global teardown for Jest
├── specs/                 # Test specification files
│   ├── basic-page-load.spec.ts  # Basic page load tests
│   └── form-input.spec.ts       # Form input tests
├── utils/                 # Utility functions and helpers
│   ├── puppeteer-helpers.ts  # Puppeteer helper functions
│   ├── selectors.ts       # CSS selectors used in tests
│   ├── setup-puppeteer.ts # Puppeteer setup
│   └── types.ts           # TypeScript type definitions
├── screenshots/           # Screenshots taken during tests
└── run-tests.js           # Script to run the tests
```

## Running the Tests

### Using the run-tests.js Script

The `run-tests.js` script provides a convenient way to run the E2E tests. It can automatically start the development server if needed.

```bash
# Run all tests (starts the dev server automatically)
node client/e2e-tests/run-tests.js

# Run tests without starting the dev server (if it's already running)
node client/e2e-tests/run-tests.js --no-server

# Run tests in non-headless mode (shows the browser UI)
node client/e2e-tests/run-tests.js --no-headless

# Run a specific test file
node client/e2e-tests/run-tests.js --spec=specs/basic-page-load.spec.ts
```

### Using npm

You can also add a script to your package.json:

```json
"scripts": {
  "test:e2e": "node client/e2e-tests/run-tests.js"
}
```

Then run:

```bash
npm run test:e2e
```

## Puppeteer Helper Functions

The `utils/puppeteer-helpers.ts` file provides helper functions for common Puppeteer operations:

- `navigateToUrl(url)`: Navigate to a URL
- `takeScreenshot(name, selector?)`: Take a screenshot
- `clickElement(selector)`: Click an element
- `fillFormField(selector, value)`: Fill a form field
- `selectOption(selector, value)`: Select an option from a dropdown
- `hoverElement(selector)`: Hover over an element
- `evaluateInBrowser(script)`: Execute JavaScript in the browser
- `waitForElement(selector, timeout?)`: Wait for an element to be visible
- `getElementText(selector)`: Get text content of an element
- `elementExists(selector)`: Check if an element exists
- `waitForPageLoad()`: Wait for page to load completely

### Selectors

All CSS selectors used in the tests are centralized in the `utils/selectors.ts` file. This makes it easier to maintain tests when the UI changes.

## Writing New Tests

To write a new test:

1. Create a new file in the `specs` directory with a `.spec.ts` extension
2. Import the necessary helper functions and selectors
3. Write your test using the Jest testing framework
4. Run the test using the `run-tests.js` script

Example:

```typescript
import '../utils/setup-puppeteer';
import { navigateToUrl, elementExists } from '../utils/puppeteer-helpers';
import * as selectors from '../utils/selectors';

describe('My New Test', () => {
  beforeAll(async () => {
    await navigateToUrl(global.BASE_URL);
  });

  test('should do something', async () => {
    const exists = await elementExists(selectors.SOME_ELEMENT);
    expect(exists).toBe(true);
  });
});
```

## Test Categories

Based on the UI Test Plan, tests are organized into the following categories:

1. Basic Page Load Tests
2. Form Input Tests
3. Calculation Tests
4. Visualization Tests
5. Edge Case Tests

Each category should be implemented incrementally, starting with the most basic functionality and building up to more complex scenarios.