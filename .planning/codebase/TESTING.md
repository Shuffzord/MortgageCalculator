# Testing Patterns

**Analysis Date:** 2026-02-17

## Test Framework

**Runner:**
- Jest 29.7.0
- Config: `jest.config.cjs` (root level)
- Environment: `jsdom` (via `jest-environment-jsdom`)
- TypeScript via `ts-jest` with `isolatedModules: true`

**Assertion Library:**
- Jest built-in `expect` with `@testing-library/jest-dom` matchers (loaded via `jest.setup.cjs`)

**Run Commands:**
```bash
npm test                    # Run all unit tests (80% max workers)
npm run test:watch          # Watch mode
npm run test:coverage       # Generate coverage report (output: coverage/)
npm run test:failed         # Re-run only previously failed tests
npm run test:e2e            # Run Puppeteer E2E tests (auto-starts dev server)
npm run test:e2e:report     # E2E tests with HTML report
npm run fulltest            # Unit tests + E2E tests
```

## Test File Organization

**Location:**
- Unit tests: co-located with source files in `client/src/lib/` — e.g., `formatters.test.ts` next to `formatters.ts`
- Comprehensive test suites: grouped in `client/src/lib/comprehensive-tests/` by scenario domain
- Component tests: co-located in `client/src/components/` — e.g., `LoanSummary.test.tsx`
- E2E tests: isolated in `client/e2e-tests/`
- Test utilities: `client/src/test-utils/` (helpers, mocks, test-data, selectors)

**Naming:**
- Unit tests: `[module].test.ts` or `[module].test.tsx`
- E2E specs: `[feature].spec.ts` inside `client/e2e-tests/specs/`
- Comprehensive tests: descriptive kebab-case — e.g., `amortization-validation.test.ts`, `overpayment-yearly-totals.test.ts`, `interest-rate-changes.test.ts`, `edge-cases.test.ts`

**Structure:**
```
client/
├── src/
│   ├── lib/
│   │   ├── calculationCore.ts
│   │   ├── calculationCore.test.ts       # co-located unit test
│   │   ├── formatters.ts
│   │   ├── formatters.test.ts
│   │   ├── comprehensive-tests/          # domain-grouped test suites
│   │   │   ├── amortization-validation.test.ts
│   │   │   ├── edge-cases.test.ts
│   │   │   ├── interest-rate-changes.test.ts
│   │   │   ├── overpayment.test.ts
│   │   │   └── ...
│   │   └── services/
│   │       └── calculationService.ts
│   ├── components/
│   │   ├── LoanSummary.tsx
│   │   └── LoanSummary.test.tsx          # co-located component test
│   └── test-utils/
│       ├── helpers.ts                    # screen/userEvent helpers
│       ├── mocks.ts                      # reusable mock objects
│       ├── test-data.ts                  # standard loan data constants
│       ├── mockStore.ts
│       ├── selectors.ts
│       └── test-wrapper.tsx
└── e2e-tests/
    ├── specs/                            # E2E test specs
    │   ├── basic-page-load.spec.ts
    │   ├── form-input.spec.ts
    │   ├── accessibility.spec.ts
    │   └── calendar-interaction.spec.ts
    ├── page-objects/                     # Page Object Model
    │   ├── BasePage.ts
    │   ├── LoanForm.ts
    │   └── LoanSummary.ts
    ├── test-data/
    ├── utils/
    └── run-tests.ts
```

## Test Structure

**Suite Organization (unit tests):**
```typescript
describe('ModuleName', () => {
  describe('functionName', () => {
    test('describes the expected behavior', () => {
      // Arrange
      const input = 300000;

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toBeCloseTo(expected, 2);
    });
  });
});
```

**Comprehensive test suite pattern:**
```typescript
/**
 * Amortization Schedule Validation Tests for the Mortgage Calculator Engine
 *
 * These tests verify the correctness of amortization schedule generation...
 */
describe('Amortization Schedule Validation', () => {
  // Test A1: labeled with ID for traceability
  test('A1: Amortization Schedule Validation for 15-year 3.5% Loan', async () => {
    const principal = 200000;
    const results = await calculateLoanDetails(
      principal,
      [{ startMonth: 1, interestRate: 3.5 }],
      15
    );
    expect(results.monthlyPayment).toBeCloseTo(1429.77, 0);
    expect(results.amortizationSchedule[results.amortizationSchedule.length - 1].balance).toBeCloseTo(0, 0);
  });
});
```

**Patterns:**
- `beforeEach`: reset mocks with `jest.clearAllMocks()` — used in component tests
- `beforeAll`: navigate to page in E2E tests
- `afterAll`: take screenshot for reference in E2E tests
- `async/await`: required for calculation functions which are async

## Mocking

**Framework:** Jest built-in mocking (`jest.mock()`, `jest.fn()`, `jest.spyOn()`)

**Global mocks in `jest.setup.cjs`:**
```javascript
// i18n fully mocked
jest.mock('i18next', () => ({ createInstance: () => mockI18n, ... }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key, i18n: mockI18n }),
  I18nextProvider: ({ children }) => children
}));

// localStorage mocked on window object
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Browser APIs mocked globally
global.ResizeObserver = class ResizeObserver { observe(){} unobserve(){} disconnect(){} };
global.IntersectionObserver = class IntersectionObserver { observe(){} unobserve(){} disconnect(){} };
Object.defineProperty(window, 'matchMedia', { value: jest.fn().mockImplementation(...) });
```

**Module-level mocking pattern (in test files):**
```typescript
// Mock a service dependency
jest.mock('@/lib/services/calculationService', () => ({
  calculationService: {
    analyzeOverpaymentImpact: jest.fn()
  }
}));

// Mock i18n language property
jest.mock('@/i18n', () => ({
  language: 'en',
  changeLanguage: jest.fn()
}));
```

**Mock setup in `beforeEach`:**
```typescript
beforeEach(() => {
  jest.clearAllMocks();
  (calculationService.analyzeOverpaymentImpact as jest.Mock).mockReturnValue(mockImpactData);
});
```

**Date mocking (from `client/src/test-utils/helpers.ts`):**
```typescript
export const mockDate = (isoDate: string) => {
  const mockDate = new Date(isoDate);
  jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
};

export const restoreDate = () => {
  jest.spyOn(global, 'Date').mockRestore();
};
```

**What to Mock:**
- External modules: `i18next`, `react-i18next`, analytics modules
- Browser APIs not available in jsdom: `localStorage`, `ResizeObserver`, `IntersectionObserver`, `matchMedia`
- Service dependencies in component tests (mock `calculationService`, not calculation internals)

**What NOT to Mock:**
- Calculation logic modules (`calculationCore`, `calculationEngine`, `overpaymentCalculator`) — these are tested directly
- `date-fns` utilities — use real implementations

## Fixtures and Factories

**Standard loan test constants (`client/src/test-utils/test-data.ts`):**
```typescript
export const TEST_LOAN_DATA = {
  STANDARD_LOAN: {
    amount: 250000,
    interestRate: 4.5,
    term: 30,
    expectedMonthlyPayment: 1266.71
  },
  SHORT_TERM_LOAN: {
    amount: 200000,
    interestRate: 3.5,
    term: 15,
    expectedMonthlyPayment: 1429.77
  }
};
```

**Inline test data (pattern in comprehensive tests):**
```typescript
// Loan details objects constructed inline in each test
const loanDetails: LoanDetails = {
  principal: 300000,
  interestRatePeriods: [{ startMonth: 1, interestRate: 4 }],
  loanTerm: 30,
  overpaymentPlans: [],
  startDate: new Date('2025-01-01'),
  name: 'Test Loan',
  currency: 'USD'
};
```

**Mock objects in `client/src/test-utils/mocks.ts`:**
```typescript
export const mockAnalytics = {
  tutorialStarted: jest.fn(),
  stepCompleted: jest.fn(),
  tutorialCompleted: jest.fn(),
  tutorialAbandoned: jest.fn(),
  experienceLevelChanged: jest.fn(),
  getEvents: jest.fn().mockReturnValue([])
};

export const clearMocks = () => {
  mockLocalStorage.clear();
  mockAnalytics.tutorialStarted.mockClear();
  // ...clear all analytics mocks
};
```

**Location:**
- Reusable fixtures: `client/src/test-utils/test-data.ts`
- Reusable mock objects: `client/src/test-utils/mocks.ts`
- E2E test data: `client/e2e-tests/test-data/`

## Coverage

**Requirements:** No enforced coverage thresholds configured.

**Collection scope (from `jest.config.cjs`):**
```javascript
collectCoverageFrom: [
  'client/src/**/*.{ts,tsx}',
  '!client/src/**/*.d.ts'
]
```

**View Coverage:**
```bash
npm run test:coverage      # Generates report to coverage/ directory
```

## Test Types

**Unit Tests:**
- Scope: individual functions and modules in isolation
- Location: co-located `.test.ts(x)` files and `client/src/lib/comprehensive-tests/`
- Approach: test calculation functions directly with known inputs/outputs; use `toBeCloseTo` for floating-point results
- Framework: Jest + ts-jest

**Integration Tests (comprehensive-tests):**
- Scope: calculation pipeline across multiple modules working together
- Location: `client/src/lib/comprehensive-tests/`
- Approach: pass `LoanDetails` through full calculation stack and validate complete results
- Tests are labeled with IDs (e.g., `A1:`, `O1:`, `E1:`, `E2:`) for traceability

**Component Tests:**
- Scope: React component logic without full rendering
- Location: co-located `.test.tsx` files
- Approach: test business logic behavior (e.g., service calls, hook effects) rather than DOM rendering
- Note: some component tests are disabled (`.test.tsx.todo` extension) — e.g., `ExperienceLevelAssessment.test.tsx.todo`, `TutorialOverlay.test.tsx.todo`

**E2E Tests:**
- Framework: Puppeteer 24.9.0 with TypeScript
- Config: `client/e2e-tests/config/`
- Pattern: Page Object Model — `BasePage`, `LoanForm`, `LoanSummary` in `client/e2e-tests/page-objects/`
- Auto-starts dev server on port 3000 unless `--no-server` flag passed
- Screenshots captured to `client/e2e-tests/screenshots/` for debugging
- Baseline images in `client/e2e-tests/baselines/` for visual regression via `pixelmatch`

## Common Patterns

**Async Calculation Testing:**
```typescript
test('calculates loan correctly', async () => {
  const results = await calculateLoanDetails(
    300000,
    [{ startMonth: 1, interestRate: 4.5 }],
    30
  );
  expect(results.monthlyPayment).toBeCloseTo(1520.06, 0);
  expect(results.totalInterest).toBeGreaterThan(0);
});
```

**Floating-Point Assertions:**
```typescript
// Use toBeCloseTo with appropriate precision
expect(result).toBeCloseTo(1610.46, 2);   // 2 decimal places
expect(result).toBeCloseTo(347369.88, -2); // rounded to hundreds (large values)
expect(interestSavings).toBeGreaterThan(expectedSavings * 0.8); // 20% tolerance
```

**Error/Validation Testing:**
```typescript
test('validates loan details', () => {
  const { isValid, errors } = validateLoanDetails({
    principal: -1,
    ...
  });
  expect(isValid).toBe(false);
  expect(errors).toContain('Principal amount must be greater than zero');
});
```

**E2E Page Object Pattern:**
```typescript
describe('Basic Page Load Tests', () => {
  const basePage = new class extends BasePage {}();
  const loanForm = new LoanForm();

  beforeAll(async () => {
    await basePage.navigate();
  });

  afterAll(async () => {
    await basePage.takeScreenshot('final-state');
  });

  test('should load application correctly', async () => {
    const appExists = await basePage.elementExists(selectors.APP_CONTAINER);
    expect(appExists).toBe(true);
  });
});
```

**Commented-out / Deferred Tests:**
- Some tests marked `//TODO: TO BE VERIFIED` are commented out inline — e.g., in `client/src/lib/comprehensive-tests/overpayment.test.ts`
- Some component test files are renamed to `.todo` to skip them — e.g., `ExperienceLevelAssessment.test.tsx.todo`, `TutorialStep.test.tsx.todo`

---

*Testing analysis: 2026-02-17*
