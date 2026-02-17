# WebMCP Testing Research

**Researched:** 2026-02-17
**Confidence:** MEDIUM (based on official WebMCP Early Preview documentation + standard testing practices)

## Executive Summary

WebMCP testing requires a multi-layered approach due to the browser-specific nature of the `navigator.modelContext` API. Manual testing uses Google's official "Model Context Tool Inspector" Chrome extension, unit testing requires mocking the `navigator.modelContext` API, and E2E testing requires Chrome 146+ with the WebMCP flag enabled. The biggest challenge is that WebMCP is only available behind a Chrome flag, limiting automated CI/CD testing options.

---

## 1. Manual Testing with Chrome Extension

### Model Context Tool Inspector

**Source:** Official WebMCP Early Preview documentation (Feb 10, 2026)
**Chrome Web Store:** https://chromewebstore.google.com/detail/model-context-tool-inspec/gbpdfapgefenggkahomfgkhfehlcenpd

#### Features

| Feature | Description | Use Case |
|---------|-------------|----------|
| **List Registered Tools** | Displays all tools registered via `registerTool()`, `provideContext()`, and declarative HTML forms | Verify tools are correctly registered |
| **Manual Tool Execution** | Execute tools with custom JSON parameters directly | Test tool logic without AI agent variance |
| **AI Agent Simulation** | Uses Gemini 2.5 Flash to simulate natural language tool invocation | Test if tool descriptions are clear enough for AI |

#### How It Works

1. The extension uses the experimental `navigator.modelContextTesting` API
2. Detects both imperative (`registerTool()`) and declarative (HTML form) tools
3. Displays tool name, description, and JSON input schema
4. Allows direct execution with custom parameters

#### Testing Workflow with Extension

```
1. Open Chrome 146+ with WebMCP flag enabled
2. Navigate to your application
3. Open Model Context Tool Inspector extension
4. Verify tools appear in the list with correct:
   - Tool names
   - Descriptions
   - Input schemas (JSON structure)
5. Test tools manually:
   - Input known-good parameters
   - Verify execution succeeds
   - Check returned content matches expectations
6. Test with Gemini (optional):
   - Add Gemini API key
   - Send natural language prompts
   - Verify correct tool is selected with correct parameters
```

#### Manual Testing Checklist

- [ ] Tool appears in extension list
- [ ] Tool name is descriptive
- [ ] Tool description is clear
- [ ] Input schema matches expected parameters
- [ ] Manual execution with valid params succeeds
- [ ] Manual execution with invalid params returns descriptive error
- [ ] Tool execution updates UI appropriately
- [ ] Natural language prompts trigger correct tool (Gemini test)

---

## 2. Unit Testing Strategies (Mocking)

### Challenge

Jest runs in a jsdom environment, which does not have `navigator.modelContext`. This API only exists in Chrome 146+ with the WebMCP flag enabled.

### Mocking Strategy

Create a mock implementation of the `navigator.modelContext` API that captures tool registrations and allows controlled execution testing.

#### Recommended Mock Implementation

```typescript
// __mocks__/navigator-model-context.ts

interface WebMCPTool {
  name: string;
  description: string;
  inputSchema: object;
  annotations?: Record<string, string>;
  execute: (params: any) => { content: Array<{ type: string; text: string }> };
}

interface ModelContextMock {
  registeredTools: Map<string, WebMCPTool>;
  registerTool: jest.Mock;
  unregisterTool: jest.Mock;
  provideContext: jest.Mock;
  clearContext: jest.Mock;
}

export function createModelContextMock(): ModelContextMock {
  const registeredTools = new Map<string, WebMCPTool>();

  return {
    registeredTools,

    registerTool: jest.fn((tool: WebMCPTool) => {
      registeredTools.set(tool.name, tool);
    }),

    unregisterTool: jest.fn((name: string) => {
      registeredTools.delete(name);
    }),

    provideContext: jest.fn(({ tools }: { tools: WebMCPTool[] }) => {
      registeredTools.clear();
      tools.forEach(tool => registeredTools.set(tool.name, tool));
    }),

    clearContext: jest.fn(() => {
      registeredTools.clear();
    }),
  };
}

export function setupNavigatorMock(mock: ModelContextMock): void {
  Object.defineProperty(navigator, 'modelContext', {
    value: mock,
    writable: true,
    configurable: true,
  });
}

export function teardownNavigatorMock(): void {
  // @ts-ignore
  delete navigator.modelContext;
}
```

#### Unit Test Example

```typescript
// webmcp-tools.test.ts

import { createModelContextMock, setupNavigatorMock, teardownNavigatorMock } from '../__mocks__/navigator-model-context';

describe('WebMCP Tool Registration', () => {
  let mockContext: ReturnType<typeof createModelContextMock>;

  beforeEach(() => {
    mockContext = createModelContextMock();
    setupNavigatorMock(mockContext);
  });

  afterEach(() => {
    teardownNavigatorMock();
  });

  test('registers calculateMortgage tool with correct schema', () => {
    // Import your tool registration code
    // This triggers the registerTool call
    require('../src/webmcp/tools');

    expect(mockContext.registerTool).toHaveBeenCalled();

    const registeredTool = mockContext.registeredTools.get('calculateMortgage');
    expect(registeredTool).toBeDefined();
    expect(registeredTool?.name).toBe('calculateMortgage');
    expect(registeredTool?.inputSchema).toMatchObject({
      type: 'object',
      properties: {
        loanAmount: { type: 'number' },
        interestRate: { type: 'number' },
        termYears: { type: 'number' },
      },
    });
  });

  test('tool execution returns correct result', () => {
    require('../src/webmcp/tools');

    const tool = mockContext.registeredTools.get('calculateMortgage');
    const result = tool?.execute({
      loanAmount: 300000,
      interestRate: 5.5,
      termYears: 30,
    });

    expect(result?.content).toEqual([
      expect.objectContaining({
        type: 'text',
        text: expect.stringContaining('monthly payment'),
      }),
    ]);
  });

  test('tool execution handles invalid input gracefully', () => {
    require('../src/webmcp/tools');

    const tool = mockContext.registeredTools.get('calculateMortgage');
    const result = tool?.execute({
      loanAmount: -100, // Invalid
      interestRate: 5.5,
      termYears: 30,
    });

    expect(result?.content[0]?.text).toContain('error');
  });
});
```

#### Jest Setup Configuration

Add to `jest.setup.cjs`:

```javascript
// Ensure navigator exists in jsdom
if (typeof navigator === 'undefined') {
  global.navigator = {};
}

// Optional: Set up a default mock for all tests
// Uncomment if you want modelContext available by default
// const { createModelContextMock, setupNavigatorMock } = require('./__mocks__/navigator-model-context');
// setupNavigatorMock(createModelContextMock());
```

### What Unit Tests Should Cover

| Test Category | Description |
|--------------|-------------|
| **Registration** | Tools are registered with correct names, descriptions, schemas |
| **Schema Validation** | Input schemas match expected structure |
| **Execute Logic** | Tool execute functions return correct results |
| **Error Handling** | Invalid inputs return descriptive errors |
| **State Management** | Tools register/unregister at correct lifecycle points |
| **Annotations** | Tool annotations (readOnlyHint, etc.) are correct |

### Testing Declarative Tools (HTML Forms)

For declarative tools using HTML form annotations, unit tests should verify:

1. Form elements have correct `toolname` and `tooldescription` attributes
2. Form fields have correct `toolparamtitle` and `toolparamdescription` attributes
3. Required fields are marked correctly

```typescript
// declarative-tools.test.tsx

import { render, screen } from '@testing-library/react';
import MortgageForm from '../src/components/MortgageForm';

describe('Declarative WebMCP Tool (Form)', () => {
  test('form has correct WebMCP annotations', () => {
    render(<MortgageForm />);

    const form = screen.getByRole('form');
    expect(form).toHaveAttribute('toolname', 'calculate_mortgage');
    expect(form).toHaveAttribute('tooldescription', expect.stringContaining('mortgage'));
  });

  test('form fields have param descriptions', () => {
    render(<MortgageForm />);

    const loanAmountInput = screen.getByLabelText(/loan amount/i);
    expect(loanAmountInput).toHaveAttribute('toolparamdescription');
  });
});
```

---

## 3. E2E Testing with Puppeteer

### Challenge

WebMCP requires Chrome 146+ with a flag enabled. Standard Puppeteer downloads may not include this version, and the flag must be explicitly enabled at browser launch.

### Puppeteer Configuration for WebMCP

#### Prerequisites

1. Chrome 146.0.7672.0 or higher installed
2. WebMCP flag enabled via command line args

#### Launch Configuration

```typescript
// e2e-tests/utils/setup-webmcp-puppeteer.ts

import puppeteer from 'puppeteer';
import type { Browser, Page } from 'puppeteer';

declare global {
  var browser: Browser;
  var page: Page;
}

export async function initWebMCPPuppeteer() {
  // Path to Chrome 146+ installation
  // On Windows: typically 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  // On macOS: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  // On Linux: '/usr/bin/google-chrome' or '/opt/google/chrome/chrome'
  const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  const browser = await puppeteer.launch({
    headless: process.env.HEADLESS !== 'false',
    executablePath: chromePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      // Enable WebMCP flag
      '--enable-features=WebMCP',
      // Alternative flag name (check Chrome version)
      // '--enable-webmcp-testing',
    ],
    defaultViewport: { width: 1280, height: 800 },
  });

  const page = await browser.newPage();
  global.browser = browser;
  global.page = page;

  return { browser, page };
}
```

### E2E Test Patterns

#### Pattern 1: Verify Tool Registration

```typescript
// specs/webmcp-registration.spec.ts

describe('WebMCP Tool Registration', () => {
  test('tools are registered after page load', async () => {
    await page.goto('http://localhost:5173');

    // Wait for app to initialize
    await page.waitForFunction(() => {
      return window.navigator.modelContext !== undefined;
    });

    // Get registered tools
    const tools = await page.evaluate(() => {
      // Note: There's no standard API to list tools
      // This would require the modelContextTesting API
      // or custom instrumentation
      return window.__webmcp_registered_tools || [];
    });

    expect(tools.length).toBeGreaterThan(0);
  });
});
```

#### Pattern 2: Test Tool Execution via UI

```typescript
// specs/webmcp-execution.spec.ts

describe('WebMCP Tool Execution', () => {
  test('calculateMortgage tool produces correct UI update', async () => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="mortgage-form"]');

    // Execute tool directly via modelContext
    const result = await page.evaluate(async () => {
      const tools = await window.navigator.modelContext.getTools?.();
      const calcTool = tools?.find(t => t.name === 'calculateMortgage');

      if (calcTool) {
        return await calcTool.execute({
          loanAmount: 300000,
          interestRate: 5.5,
          termYears: 30,
        });
      }
      return null;
    });

    expect(result?.content).toBeDefined();

    // Verify UI updated
    const monthlyPayment = await page.$eval(
      '[data-testid="monthly-payment"]',
      el => el.textContent
    );
    expect(monthlyPayment).toBeTruthy();
  });
});
```

#### Pattern 3: Test Declarative Form Tool

```typescript
// specs/webmcp-declarative.spec.ts

describe('WebMCP Declarative Form', () => {
  test('form submission via tool triggers correct behavior', async () => {
    await page.goto('http://localhost:5173');

    // Simulate tool activation (browser fills form)
    await page.evaluate(() => {
      const form = document.querySelector('form[toolname="calculate_mortgage"]');
      if (form) {
        // Simulate the toolactivated event
        const event = new CustomEvent('toolactivated', {
          detail: { toolName: 'calculate_mortgage' }
        });
        window.dispatchEvent(event);
      }
    });

    // Fill form programmatically (simulating agent)
    await page.type('[name="loanAmount"]', '300000');
    await page.type('[name="interestRate"]', '5.5');
    await page.type('[name="termYears"]', '30');

    // Verify form has tool-form-active class
    const formActive = await page.$eval(
      'form[toolname="calculate_mortgage"]',
      form => form.classList.contains('tool-form-active')
    );
    // Note: This may not work without actual agent invocation
  });
});
```

### E2E Testing Limitations

| Limitation | Impact | Workaround |
|------------|--------|------------|
| Requires Chrome 146+ | CI/CD may not have this version | Use Docker with specific Chrome version |
| Flag must be enabled | Standard Puppeteer doesn't enable by default | Use executablePath + args |
| No standard tool listing API | Cannot enumerate registered tools | Instrument app to expose tools for testing |
| modelContextTesting is experimental | May change or be removed | Accept test brittleness |
| Agent simulation requires Gemini key | Cannot fully test AI integration | Use extension manually or mock |

---

## 4. Development Workflow

### Recommended Testing Pyramid

```
           /\
          /  \
         / AI \        <- Manual testing with Gemini (expensive, non-deterministic)
        /------\
       /  E2E   \      <- Puppeteer with Chrome 146+ (slower, real browser)
      /----------\
     / Integration\    <- Jest with mocks (faster, controlled)
    /--------------\
   /    Unit Tests  \  <- Pure function testing (fastest)
  /------------------\
```

### Development Workflow Checklist

#### Before Starting Development

1. Install Chrome 146+ from Chrome Canary/Dev channel
2. Enable WebMCP flag: `chrome://flags/#enable-webmcp-testing`
3. Install Model Context Tool Inspector extension
4. Verify flag works: `navigator.modelContext` should exist in DevTools console

#### During Development

| Step | Tool | Purpose |
|------|------|---------|
| 1 | Unit tests (Jest) | Test execute function logic in isolation |
| 2 | Chrome + Extension | Verify tool appears correctly |
| 3 | Extension manual test | Execute tool with known params |
| 4 | E2E tests (Puppeteer) | Verify full integration |
| 5 | Gemini test (optional) | Verify AI can use tool correctly |

#### Quick Feedback Loop

```bash
# Terminal 1: Run dev server
npm run dev

# Terminal 2: Run unit tests in watch mode
npm run test:watch -- --testPathPattern=webmcp

# Browser: Open app with extension for manual testing
```

### Debugging Tips

1. **Tool not appearing in extension:**
   - Check `navigator.modelContext` exists (flag enabled?)
   - Verify `registerTool` is called (add console.log)
   - Check for JavaScript errors preventing registration

2. **Tool execution fails:**
   - Test execute function directly in unit tests first
   - Check schema matches what execute function expects
   - Verify error handling returns descriptive messages

3. **E2E tests fail:**
   - Verify correct Chrome version (`chrome://version`)
   - Verify WebMCP flag is enabled
   - Check Puppeteer launch args include feature flag

---

## 5. Known Limitations and Gaps

### Testing Gaps

| Gap | Severity | Recommendation |
|-----|----------|----------------|
| No standard tool enumeration API | HIGH | Instrument app to expose tools for testing |
| Experimental APIs may change | MEDIUM | Accept test brittleness, version-lock Chrome |
| AI agent testing is non-deterministic | LOW | Keep Gemini tests manual |
| CI/CD Chrome version availability | HIGH | Use Docker with specific Chrome build |

### What Cannot Be Tested Automatically

1. **AI agent understanding** - Whether an AI correctly interprets tool descriptions
2. **Natural language variations** - How agents handle different phrasings
3. **Multi-tool orchestration** - Complex agent workflows across multiple tools

### Recommended Mitigations

1. **Confidence Levels:**
   - HIGH: Unit tests with mocks
   - MEDIUM: E2E tests with Puppeteer + Chrome 146
   - LOW: AI agent testing (keep manual)

2. **Version Pinning:**
   - Pin Chrome version in CI/CD Docker images
   - Document required Chrome version in README

3. **Feature Detection:**
   ```typescript
   function isWebMCPAvailable(): boolean {
     return typeof navigator !== 'undefined'
       && 'modelContext' in navigator
       && typeof navigator.modelContext?.registerTool === 'function';
   }
   ```

---

## 6. Testing Infrastructure Recommendations

### Unit Test Setup (Jest)

**Location:** `__mocks__/navigator-model-context.ts`

```
client/src/
  __mocks__/
    navigator-model-context.ts   <- Mock implementation
  webmcp/
    tools.ts                      <- Tool definitions
    tools.test.ts                 <- Unit tests
```

### E2E Test Setup (Puppeteer)

**Location:** `client/e2e-tests/`

```
client/e2e-tests/
  config/
    setup-webmcp.ts              <- WebMCP-specific Puppeteer setup
  specs/
    webmcp-registration.spec.ts   <- Tool registration tests
    webmcp-execution.spec.ts      <- Tool execution tests
  utils/
    webmcp-helpers.ts             <- Helper functions for WebMCP testing
```

### CI/CD Considerations

```yaml
# Example GitHub Actions configuration
jobs:
  webmcp-tests:
    runs-on: ubuntu-latest
    container:
      image: chromedp/headless-shell:146.0.7672.0  # Hypothetical
    steps:
      - uses: actions/checkout@v4
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm test -- --testPathPattern=webmcp
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CHROME_PATH: /headless-shell/headless-shell
```

**Note:** As of this research date (Feb 2026), Chrome 146 is very new. CI/CD Docker images with this version may not be readily available. Plan for delayed CI/CD integration.

---

## Sources

- WebMCP Early Preview documentation (Google Chrome, Feb 10, 2026) - **PRIMARY SOURCE**
- Model Context Tool Inspector Chrome Extension: https://chromewebstore.google.com/detail/model-context-tool-inspec/gbpdfapgefenggkahomfgkhfehlcenpd
- WebMCP GitHub repository: https://github.com/GoogleChromeLabs/webmcp-tools
- WebMCP specification: https://github.com/webmachinelearning/webmcp
- Live demos:
  - React flight search (imperative): https://googlechromelabs.github.io/webmcp-tools/demos/react-flightsearch/
  - French bistro (declarative): https://googlechromelabs.github.io/webmcp-tools/demos/french-bistro/

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Manual testing with extension | HIGH | Official documentation details |
| Unit testing mocking strategy | MEDIUM | Standard patterns, not WebMCP-specific docs |
| E2E testing with Puppeteer | MEDIUM | Puppeteer docs + inference from Chrome flags |
| CI/CD integration | LOW | Chrome 146 is very new, Docker images unverified |
| AI agent testing | LOW | Non-deterministic, manual testing recommended |
