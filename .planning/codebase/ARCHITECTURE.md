# Architecture

**Analysis Date:** 2026-02-17

## Pattern Overview

**Overall:** Layered Service Architecture (Client-Side SPA)

**Key Characteristics:**
- 100% client-side React SPA with no backend data operations
- Strict calculation layer hierarchy to prevent circular dependencies
- Service layer (`calculationService`) acts as the sole UI-facing API for all calculation logic
- State managed via React Context, Zustand stores, and localStorage persistence
- i18n-first UI with language-prefixed routing

## Layers

**UI Components:**
- Purpose: Render mortgage data, handle user input, display results
- Location: `client/src/components/`
- Contains: Domain components, shadcn/ui primitives, page-level layouts
- Depends on: `calculationService` (via `@/lib/services/`), `types.ts`, `storageService`, `formatters`
- Used by: Pages (`client/src/pages/`)

**Pages:**
- Purpose: Route-level page components
- Location: `client/src/pages/`
- Contains: `About.tsx`, `Education.tsx`, `not-found.tsx`, `home_original.tsx`
- Depends on: Components, hooks
- Used by: Router (configured in app entry)

**Service Layer:**
- Purpose: UI-friendly API surface; mediates between UI and calculation engines
- Location: `client/src/lib/services/calculationService.ts`, `client/src/lib/services/comparisonService.ts`
- Contains: `CalculationService` class (singleton export), input validation, result formatting, optimization coordination
- Depends on: `calculationEngine`, `overpaymentCalculator`, `optimizationEngine`, `formatters`, `validation`
- Used by: All UI components that trigger calculations

**Calculation Engine:**
- Purpose: Main calculation orchestrator; executes amortization schedules and repayment model logic
- Location: `client/src/lib/calculationEngine.ts`
- Contains: `calculateLoanDetails()`, `calculateDecreasingInstallment()`, equal/decreasing/custom repayment models, rate change orchestration
- Depends on: `overpaymentCalculator`, `calculationCore`, `validation`, `formatters`, `types`
- Used by: `calculationService`, `optimizationEngine`, `comparisonEngine`

**Overpayment Calculator:**
- Purpose: All overpayment-specific logic (one-time, recurring, reduce-term/reduce-payment effects)
- Location: `client/src/lib/overpaymentCalculator.ts`
- Contains: `applyOverpayment()`, `performOverpayments()`, `aggregateYearlyData()`, `recalculateScheduleWithNewRate()`, `applyRateChange()`
- Depends on: `calculationCore`, `types`
- Used by: `calculationEngine`, `calculationService`

**Calculation Core:**
- Purpose: Fundamental shared math functions; exists specifically to break circular dependencies
- Location: `client/src/lib/calculationCore.ts`
- Contains: `roundToCents()`, `calculateBaseMonthlyPayment()`, `convertScheduleFormat()`
- Depends on: `types.ts` only
- Used by: `calculationEngine`, `overpaymentCalculator`, `calculationService`

**Optimization Engine:**
- Purpose: Analyze and recommend overpayment strategies to maximize interest savings
- Location: `client/src/lib/optimizationEngine.ts`
- Contains: `optimizeOverpayments()`, `analyzeOverpaymentImpact()`, `compareLumpSumVsRegular()`
- Depends on: `calculationEngine`, `calculationCore`, `types`
- Used by: `calculationService`

**Comparison Engine:**
- Purpose: Side-by-side scenario comparison for multiple loan configurations
- Location: `client/src/lib/comparisonEngine.ts`
- Contains: `compareScenarios()`
- Depends on: `calculationEngine`, `calculationCore`, `types`
- Used by: `comparisonService` (`client/src/lib/services/comparisonService.ts`)

**Supporting Libraries:**
- `client/src/lib/formatters.ts` - All display formatting (currency, dates, rates, schedules)
- `client/src/lib/validation.ts` - Input validation for loan details and calculation params
- `client/src/lib/dataTransferEngine.ts` - CSV export and data import/export logic
- `client/src/lib/educationalContent.ts` - Glossary terms, concept explanations, interactive examples
- `client/src/lib/languageUtils.ts` - Language detection and validation
- `client/src/lib/storage.ts` - Raw localStorage save/load for `LoanDetails`
- `client/src/lib/storageService.ts` - Higher-level storage with `SavedCalculation` wrapping

## Data Flow

**Standard Calculation Flow:**

1. User inputs loan parameters via `LoanInputForm.tsx`
2. `HomePage.tsx` calls `calculationService.calculateBasicLoanDetails()` or `calculateWithOverpayments()`
3. `calculationService` validates inputs via `validation.ts`, then delegates to `calculationEngine.calculateLoanDetails()`
4. `calculationEngine` calls `calculationCore` for base payment math, then delegates overpayment logic to `overpaymentCalculator`
5. Results (`CalculationResults`) return up the chain to `calculationService`, which formats them via `formatters.ts`
6. `FormattedCalculationResults` passed to display components: `LoanSummary`, `ChartSection`, `AmortizationSchedule`

**Overpayment Flow:**

1. `OverpaymentDetails[]` attached to `LoanDetails.overpaymentPlans`
2. `calculationService.calculateWithOverpayments()` passes plans to `calculationEngine`
3. `calculationEngine` calls `performOverpayments()` from `overpaymentCalculator`
4. Each overpayment processed by `applyOverpayment()` - date-based matching, effect application (reduceTerm or reducePayment)
5. `aggregateYearlyData()` produces `YearlyData[]` for chart display

**Scenario Comparison Flow:**

1. Multiple `LoanDetails` passed to `comparisonService`
2. `comparisonEngine.compareScenarios()` calls `calculateLoanDetails()` per scenario
3. Differences calculated and returned as `ScenarioComparison`
4. Rendered in `ScenarioComparison.tsx`

**State Management:**
- Calculation results: Local `useState` in `HomePage.tsx`
- Tutorial state: Zustand store with `persist` middleware (`client/src/lib/tutorial/tutorialState.ts`)
- Saved calculations: localStorage via `storage.ts` and `storageService.ts`
- Toast/UI state: `use-toast.ts` hook
- Server state: `@tanstack/react-query` via `client/src/lib/queryClient.ts`

## Key Abstractions

**LoanDetails:**
- Purpose: Primary input structure for all calculation operations
- Examples: `client/src/lib/types.ts` (L16-27)
- Pattern: Single object parameter passed through all calculation layers; supports variable `interestRatePeriods[]` and multiple `overpaymentPlans[]`

**PaymentData:**
- Purpose: Unified per-payment row in amortization schedule
- Examples: `client/src/lib/types.ts` (L52-79)
- Pattern: Immutable data record; includes both raw numbers and optional formatted display strings

**CalculationResults / FormattedCalculationResults:**
- Purpose: Output of all calculation operations
- Examples: `client/src/lib/types.ts` (L92-125)
- Pattern: `CalculationResults` is raw numbers; `FormattedCalculationResults` extends it with a `formatted` bag of pre-formatted strings for display

**CalculationService (singleton):**
- Purpose: Single stable API for all UI-to-calculation communication
- Examples: `client/src/lib/services/calculationService.ts`
- Pattern: Exported as singleton instance `calculationService`; class implements `ICalculationService` interface

## Entry Points

**Application Entry:**
- Location: `client/src/main.tsx` (inferred from Vite root `client/`)
- Triggers: Browser load
- Responsibilities: Mount React app, initialize i18n, configure routing, wrap with providers

**Main Page Component:**
- Location: `client/src/components/HomePage.tsx`
- Triggers: Route match for home path
- Responsibilities: Orchestrate all major UI panels, manage local calculation state, coordinate tutorial state, handle save/load modals

**Vite Build Entry:**
- Location: `client/index.html` (Vite root is `client/`)
- Triggers: Dev server start or production build
- Responsibilities: HTML shell with script injection

## Error Handling

**Strategy:** Validation-first with early return; no global error boundary visible in explored files

**Patterns:**
- `validation.ts` returns `{ isValid: boolean; errors: string[] }` — caller decides how to surface errors
- `calculationService` runs `validateLoanDetails()` before delegating to engine
- localStorage access wrapped in `try/catch` in `storage.ts`
- Input forms rely on React state for field-level error display

## Cross-Cutting Concerns

**Logging:** No console.logs in production (Vite plugin `removeConsolePlugin` in `client/src/plugins/removeConsole.ts` strips all `console.*` calls at build time)

**Validation:** Centralized in `client/src/lib/validation.ts`; called by `calculationService` before all engine calls

**Authentication:** None — fully client-side, no user accounts

**Internationalization:** `i18next` with `react-i18next`; translation files in `client/public/locales/{en,pl,es}/`; language-prefixed routing; `formatters.ts` uses current i18n locale for currency/date formatting

**Persistence:** `localStorage` only; no server-side storage; two storage modules with overlapping concerns (`storage.ts` and `storageService.ts`)

---

*Architecture analysis: 2026-02-17*
