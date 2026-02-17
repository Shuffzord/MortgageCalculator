# Codebase Concerns

**Analysis Date:** 2026-02-17

## Tech Debt

**Disabled Form Validation (zodResolver):**
- Issue: Zod schema validation is defined but intentionally disabled in both main forms with a "TODO: fix dependency" comment. Forms have no runtime validation enforced via react-hook-form.
- Files: `client/src/components/LoanInputForm.tsx:106-107`, `client/src/components/mortgage-calculator/calculator-form.tsx:66-67`
- Impact: Invalid inputs can reach the calculation engine unchecked. Zod schema is dead code (defined but never used).
- Fix approach: Resolve the `@hookform/resolvers` dependency conflict and restore `resolver: zodResolver(loanFormSchema)` in both forms.

**Duplicate Storage Modules with Conflicting Keys:**
- Issue: Two independent storage modules exist — `storage.ts` (key: `"mortgage-calculator-saved"`) and `storageService.ts` (key: `"mortgageCalculations"`) — each with their own `saveCalculation`/`getSavedCalculations` functions. They write to different localStorage keys, so data saved by one is invisible to the other.
- Files: `client/src/lib/storage.ts`, `client/src/lib/storageService.ts`
- Impact: Users could lose access to previously saved calculations if the consuming component switches between these modules. Creates confusion over which is the canonical storage layer.
- Fix approach: Consolidate into one module. Pick one key name. Migrate any existing data.

**Dual Amortization Schedule Generators:**
- Issue: `utils.ts` contains a full `generateAmortizationSchedule` implementation and `calculationEngine.ts` re-exports it from there. Meanwhile `calculationEngine.ts` also imports and delegates to `overpaymentCalculator.ts`. Two separate schedule generation paths exist.
- Files: `client/src/lib/utils.ts:54-240`, `client/src/lib/calculationEngine.ts:21-23`
- Impact: Risk of schedule logic divergence. Tests may cover one path but not the other.
- Fix approach: `utils.ts` schedule generation should be fully retired in favour of the `calculationEngine` → `overpaymentCalculator` path. Convert `utils.ts` to only re-export from authoritative modules.

**Backward-Compatibility Shim Accumulation:**
- Issue: Multiple modules exist purely to preserve backward compatibility: `mortgage-calculator.ts` (re-exports from formatters, calculationCore, calculationEngine), `utils.ts` (re-exports formatCurrency, formatDate from formatters). Both introduce indirection without adding value.
- Files: `client/src/lib/mortgage-calculator.ts`, `client/src/lib/utils.ts`
- Impact: Import graph is harder to follow. Risk of stale shims diverging from real implementations.
- Fix approach: Migrate all consumers to direct imports from the authoritative module, then remove shim files.

**`.ts` Extension in Import Path:**
- Issue: `optimizationEngine.ts` imports `calculateLoanDetails` with a literal `.ts` extension in the module specifier, which is non-standard for TypeScript ESM and may fail with certain bundler configs.
- Files: `client/src/lib/optimizationEngine.ts:11` — `import { calculateLoanDetails } from './calculationEngine.ts'`
- Impact: May silently work under Vite but breaks standard tsc module resolution and portability.
- Fix approach: Remove the `.ts` extension: `import { calculateLoanDetails } from './calculationEngine'`.

**Stale Backup and Dead Files Committed to Repository:**
- Issue: Several `.bak` and `_original` files are tracked in git and sit in the source tree.
- Files:
  - `client/src/lib/calculate-payment.script.ts.bak`
  - `client/src/lib/calculationEngine.ts.bak`
  - `client/src/lib/direct-test.ts.bak`
  - `client/src/lib/direct-test.ts`
  - `client/src/lib/mortgage-calculator.js`
  - `client/src/lib/types.js`
  - `client/src/pages/home_original.tsx`
- Impact: Confuses IDE navigation and search results. `types.js` and `mortgage-calculator.js` are compiled outputs that may be accidentally imported.
- Fix approach: Delete all `.bak`, `direct-test.*`, `home_original.tsx`, and compiled `.js` artefacts. Add to `.gitignore`.

**Excessive Planning/Documentation Files in Root:**
- Issue: 20+ markdown plan/fix files scattered in the project root (tutorial-fixes.md, tutorial-fixes-v2.md, tutorial-fixes-v3.md, tutorial-positioning-fixes.md, etc.).
- Files: Root directory — `tutorial-fixes.md`, `tutorial-fixes-simplified.md`, `tutorial-fixes-v2.md`, `tutorial-fixes-v3.md`, `tutorial-implementation-plan.md`, `tutorial-integration-plan.md`, etc.
- Impact: Clutters the project root, makes navigation confusing. These are working notes, not deliverables.
- Fix approach: Move active planning to `.planning/`, delete resolved items.

## Known Bugs

**Overpayment Interest Guard Falls Back Silently:**
- Symptoms: When an overpayment calculation results in higher total interest than the original (due to edge cases), the code logs a `console.warn` and returns the original schedule as if no overpayment was applied. The UI shows no error.
- Files: `client/src/lib/overpaymentCalculator.ts:269-281`
- Trigger: Edge-case overpayment configurations that interact poorly with variable rate periods.
- Workaround: None visible to user — they see correct results but no indication that their overpayment was ignored.

**Overpayment Error Swallowed with `break`:**
- Symptoms: If `applyOverpayment` throws inside `performOverpayments`, the error is caught, logged, and the loop breaks. Subsequent overpayments in the same plan are silently skipped.
- Files: `client/src/lib/overpaymentCalculator.ts:936-939`
- Trigger: Malformed overpayment data or unexpected state during multi-overpayment scenarios.
- Workaround: None — partial overpayment application produces incorrect totals silently.

**Commented-Out Test (O2: Payment Reduction):**
- Symptoms: The one-time overpayment with payment reduction test case is entirely commented out with a "TO BE VERIFIED" note.
- Files: `client/src/lib/comprehensive-tests/overpayment.test.ts:53-105`
- Trigger: Test was not passing or expected values were uncertain.
- Workaround: Payment reduction overpayment scenario is untested at the comprehensive level.

## Security Considerations

**No Input Sanitization Before Calculation:**
- Risk: Because zodResolver is disabled (see Tech Debt), user input passes only through the custom `validateLoanDetails` function in `validation.ts`. The validation checks numeric ranges but does not guard against `NaN`, `Infinity`, or extremely large numbers that can cause float overflows in the schedule generator.
- Files: `client/src/lib/validation.ts`, `client/src/components/LoanInputForm.tsx`
- Current mitigation: `validateLoanDetails` checks principal > 0 and interest rate bounds.
- Recommendations: Re-enable zodResolver. Add guards for `isFinite` checks on all numeric inputs before they reach `calculationCore.ts`.

**localStorage Data Stored Without Schema Validation on Load:**
- Risk: Data loaded from localStorage is parsed with `JSON.parse` and returned as typed objects without validating the shape. A corrupt or tampered localStorage entry could produce runtime errors or inject unexpected values into calculations.
- Files: `client/src/lib/storage.ts:42-48`, `client/src/lib/storageService.ts:48-57`
- Current mitigation: `Array.isArray` check on the top-level object.
- Recommendations: Validate the shape of each loaded `LoanDetails` object (at minimum, check required numeric fields).

**Firebase Dependency Installed but Unused:**
- Risk: `firebase@^11.7.3` is listed as a production dependency but has no import in `client/src`. It adds ~3 MB to the bundle and represents an unused attack surface.
- Files: `package.json:68`
- Current mitigation: Vite tree-shaking may strip it from the bundle if no module imports it.
- Recommendations: Remove the firebase dependency until/unless the firebase implementation plan is acted on.

**Unused Server-Type DevDependencies:**
- Risk: `@types/passport` and `@types/passport-local` are devDependencies in a client-only project. They indicate a server layer was planned or previously existed, but there is no active server.
- Files: `package.json:102-103`
- Current mitigation: DevDependencies, no runtime impact.
- Recommendations: Remove unused type packages to keep dependency surface clean.

## Performance Bottlenecks

**overpaymentCalculator.ts at 1,441 Lines:**
- Problem: The entire overpayment calculation system is in a single file, including schedule generation, rate change handling, optimization logic, and aggregation.
- Files: `client/src/lib/overpaymentCalculator.ts`
- Cause: Incremental feature additions without module extraction.
- Improvement path: Split into `overpaymentSchedule.ts`, `overpaymentRates.ts`, `overpaymentAggregation.ts`. This also improves tree-shaking in Vite.

**LoanInputForm.tsx at 1,262 Lines:**
- Problem: A single React component handles the entire form: currency selection, interest rate periods, overpayment plans, additional costs — all in one file.
- Files: `client/src/components/LoanInputForm.tsx`
- Cause: Iterative additions without component decomposition.
- Improvement path: Extract `InterestRatePeriodsSection`, `OverpaymentPlansSection`, `AdditionalCostsSection` sub-components.

**Tutorial State Module with Console Logging on Every Action:**
- Problem: Every tutorial state transition triggers `console.log` calls (start, complete step, go previous, set level, complete, abandon, reset, complete section, complete interactive, set example, rehydrate).
- Files: `client/src/lib/tutorial/tutorialState.ts:124-335`
- Cause: Debug logging left in production code. Vite's `removeConsolePlugin` should strip these in production builds, but they remain in dev mode.
- Improvement path: Remove all tutorial `console.log` calls. The production plugin is a safety net, not a substitute.

## Fragile Areas

**Tutorial Analytics — No-Op Implementation:**
- Files: `client/src/lib/tutorial/analytics.ts`
- Why fragile: `TutorialAnalytics.logEvent()` appends to an in-memory array with a `//TODO:` comment where the analytics service call should be. Events accumulate in memory and are never sent or persisted.
- Safe modification: Do not add analytics service calls without first resolving the TODO and deciding on the analytics provider.
- Test coverage: No tests for analytics module.

**State Management Mix in HomePage:**
- Files: `client/src/components/HomePage.tsx`
- Why fragile: `HomePage` mixes external prop-controlled state (export/load modals) with internal state fallbacks using a dual-state pattern (`externalShowExportModal || internalShowExportModal`). It also reads from `localStorage` directly at component initialization (`useState(localStorage.getItem("selectedCurrency") || "USD")`), bypassing the storage abstraction layer.
- Safe modification: When modifying modal state flow, test both cases — when external state is provided and when it is not.
- Test coverage: No unit tests cover this dual-state logic.

**`comparisonEngine.ts` Uses `any[]` for Both Schedules:**
- Files: `client/src/lib/comparisonEngine.ts:74-75, 124-125, 153-154`
- Why fragile: Schedule comparison functions accept `any[]` parameters, meaning type errors in schedule format (e.g., missing `interestPayment`) are only caught at runtime.
- Safe modification: Pass `PaymentData[]` instead of `any[]` and add `null` guards.
- Test coverage: `comparisonService.test.ts` covers high-level comparison but not edge cases with malformed schedules.

## Scaling Limits

**localStorage for Data Persistence:**
- Current capacity: localStorage limit is typically 5-10 MB per origin.
- Limit: With large amortization schedules (30-year loans = 360 entries), each saved calculation can exceed 50 KB when serialized. A user saving many scenarios will hit the limit.
- Scaling path: Implement IndexedDB via the existing `storageService.ts` abstraction, or prune the schedule from saved data (recalculate on load from `LoanDetails`).

## Dependencies at Risk

**`jest-environment-jsdom@^30.0.0-beta.3` (Beta Dependency):**
- Risk: A beta version of a core test dependency is pinned. Breaking changes between beta versions could fail the entire test suite without notice.
- Impact: All unit tests.
- Migration plan: Monitor the release of `jest-environment-jsdom@30` stable and upgrade. Alternatively, downgrade to `^29.x` for stability.

**`firebase@^11.7.3` (Unused Production Dependency):**
- Risk: Production bundle size cost with no functionality gained. Firebase SDK has known bundle size issues even with tree-shaking.
- Impact: Potential bundle size increase; audit surface for vulnerabilities.
- Migration plan: Remove from `package.json` until the `firebase-implementation-plan.md` is acted upon.

## Missing Critical Features

**No Form-Level Validation Enforcement:**
- Problem: Both `LoanInputForm` and `calculator-form` have zodResolver disabled. The defined Zod schemas are never applied to form submissions.
- Blocks: Prevents reliable input sanitization before calculations. Users can submit empty or boundary-breaking values that bypass the lightweight `validateLoanDetails` check.

**Tutorial Analytics Never Sends Data:**
- Problem: All tutorial events (start, step completion, abandonment) are captured in memory but never transmitted to any analytics service.
- Blocks: No insight into tutorial effectiveness, drop-off rates, or experience level distribution.

## Test Coverage Gaps

**One-Time Overpayment with Payment Reduction (O2):**
- What's not tested: The `effect: 'reducePayment'` path for one-time overpayments is commented out at the comprehensive test level.
- Files: `client/src/lib/comprehensive-tests/overpayment.test.ts:53`
- Risk: Regression in payment reduction calculation would go undetected until manual testing.
- Priority: High

**storageService.ts:**
- What's not tested: `storageService.ts` has no dedicated test file. The competing `storage.ts` has minimal coverage via integration.
- Files: `client/src/lib/storageService.ts`
- Risk: Storage corruption or key collision bugs are undetected.
- Priority: Medium

**comparisonEngine.ts Edge Cases:**
- What's not tested: Comparison functions accept `any[]` but there are no tests for malformed schedule entries (missing fields, null values, NaN balances).
- Files: `client/src/lib/comparisonEngine.ts`
- Risk: Silent NaN propagation in comparison results.
- Priority: Medium

**HomePage Dual-State Modal Logic:**
- What's not tested: The conditional external/internal state fallback pattern in `HomePage` is untested.
- Files: `client/src/components/HomePage.tsx:100-103`
- Risk: Modal visibility bugs in contexts where external state is provided (e.g., App.tsx wiring).
- Priority: Low

**Tutorial Analytics Module:**
- What's not tested: `TutorialAnalytics` class has no unit tests.
- Files: `client/src/lib/tutorial/analytics.ts`
- Risk: Silent regression if the TODO is eventually implemented incorrectly.
- Priority: Low

---

*Concerns audit: 2026-02-17*
