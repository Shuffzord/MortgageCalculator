# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MortgageCalc is a client-side React mortgage calculator with TypeScript, featuring advanced visualization, multiple repayment models, overpayment optimization, and educational features. The app is 100% client-side with no backend.

## Development Commands

### Build & Development
```bash
npm run dev              # Start Vite dev server on http://localhost:3000
npm run build            # TypeScript check + production build to dist/public
npm run preview          # Preview production build locally
npm run check            # Run TypeScript type checking
npm run validate         # Run pre-build checks (security, logs)
```

### Testing
```bash
npm test                 # Run Jest unit tests (max 80% workers)
npm run test:watch       # Run tests in watch mode
npm run test:failed      # Run only previously failed tests
npm run test:coverage    # Generate coverage report
npm run test:e2e         # Run Puppeteer E2E tests
npm run test:e2e:report  # Run E2E tests with HTML report
npm run fulltest         # Run both unit and E2E tests
```

### Quality & Security
```bash
npm run security-audit   # Run security audit on dependencies
npm run check-logs       # Check for console.log statements
npm run precommit        # Run validation + tests (pre-commit hook)
```

### Deployment
```bash
npm run deploy:local     # Build and preview with Azure Static Web Apps CLI
npm run deploy:azure     # Deploy to Azure (requires PowerShell)
```

## Architecture

### Core Calculation Flow

The calculation system follows a strict layered architecture to avoid circular dependencies:

```
UI Components (React)
        ↓
calculationService (service layer - API for UI)
        ↓
calculationEngine (main calculation orchestrator)
        ↓
overpaymentCalculator (overpayment-specific logic)
        ↓
calculationCore (shared fundamental functions)
        ↓
types.ts (shared type definitions)
```

**Key Architecture Principles:**
1. **UI components MUST use `calculationService`** - Never import calculation modules directly
2. **calculationCore** breaks circular dependencies by providing shared functions (`roundToCents`, `calculateBaseMonthlyPayment`, `convertScheduleFormat`)
3. **calculationEngine** orchestrates all calculations and delegates to specialized modules
4. **overpaymentCalculator** handles all overpayment-specific logic (recurring, one-time, reduce term/payment)
5. **formatters.ts** handles all display formatting (currency, dates, percentages) - keep separate from calculation logic

### Module Dependencies

**calculationCore.ts** (lowest level):
- Contains: `roundToCents()`, `calculateBaseMonthlyPayment()`, `convertScheduleFormat()`
- Dependencies: Only types.ts
- Used by: calculationEngine, overpaymentCalculator, calculationService

**overpaymentCalculator.ts**:
- Contains: `applyOverpayment()`, `performOverpayments()`, `aggregateYearlyData()`, rate change logic
- Dependencies: calculationCore, types
- Used by: calculationEngine

**calculationEngine.ts**:
- Contains: Main calculation orchestration, `calculateLoanDetails()`, repayment models
- Dependencies: overpaymentCalculator, calculationCore, validation, formatters, types
- Used by: calculationService

**calculationService.ts** (service layer):
- Contains: UI-friendly API, parameter validation, result formatting
- Dependencies: calculationEngine, overpaymentCalculator, optimizationEngine, formatters, validation
- Used by: UI components

### Key Data Structures

**PaymentData** (unified payment structure in `types.ts`):
```typescript
{
  payment: number;              // 1-based payment number
  monthlyPayment: number;        // Total payment amount
  principalPayment: number;      // Principal portion
  interestPayment: number;       // Interest portion
  balance: number;               // Remaining balance
  totalInterest: number;         // Cumulative interest
  totalPayment: number;          // Cumulative payment
  isOverpayment: boolean;        // Has overpayment
  overpaymentAmount: number;     // Extra payment amount
  fees?: number;                 // Additional costs
  paymentDate?: Date;            // Payment date
}
```

**LoanDetails** (main input structure):
```typescript
{
  principal: number;
  interestRatePeriods: InterestRatePeriod[];  // Supports variable rates
  loanTerm: number;                            // Years
  overpaymentPlans: OverpaymentDetails[];
  startDate: Date;
  name: string;
  currency?: string;
  repaymentModel?: 'equalInstallments' | 'decreasingInstallments' | 'custom';
  additionalCosts?: AdditionalCosts;
}
```

### Repayment Models

1. **Equal Installments** (default): Fixed monthly payment, varying principal/interest ratio
2. **Decreasing Installments**: Fixed principal, decreasing interest, total payment decreases over time
3. **Custom**: For advanced scenarios with specific payment structures

### Overpayment Logic

The system supports sophisticated overpayment scenarios:
- **One-time overpayments**: Applied at specific dates
- **Recurring overpayments**: Monthly, quarterly, or annual with date ranges
- **Effects**: Reduce loan term OR reduce monthly payment
- **Date-based calculations**: Uses actual dates, not just month numbers

## Testing Strategy

### Unit Tests (Jest + React Testing Library)
- Test files: `**/*.test.ts(x)` (excluding `/client/e2e-tests/`)
- Comprehensive test suite in `client/src/lib/comprehensive-tests/`:
  - `amortization-validation.test.ts` - Schedule accuracy
  - `additional-costs.test.ts` - Fee calculations
  - `overpayment-*.test.ts` - Various overpayment scenarios
  - `interest-rate-changes.test.ts` - Variable rate handling
  - `edge-cases.test.ts` - Boundary conditions
- Test utilities in `client/src/test-utils/`:
  - `test-data.ts` - Standard test cases
  - `helpers.ts` - Test helpers
  - `mocks.ts` - Mock implementations

### E2E Tests (Puppeteer)
- Located in `client/e2e-tests/`
- Page objects pattern: `page-objects/LoanForm.ts`, `page-objects/LoanSummary.ts`
- Test specs: `specs/*.spec.ts`
- Run with: `npm run test:e2e` (auto-starts dev server on port 3000)
- Config flags:
  - `--no-server`: Don't start dev server
  - `--no-headless`: Run with visible browser
  - `--report`: Generate HTML report

## Path Aliases

Configured in both `tsconfig.json` and `vite.config.ts`:
```typescript
"@/*": ["./client/src/*"]      // Main source code
"@shared/*": ["./shared/*"]    // Shared types/utils
"@assets/*": ["./attached_assets/*"]  // Assets
```

Always use path aliases in imports:
```typescript
// ✅ Correct
import { calculateLoanDetails } from '@/lib/calculationEngine';
import { formatCurrency } from '@/lib/formatters';

// ❌ Wrong
import { calculateLoanDetails } from '../../../lib/calculationEngine';
```

## Build Process

### Vite Configuration
- **Root**: `client/` directory
- **Output**: `dist/public/`
- **Dev server**: Port 3000 with auto-open
- **Plugins**:
  - `removeConsolePlugin()` - Strips console.logs in production
  - `cleanScreenshotsPlugin()` - Cleans E2E screenshots
  - `runtimeErrorOverlay()` - Development error overlay

### Pre-build Checks
The `prebuild` script runs automatically before build:
1. Security audit (`scripts/security-audit.js`)
2. Console log check (`scripts/check-console-logs.js`)
3. Validation checks (`scripts/pre-build-checks.js`)

## Internationalization (i18n)

- Uses `i18next` with React integration
- Language detection via `i18next-browser-languagedetector`
- HTTP backend for loading translation files
- Routing: Language-prefixed paths (`/en/`, `/pl/`, etc.)
- Utility: `validateLanguage()` in `client/src/lib/languageUtils.ts`

## Tutorial System

Interactive tutorial using `react-joyride`:
- Configuration: `client/src/lib/tutorial/joyrideConfig.ts`
- Steps: `client/src/lib/tutorial/tutorialSteps.ts`
- Beginner mode: `client/src/lib/tutorial/beginnerTutorialSteps.ts`
- State management: `client/src/lib/tutorial/tutorialState.ts`
- Analytics: `client/src/lib/tutorial/analytics.ts`

## State Management

- **React Context API**: Primary state management
- **Zustand**: Used for specific stores (check for existing stores before adding new state)
- **React Query**: Server state (via `@tanstack/react-query`)
- **Local Storage**: Via `client/src/lib/storage.ts` and `client/src/lib/storageService.ts`

## UI Components

**shadcn/ui based components** in `client/src/components/ui/`:
- Built on Radix UI primitives
- Tailwind CSS for styling
- Custom theme via `next-themes`
- Component library: Accordion, Dialog, Toast, Chart, etc.

**Domain components** in `client/src/components/`:
- `LoanInputForm.tsx` - Main calculation input
- `AmortizationSchedule.tsx` - Schedule display
- `ChartSection.tsx` - Visualizations
- `OverpaymentOptimizationPanel.tsx` - Optimization features
- `DataTransferPanel.tsx` - Import/export
- `ScenarioComparison.tsx` - Scenario comparison

**Mortgage calculator components** in `client/src/components/mortgage-calculator/`:
- `calculator-form.tsx`
- `payment-summary.tsx`
- `amortization-schedule.tsx`
- `visualization.tsx`
- `saved-calculations-modal.tsx`

## Common Patterns

### Adding New Calculations

1. Define types in `types.ts`
2. Add core math to `calculationCore.ts` if reusable
3. Add specific logic to `overpaymentCalculator.ts` or `calculationEngine.ts`
4. Expose via `calculationService.ts` with validation
5. Add formatting to `formatters.ts`
6. Write comprehensive tests

### Working with Overpayments

```typescript
import { calculationService } from '@/lib/services/calculationService';

// Apply overpayment with effect
const overpayment: OverpaymentDetails = {
  amount: 5000,
  startDate: new Date('2024-06-01'),
  isRecurring: false,
  frequency: 'one-time',
  effect: 'reduceTerm'  // or 'reducePayment'
};

const results = calculationService.calculateWithOverpayments(loanDetails);
```

### Parameter Object Pattern

Prefer parameter objects over long argument lists:
```typescript
// ✅ Preferred
calculateDecreasingInstallment({
  principal: 300000,
  monthlyRate: 0.0029,
  totalMonths: 360,
  currentMonth: 1
});

// ❌ Avoid (but supported for backward compatibility)
calculateDecreasingInstallment(300000, 0.0029, 360, 1);
```

## Debugging

### Common Issues

**Circular Dependency Errors**:
- Ensure calculationCore is used for shared functions
- Never import calculationEngine into overpaymentCalculator
- Follow the dependency flow diagram

**Test Failures**:
- Check `client/src/lib/testCaseValues.ts` for standard test inputs
- Run `npm run test:failed` to focus on failures
- Use `npm run test:watch` for rapid iteration

**E2E Test Issues**:
- Ensure dev server is running (default: port 3000)
- Use `--no-headless` to see browser actions
- Check page objects for selector updates

## Performance Considerations

- **Memoization**: Used in calculationCore for expensive operations
- **Worker optimization**: Jest runs with `--maxWorkers=80%`
- **Bundle optimization**: Vite handles code splitting
- **Chart performance**: Use `recharts` with data sampling for large datasets

## Security & Validation

- Input validation in `client/src/lib/validation.ts`
- Security audit script: `scripts/security-audit.js`
- No console.logs in production (removed by Vite plugin)
- All calculations client-side (no data sent to servers)

## Git Workflow

- Main branch: `main`
- Clean status expected (no uncommitted changes in normal flow)
- Pre-commit checks via `npm run precommit`
- Deploy checks via `npm run predeploy`
