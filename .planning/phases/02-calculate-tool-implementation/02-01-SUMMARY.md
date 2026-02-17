---
phase: 02-calculate-tool-implementation
plan: 01
subsystem: webmcp-tools
tags: [webmcp, tool-definition, validation, calculation]
dependencies:
  requires:
    - phase-01-plan-01 (WebMCP type definitions)
  provides:
    - calculateMortgage WebMCP tool
    - Tool input validation with Zod
    - Raw numeric response formatting
  affects:
    - client/src/lib/webmcp/types/tools.ts
    - client/src/lib/webmcp/tools/calculate.ts
    - client/src/lib/webmcp/tools/index.ts
    - client/src/lib/webmcp/index.ts
tech_stack:
  added:
    - zod: Runtime validation with type coercion
  patterns:
    - JSON Schema for WebMCP registration
    - Zod safeParse for non-throwing validation
    - Defensive type coercion (z.coerce.number)
    - First error only validation responses
    - Raw numeric values in tool responses
key_files:
  created:
    - client/src/lib/webmcp/tools/calculate.ts (170 lines)
    - client/src/lib/webmcp/tools/index.ts
  modified:
    - client/src/lib/webmcp/types/tools.ts
    - client/src/lib/webmcp/index.ts
decisions:
  - Use Zod z.coerce.number() for defensive type coercion
  - Return first validation error only with field path
  - Include full amortization schedule in response (agent decides how to present)
  - Raw numeric values only - no formatted strings
  - Optional metadata includes currency, repaymentModel, calculatedAt timestamp
  - Default currency = USD, repaymentModel = equalInstallments
  - Empty overpaymentPlans array (overpayment feature is future phase)
metrics:
  duration: 193 seconds
  tasks_completed: 4
  files_created: 2
  files_modified: 2
  commits: 4
  completed_date: 2026-02-17
---

# Phase 2 Plan 1: Calculate Tool Implementation Summary

**One-liner:** WebMCP calculateMortgage tool with JSON Schema definition, Zod validation, and raw numeric response formatting using calculationEngine.

## What Was Built

Implemented the `calculateMortgage` WebMCP tool that AI agents can invoke to perform mortgage calculations. The tool accepts loan parameters (principal, interest rate, term), validates inputs using Zod, calls the existing calculation engine, and returns raw numeric results including full amortization schedule.

### Task Breakdown

**Task 0: Update CalculateMortgageOutput type for raw numeric values**
- Removed formatted string fields (summary, naturalLanguageSummary)
- Added raw numeric fields: monthlyPayment, totalInterest, totalCost, termMonths
- Added full amortizationSchedule array with payment-level details
- Added yearlyData aggregated by year
- Added optional metadata (currency, repaymentModel, calculatedAt)
- Commit: 51cf084

**Task 1: Create calculateMortgage tool definition**
- JSON Schema with principal, annualInterestRate, loanTermYears (required)
- Optional currency and repaymentModel fields with defaults
- Zod schema with defensive type coercion (z.coerce.number)
- Custom error messages for validation failures
- mapInputToLoanCalculationParams converts to LoanCalculationParams format
- formatResponse returns raw numeric values only
- execute function uses safeParse for non-throwing validation
- Returns first error only with field path on validation failure
- Commit: 207214e

**Task 2: Create tools barrel export**
- Re-exports calculateMortgageTool and calculateMortgageInputSchema
- Exports allTools array for bulk registration
- Enables individual tool import or bulk registration
- Commit: f375da4

**Task 3: Update main webmcp barrel to include tools**
- Added tools re-export to main @/lib/webmcp module
- Enables single-import access: `import { calculateMortgageTool } from '@/lib/webmcp'`
- Commit: 40a304c

## Key Implementation Details

### Input Validation Strategy
- JSON Schema for WebMCP API registration (describes expected inputs)
- Zod schema for runtime validation with safeParse (non-throwing)
- Defensive type coercion using `z.coerce.number()` to handle string inputs
- First error only response pattern: `{field: "principal", message: "..."}`
- Defaults: currency = "USD", repaymentModel = "equalInstallments"

### Calculation Flow
1. Validate input with Zod safeParse
2. Return validation error if parsing fails (first error only)
3. Map validated input to LoanCalculationParams:
   - Convert single annualInterestRate to interestRatePeriods array
   - Empty overpaymentPlans array (Phase 2 doesn't include overpayments)
   - Current date for startDate
4. Call calculateLoanDetails from calculationEngine
5. Format response with raw numeric values only

### Response Format
```typescript
{
  monthlyPayment: 1234.56,
  totalInterest: 12345.67,
  totalCost: 112345.67,
  termMonths: 360,
  amortizationSchedule: [
    { payment: 1, monthlyPayment: 1234.56, principalPayment: 567.89, ... }
  ],
  yearlyData: [
    { year: 1, principal: 6789.01, interest: 8012.72, ... }
  ],
  metadata: {
    currency: "USD",
    repaymentModel: "equalInstallments",
    calculatedAt: "2026-02-17T16:39:45.123Z"
  }
}
```

### Error Handling
- Validation errors return structured response with field path
- Calculation errors caught and returned with CALCULATION_ERROR code
- All errors return ToolResponse format with error content block

## Verification Results

- [x] TypeScript compiles without errors
- [x] CalculateMortgageOutput uses raw numbers only (no formatted strings)
- [x] CalculateMortgageOutput has no naturalLanguageSummary field
- [x] calculateMortgageTool exported with validated ToolName
- [x] inputSchema follows JSON Schema specification
- [x] Tool uses Zod safeParse for non-throwing validation
- [x] Error responses include field path and message
- [x] Success responses contain raw numbers only
- [x] calculationEngine.calculateLoanDetails called with proper mapping
- [x] All must_haves artifacts present and verified

## Deviations from Plan

None - plan executed exactly as written.

## Files Changed

### Created
- `client/src/lib/webmcp/tools/calculate.ts` (170 lines) - Full tool implementation
- `client/src/lib/webmcp/tools/index.ts` - Tools barrel export

### Modified
- `client/src/lib/webmcp/types/tools.ts` - Updated CalculateMortgageOutput type
- `client/src/lib/webmcp/index.ts` - Added tools re-export

## Next Steps

Per ROADMAP.md Phase 3: Registration & Integration
- Register calculateMortgage tool with navigator.modelContext
- Add tool registration to app initialization
- Create integration test to verify tool invocation
- Document tool usage for AI agents

## Self-Check: PASSED

**Created files verification:**
- FOUND: client/src/lib/webmcp/tools/calculate.ts
- FOUND: client/src/lib/webmcp/tools/index.ts

**Modified files verification:**
- FOUND: client/src/lib/webmcp/types/tools.ts
- FOUND: client/src/lib/webmcp/index.ts

**Commits verification:**
- FOUND: 51cf084 (Task 0)
- FOUND: 207214e (Task 1)
- FOUND: f375da4 (Task 2)
- FOUND: 40a304c (Task 3)

**TypeScript compilation:**
- PASSED: No compilation errors

**Must-haves verification:**
- PASSED: CalculateMortgageOutput has amortizationSchedule
- PASSED: CalculateMortgageOutput has no naturalLanguageSummary
- PASSED: calculateMortgageTool exported from calculate.ts
- PASSED: inputSchema exported from calculate.ts
- PASSED: calculateLoanDetails imported and used
- PASSED: calculate.ts has 170 lines (exceeds min 80)
