# Coding Conventions

**Analysis Date:** 2026-02-17

## Naming Patterns

**Files:**
- React components: PascalCase with `.tsx` extension — e.g., `LoanInputForm.tsx`, `AmortizationSchedule.tsx`
- Logic/utility modules: camelCase with `.ts` extension — e.g., `calculationEngine.ts`, `formatters.ts`, `overpaymentCalculator.ts`
- Test files: co-located, same name as module + `.test.ts(x)` — e.g., `formatters.test.ts`, `calculationCore.test.ts`
- Comprehensive test suites: grouped in `client/src/lib/comprehensive-tests/` with descriptive kebab-case names — e.g., `amortization-validation.test.ts`, `edge-cases.test.ts`
- Page objects (E2E): PascalCase — e.g., `BasePage.ts`, `LoanForm.ts`

**Functions:**
- camelCase for all functions — e.g., `calculateLoanDetails()`, `formatCurrency()`, `roundToCents()`
- Class methods: camelCase — e.g., `fillLoanAmount()`, `analyzeOverpaymentImpact()`
- Boolean-returning functions: no required prefix convention observed, but descriptive names used — e.g., `isOverpaymentApplicable()`

**Variables:**
- camelCase for local variables — e.g., `remainingPrincipal`, `monthlyRate`, `currentDate`
- SCREAMING_SNAKE_CASE for module-level constants — e.g., `CURRENCIES`
- `const` preferred over `let` wherever possible

**Types/Interfaces:**
- PascalCase for all interfaces and type aliases — e.g., `LoanDetails`, `PaymentData`, `OverpaymentDetails`, `RepaymentModel`
- Interface names are not prefixed with `I` (except `ICalculationService` which is the service contract)
- Param types use descriptive `Params` suffix — e.g., `DecreasingInstallmentParams`, `OverpaymentParams`, `FinalizeResultsParams`
- Enum-style string unions preferred over enums — e.g., `'reduceTerm' | 'reducePayment'`, `'monthly' | 'quarterly' | 'annual' | 'one-time'`

## Code Style

**Formatting:**
- No project-level Prettier or ESLint config files at root — formatting is not enforced by tooling
- TypeScript `strict` mode is enabled (`tsconfig.json` line 9)
- 2-space indentation used throughout (observed from source files)
- Double quotes used for JSX attributes; single or double quotes used in `.ts` files inconsistently

**Linting:**
- No project-level ESLint config detected
- `tsc` is the primary type-checking mechanism, run via `npm run check`
- A custom `check-console-logs` script enforces no `console.log` in production code — `scripts/check-console-logs.js`
- A custom `security-audit` script enforces dependency safety — `scripts/security-audit.js`
- Pre-build checks run automatically via `scripts/pre-build-checks.js`

## Import Organization

**Order (observed pattern):**
1. React and React ecosystem imports — e.g., `import { useState, useEffect } from "react"`
2. Third-party packages — e.g., `import { useForm } from "react-hook-form"`, `import { z } from "zod"`
3. Internal type imports from `@/lib/types`
4. Internal component imports from `@/components/ui/...`
5. Internal library imports from `@/lib/...`
6. Relative imports (avoided in favor of aliases)

**Path Aliases:**
- `@/*` maps to `client/src/*` — use for all internal imports
- `@shared/*` maps to `shared/*` — use for shared types across client/server
- Relative paths (`../../../`) are explicitly forbidden — use aliases

**Example:**
```typescript
// Correct
import { LoanDetails } from "@/lib/types";
import { formatCurrency } from "@/lib/formatters";
import { calculationService } from "@/lib/services/calculationService";
import { Input } from "@/components/ui/input";

// Wrong
import { LoanDetails } from "../../../lib/types";
```

## Error Handling

**Validation Pattern:**
- Validation functions return `{ isValid: boolean; errors: string[] }` — e.g., `validateLoanDetails()` in `client/src/lib/validation.ts`
- Errors collected into an array before returning — never throw from validation functions
- Options object pattern for configurable validation thresholds — e.g., `ValidationOptions` with `maxInterestRate`, `maxLoanTerm`, etc.

**Example:**
```typescript
export function validateLoanDetails(
  loanDetails: LoanDetails,
  options: ValidationOptions = {}
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (loanDetails.principal <= 0) {
    errors.push('Principal amount must be greater than zero');
  }
  return { isValid: errors.length === 0, errors };
}
```

**Form Validation:**
- Zod schemas defined at module level for form validation — e.g., `loanFormSchema` in `client/src/components/LoanInputForm.tsx`
- `react-hook-form` used with Zod for UI-level validation
- Note: `zodResolver` is temporarily disabled (TODO comment in `LoanInputForm.tsx` line 106 and `calculator-form.tsx` line 66)

## Logging

**Framework:** No logging framework — `console.log` is explicitly prohibited.

**Patterns:**
- `console.log` is stripped from production builds via `removeConsolePlugin()` in Vite config
- `scripts/check-console-logs.js` script enforces no console logs in source
- `console.warn` and `console.error` are suppressed in test setup via `jest.setup.cjs`

## Comments

**When to Comment:**
- `@fileoverview` JSDoc block at the top of every module — documents purpose, dependencies, and architecture role
- All exported functions have JSDoc with `@param`, `@returns`, and `@example` tags
- Inline comments for non-obvious logic — e.g., floating-point edge cases, legacy format handling
- Deprecated overloads marked with `@deprecated` JSDoc tag

**Example JSDoc pattern:**
```typescript
/**
 * @fileoverview Core calculation functions for mortgage calculations
 *
 * This module contains fundamental calculation functions that are shared between
 * the calculationEngine and mortgage-calculator modules...
 */

/**
 * Rounds a number to two decimal places (cents)
 *
 * @param {number} amount - The monetary amount to round
 * @returns {number} The amount rounded to two decimal places
 *
 * @example
 * roundToCents(123.456); // Returns: 123.46
 */
export function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}
```

## Function Design

**Overloaded Signatures Pattern:**
- Functions that support both new (parameter object) and legacy (positional) APIs use TypeScript function overloads
- The implementation signature accepts a union type and branches on `Array.isArray()` or `typeof` checks
- Legacy overloads are tagged `@deprecated`

**Example:**
```typescript
// New preferred API
export function applyOverpayment(params: OverpaymentParams): CalculationResults;

// Legacy positional API (backward compatibility)
// @deprecated Use parameter object version instead
export function applyOverpayment(
  schedule: PaymentData[],
  overpaymentAmount: number,
  afterPayment: number,
  loanDetails: LoanDetails,
  effect: 'reduceTerm' | 'reducePayment'
): CalculationResults;
```

**Parameter Objects:**
- Prefer parameter object over long argument lists — defined as typed interfaces in `types.ts`
- Examples: `DecreasingInstallmentParams`, `OverpaymentParams`, `ReducedTermParams`

**Size:**
- Large calculation functions kept in dedicated modules, not split arbitrarily
- Helper functions extracted when reused (e.g., `roundToCents`, `convertScheduleFormat`)

**Async:**
- Calculation functions are `async` and return `Promise` — e.g., `calculateLoanDetails()` returns a promise despite doing synchronous work (for consistency and potential future async operations)

## Module Design

**Service Layer Pattern:**
- UI components import only from `calculationService` — never from `calculationEngine` or lower-level modules directly
- `CalculationService` is exported as a singleton instance: `export const calculationService = new CalculationService()`
- Service class implements an interface (`ICalculationService`) for testability

**Barrel / Re-export Pattern:**
- `utils.ts` re-exports functions from other modules for backward compatibility — e.g., `export { formatCurrency, formatDate }` from `formatters.ts`
- Prefer importing from the authoritative source module over barrel re-exports in new code

**Exports:**
- Named exports used throughout — no default exports except for React components
- React components use default exports — e.g., `export default LoanSummary`

**Dependency Direction (strict):**
```
UI Components → calculationService → calculationEngine → overpaymentCalculator → calculationCore → types.ts
```
Never import upward in this chain.

## Tailwind / Styling

- `cn()` utility from `client/src/lib/utils.ts` combines `clsx` and `tailwind-merge` for conditional class application
- shadcn/ui component library wraps Radix UI primitives — use these over custom HTML elements
- `next-themes` used for dark/light mode theming

---

*Convention analysis: 2026-02-17*
