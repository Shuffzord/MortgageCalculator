# Phase 2: Calculate Tool Implementation - Research

**Researched:** 2026-02-17
**Domain:** WebMCP tool implementation, validation, and response formatting
**Confidence:** HIGH

## Summary

Phase 2 implements the `calculateMortgage` WebMCP tool that AI agents can invoke to perform mortgage calculations. The tool requires three core components: (1) a JSON Schema input definition for WebMCP registration, (2) Zod-based runtime validation for type safety and error handling, and (3) a response formatter that converts calculation engine output into the AI-consumable format defined in user requirements.

The existing codebase provides strong foundations: Zod 3.24.3 is already installed, a robust `calculationEngine.ts` with `calculateLoanDetails()` function exists, comprehensive validation logic is present in `validation.ts`, and formatting utilities are available in `formatters.ts`. The primary implementation challenge is bridging the gap between the WebMCP tool interface (which expects simple inputs like `principal`, `annualInterestRate`, `loanTermYears`) and the existing calculation engine (which requires `LoanDetails` objects with `interestRatePeriods` arrays and complex configuration).

**Primary recommendation:** Use a dual-schema approach—JSON Schema for WebMCP tool registration (declarative, consumed by browser API) and Zod schema for runtime validation (imperative, provides type safety and detailed error messages). Convert simple tool inputs to LoanDetails format, leverage existing validation patterns, and return raw numeric values with full amortization schedules as specified in CONTEXT.md.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Response Format:**
- Full amortization schedule included — LLM decides how to present it to users
- Raw numeric values only (no formatted strings like "$1,703.37")
- Use same structure as existing calculation engine output
- Metadata (currency, repayment model, timestamp) at Claude's discretion

**Error Responses:**
- Return first validation error only (not all errors at once)
- Error message without hints (agent figures out correction)
- Include field path for programmatic handling: `{field: "principal", message: "..."}`
- Use existing error code patterns from codebase

**Input Flexibility:**
- Interest rate as percentage only (6.5 means 6.5%, matches UI)
- Defaults provided: currency = "USD", repaymentModel = "equalInstallments"
- No overpayment field — basic calculation only (overpayment tool is future phase)
- Type coercion strictness at Claude's discretion (follow WebMCP patterns)

**Natural Language Output:**
- No natural language summary — return data only
- Agent generates its own user-facing summary from raw data

### Claude's Discretion

- Whether to include calculation metadata (timestamp, inputs echo)
- Type coercion behavior for string-to-number
- Amortization schedule organization details

### Deferred Ideas (OUT OF SCOPE)

- Overpayment calculation — Future phase (Phase 6 in roadmap)
- Multiple scenarios comparison — Future phase

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FR-2 | Basic Calculation Tool - Accept loan parameters and return calculation results | JSON Schema for inputSchema, Zod validation for runtime safety, existing calculationEngine provides calculation logic |
| FR-3 | Input Validation - Validate inputs and return descriptive errors | Zod provides validation with custom error messages, existing validation.ts provides error patterns, user requires first-error-only format |
| FR-5 | Integration with Existing Calculator - Use existing calculationEngine | calculationEngine.calculateLoanDetails() accepts LoanDetails, mapper needed to convert simple inputs → complex LoanDetails format |

</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Zod | 3.24.3 (installed) | Runtime validation and type inference | TypeScript-first validation library, already in project, excellent error handling, type-safe with `z.infer<>` |
| zod-validation-error | 3.4.0 (installed) | User-friendly error messages | Wraps Zod errors in readable messages, already in project dependencies |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| JSON Schema (native) | Draft 2020-12 | WebMCP inputSchema definition | Required for WebMCP tool registration via `navigator.modelContext.registerTool()` |
| zod-to-json-schema | Consider if needed | Convert Zod to JSON Schema | Optional - can hand-write JSON Schema or generate from Zod schema, evaluate if DRY principle worth the dependency |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zod | Ajv + JSON Schema | Ajv is faster but requires separate TypeScript types, Zod provides type inference and better DX |
| Hand-written JSON Schema | zod-to-json-schema | Library adds dependency but reduces duplication, can hand-write for Phase 2 since schema is simple |
| Custom validation | Existing validation.ts functions | Existing functions throw errors (not ideal for tool responses), Zod provides structured error objects |

**Installation:**
```bash
# Already installed in project
# zod@3.24.3
# zod-validation-error@3.4.0

# Optional: Only if we decide to auto-generate JSON Schema from Zod
npm install zod-to-json-schema
```

## Architecture Patterns

### Recommended File Structure
```
client/src/lib/webmcp/tools/
├── calculate.ts           # calculateMortgage tool implementation
│   ├── inputSchema        # JSON Schema for WebMCP registration
│   ├── zodSchema          # Zod schema for runtime validation
│   ├── mapInputToLoanDetails()  # Transform simple input → LoanDetails
│   ├── formatResponse()   # Transform CalculationResults → tool output
│   └── execute()          # Main tool execution function
└── index.ts               # Export all tools
```

### Pattern 1: Dual-Schema Validation (JSON Schema + Zod)

**What:** Define both JSON Schema (for WebMCP API) and Zod schema (for runtime validation) for the same input

**When to use:** When implementing WebMCP tools that require both declarative schema (browser API) and runtime validation (type safety)

**Example:**
```typescript
// JSON Schema for WebMCP registration
export const inputSchema: JSONSchema = {
  type: 'object',
  properties: {
    principal: {
      type: 'number',
      description: 'Loan amount (e.g., 300000)',
      minimum: 0.01
    },
    annualInterestRate: {
      type: 'number',
      description: 'Annual interest rate as percentage (e.g., 6.5 for 6.5%)',
      minimum: 0,
      maximum: 100
    },
    loanTermYears: {
      type: 'number',
      description: 'Loan term in years (e.g., 30)',
      minimum: 1,
      maximum: 50
    },
    currency: {
      type: 'string',
      description: 'Currency code (default: USD)',
      enum: ['USD', 'EUR', 'GBP', 'PLN']
    },
    repaymentModel: {
      type: 'string',
      description: 'Repayment model',
      enum: ['equalInstallments', 'decreasingInstallments']
    }
  },
  required: ['principal', 'annualInterestRate', 'loanTermYears']
};

// Zod schema for runtime validation
const CalculateMortgageInputSchema = z.object({
  principal: z.number().positive('Principal must be greater than 0'),
  annualInterestRate: z.number()
    .min(0, 'Interest rate cannot be negative')
    .max(100, 'Interest rate cannot exceed 100%'),
  loanTermYears: z.number()
    .min(1, 'Loan term must be at least 1 year')
    .max(50, 'Loan term cannot exceed 50 years'),
  currency: z.string().default('USD'),
  repaymentModel: z.enum(['equalInstallments', 'decreasingInstallments'])
    .default('equalInstallments')
});

// Type inference from Zod
type CalculateMortgageInput = z.infer<typeof CalculateMortgageInputSchema>;
```

**Rationale:** WebMCP requires JSON Schema for tool registration, but Zod provides superior runtime validation, custom error messages, and TypeScript type inference. The schemas are simple enough that duplication is manageable.

### Pattern 2: Input Transformation (Simple → Complex)

**What:** Transform simple WebMCP tool inputs into complex LoanDetails format required by existing calculation engine

**When to use:** When bridging external API (simple inputs) with internal logic (complex domain objects)

**Example:**
```typescript
function mapInputToLoanDetails(input: CalculateMortgageInput): LoanDetails {
  return {
    principal: input.principal,
    interestRatePeriods: [{
      startMonth: 1,
      interestRate: input.annualInterestRate
    }],
    loanTerm: input.loanTermYears,
    overpaymentPlans: [], // Empty - overpayment is future phase
    startDate: new Date(),
    name: 'WebMCP Calculation',
    currency: input.currency,
    repaymentModel: input.repaymentModel
  };
}
```

**Rationale:** Existing calculationEngine expects `LoanDetails` with `interestRatePeriods` array (supports variable rates), but WebMCP tool accepts single `annualInterestRate` (simpler for agents). Mapper creates the required structure.

### Pattern 3: First-Error-Only Validation Response

**What:** Return only the first validation error with field path, not all errors at once

**When to use:** User decision from CONTEXT.md - helps AI agents focus on correcting one issue at a time

**Example:**
```typescript
async function execute(args: unknown): Promise<ToolResponse> {
  // Validate with Zod
  const validation = CalculateMortgageInputSchema.safeParse(args);

  if (!validation.success) {
    const firstError = validation.error.issues[0];
    return {
      content: [{
        type: 'error',
        text: JSON.stringify({
          field: firstError.path.join('.'),
          message: firstError.message
        })
      }],
      error: 'VALIDATION_ERROR',
      code: 'VALIDATION_ERROR'
    };
  }

  // Continue with calculation...
}
```

**Rationale:** User constraint requires "first validation error only" with field path. Zod's `issues` array provides all errors; we extract first one and format per requirements.

### Pattern 4: Raw Numeric Response Format

**What:** Return calculation results as raw numbers, not formatted currency strings

**When to use:** User decision from CONTEXT.md - AI agent handles presentation formatting

**Example:**
```typescript
function formatResponse(results: CalculationResults, input: CalculateMortgageInput): ToolResponse {
  // User constraint: Raw numeric values only
  const response = {
    monthlyPayment: results.monthlyPayment, // 1703.37, not "$1,703.37"
    totalInterest: results.totalInterest,
    totalCost: results.totalCost || 0,
    termMonths: Math.round(results.actualTerm * 12),

    // Full amortization schedule (user constraint)
    amortizationSchedule: results.amortizationSchedule.map(payment => ({
      month: payment.payment,
      principalPayment: payment.principalPayment,
      interestPayment: payment.interestPayment,
      remainingBalance: payment.balance,
      totalPrincipalPaid: payment.principalPayment, // Can calculate cumulative if needed
      totalInterestPaid: payment.totalInterest
    })),

    // Metadata (Claude's discretion - including for transparency)
    metadata: {
      currency: input.currency,
      repaymentModel: input.repaymentModel,
      calculatedAt: new Date().toISOString()
    }
  };

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(response)
    }]
  };
}
```

**Rationale:** User constraint: "Raw numeric values only (no formatted strings like '$1,703.37')". Agent decides how to present to user. Full amortization schedule included per requirements.

### Anti-Patterns to Avoid

- **Don't use formatted currency strings in response:** User constraint forbids formatted values. Return raw numbers.
- **Don't return all validation errors:** User constraint requires first error only with field path.
- **Don't add natural language summary:** User constraint: "No natural language summary — return data only".
- **Don't validate with throwing functions:** Existing `validateInputs()` throws errors. Use Zod's `safeParse()` which returns result object.
- **Don't skip type coercion:** WebMCP may pass string numbers. Consider using `z.coerce.number()` or explicit coercion based on WebMCP behavior testing.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Input validation | Custom validator classes | Zod with safeParse | Zod provides type inference, structured errors, custom messages, and handles edge cases (NaN, Infinity, type coercion) |
| Error formatting | Custom error message builder | zod-validation-error (already installed) | Handles internationalization, consistent formatting, already in dependencies |
| JSON Schema generation | Manual JSON Schema writing | Consider zod-to-json-schema | Reduces duplication, single source of truth (though manual is acceptable for simple Phase 2 schema) |
| Type coercion | Manual parseFloat/parseInt | Zod's z.coerce.number() or z.preprocess() | Handles edge cases (empty strings, null, undefined) consistently |

**Key insight:** Validation is deceptively complex. Edge cases include NaN from invalid strings, Infinity from division, negative zero, type mismatches, and locale-specific number formats. Zod handles these consistently. The existing `validation.ts` uses throwing functions which don't map well to tool responses—Zod's `safeParse()` is better for non-throwing validation.

## Common Pitfalls

### Pitfall 1: Type Coercion Assumptions

**What goes wrong:** WebMCP may pass numeric values as strings (e.g., `"300000"` instead of `300000`), causing validation to fail even though semantically correct.

**Why it happens:** JSON serialization/deserialization between browser API and tool, or AI agent providing string literals.

**How to avoid:** Use Zod's `z.coerce.number()` which safely converts strings to numbers:
```typescript
principal: z.coerce.number().positive() // Accepts "300000" and converts to 300000
```

**Warning signs:** Tool works in unit tests (passing numbers) but fails when invoked by real AI agents (passing strings).

### Pitfall 2: Amortization Schedule Size

**What goes wrong:** Returning full amortization schedule for 30-year loan means 360 payment objects in JSON response, potentially exceeding reasonable response sizes or LLM context windows.

**Why it happens:** User constraint requires "full amortization schedule included".

**How to avoid:** User decision is "full schedule" so return it, but be aware of size. Consider testing with 30-year term. If problematic, discuss with user whether to summarize (e.g., monthly for first year, then yearly).

**Warning signs:** Large JSON payloads, slow serialization, browser memory issues.

### Pitfall 3: LoanDetails Mapping Errors

**What goes wrong:** `calculationEngine.calculateLoanDetails()` expects complex `LoanDetails` with multiple `interestRatePeriods`, but simple tool input provides single `annualInterestRate`.

**Why it happens:** Mismatch between WebMCP tool's simple API and existing engine's complex domain model.

**How to avoid:** Create proper mapper function that converts single interest rate to `interestRatePeriods` array with one entry:
```typescript
interestRatePeriods: [{
  startMonth: 1,
  interestRate: input.annualInterestRate
}]
```

**Warning signs:** TypeScript errors when calling `calculateLoanDetails()`, runtime errors about missing required fields.

### Pitfall 4: Error Response Format Mismatch

**What goes wrong:** Returning errors in wrong format for WebMCP ToolResponse (e.g., throwing exceptions instead of returning error content).

**Why it happens:** Existing validation functions throw errors, but WebMCP tools should return ToolResponse with error content.

**How to avoid:** Use Zod's `safeParse()` which never throws:
```typescript
const validation = schema.safeParse(args);
if (!validation.success) {
  return {
    content: [{ type: 'error', text: JSON.stringify(...) }],
    error: 'VALIDATION_ERROR'
  };
}
```

**Warning signs:** Tool crashes instead of returning error responses, AI agents can't handle errors gracefully.

### Pitfall 5: Metadata Overload

**What goes wrong:** Including too much metadata (echoing all inputs, calculation timestamps, debug info) bloats response and adds noise.

**Why it happens:** "Claude's discretion" on metadata encourages adding "helpful" information.

**How to avoid:** Keep metadata minimal and purposeful. Include only: currency (for interpretation), repaymentModel (affects calculation), timestamp (for caching/freshness). Don't echo all inputs (agent already has them).

**Warning signs:** Response size significantly larger than calculation data itself.

## Code Examples

Verified patterns for implementation:

### Zod Validation with Custom Error Messages

```typescript
// Source: Zod documentation - Error Customization
// https://zod.dev/error-customization

const CalculateMortgageInputSchema = z.object({
  principal: z.number({
    required_error: 'Principal is required',
    invalid_type_error: 'Principal must be a number'
  }).positive('Principal must be greater than 0'),

  annualInterestRate: z.number({
    required_error: 'Interest rate is required',
    invalid_type_error: 'Interest rate must be a number'
  })
  .min(0, 'Interest rate cannot be negative')
  .max(100, 'Interest rate cannot exceed 100%'),

  loanTermYears: z.number({
    required_error: 'Loan term is required',
    invalid_type_error: 'Loan term must be a number'
  })
  .min(1, 'Loan term must be at least 1 year')
  .max(50, 'Loan term cannot exceed 50 years'),

  currency: z.string().default('USD'),

  repaymentModel: z.enum(['equalInstallments', 'decreasingInstallments'])
    .default('equalInstallments')
});
```

### Safe Validation with First Error Extraction

```typescript
// Source: Zod documentation - SafeParse
// https://zod.dev/api

async function execute(args: unknown): Promise<ToolResponse> {
  // Never throws - returns success/error object
  const validation = CalculateMortgageInputSchema.safeParse(args);

  if (!validation.success) {
    // User constraint: Return first error only with field path
    const firstError = validation.error.issues[0];

    return {
      content: [{
        type: 'error',
        text: JSON.stringify({
          field: firstError.path.join('.') || 'input',
          message: firstError.message
        })
      }],
      error: 'VALIDATION_ERROR',
      code: 'VALIDATION_ERROR'
    };
  }

  // validation.data is now type-safe CalculateMortgageInput
  const input = validation.data;

  // Continue with calculation...
}
```

### Calling Existing Calculation Engine

```typescript
// Source: Existing codebase - calculationEngine.ts
// C:\Work\MortgageCalculator\client\src\lib\calculationEngine.ts

import { calculateLoanDetails } from '@/lib/calculationEngine';
import type { LoanDetails, CalculationResults } from '@/lib/types';

function mapInputToLoanDetails(input: CalculateMortgageInput): LoanDetails {
  return {
    principal: input.principal,
    interestRatePeriods: [{
      startMonth: 1,
      interestRate: input.annualInterestRate
    }],
    loanTerm: input.loanTermYears,
    overpaymentPlans: [], // User constraint: No overpayment in Phase 2
    startDate: new Date(),
    name: 'WebMCP Calculation',
    currency: input.currency,
    repaymentModel: input.repaymentModel
  };
}

// Execute calculation
const loanDetails = mapInputToLoanDetails(input);
const results: CalculationResults = calculateLoanDetails({
  principal: loanDetails.principal,
  interestRatePeriods: loanDetails.interestRatePeriods,
  loanTerm: loanDetails.loanTerm,
  repaymentModel: loanDetails.repaymentModel,
  overpaymentPlans: loanDetails.overpaymentPlans,
  startDate: loanDetails.startDate
});
```

### JSON Schema Number Validation

```typescript
// Source: JSON Schema specification
// https://json-schema.org/understanding-json-schema/reference/numeric

export const inputSchema: JSONSchema = {
  type: 'object',
  properties: {
    principal: {
      type: 'number',
      description: 'Loan principal amount in base currency units',
      minimum: 0.01, // Inclusive minimum
      exclusiveMaximum: 1000000000 // Exclusive maximum (if needed)
    },
    annualInterestRate: {
      type: 'number',
      description: 'Annual interest rate as percentage (6.5 means 6.5%)',
      minimum: 0,
      maximum: 100 // Inclusive
    },
    loanTermYears: {
      type: 'number',
      description: 'Loan term in years',
      minimum: 1,
      maximum: 50
    }
  },
  required: ['principal', 'annualInterestRate', 'loanTermYears']
};
```

### Response Formatting (Raw Numbers)

```typescript
// User constraint: Raw numeric values only, full amortization schedule

function formatResponse(
  results: CalculationResults,
  input: CalculateMortgageInput
): ToolResponse {
  const response = {
    // Summary (raw numbers per user constraint)
    monthlyPayment: results.monthlyPayment,
    totalInterest: results.totalInterest,
    totalCost: results.totalCost || (results.principal + results.totalInterest),
    termMonths: Math.round(results.actualTerm * 12),

    // Full amortization schedule (user constraint)
    amortizationSchedule: results.amortizationSchedule.map(payment => ({
      month: payment.payment,
      principalPayment: payment.principalPayment,
      interestPayment: payment.interestPayment,
      remainingBalance: payment.balance,
      totalInterestPaid: payment.totalInterest
    })),

    // Metadata (Claude's discretion)
    metadata: {
      currency: input.currency,
      repaymentModel: input.repaymentModel,
      calculatedAt: new Date().toISOString()
    }
  };

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(response)
    }]
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JSON Schema + separate TypeScript types | Zod with type inference | Zod 1.0+ (2020) | Single source of truth, types inferred from validation schema |
| Throwing validation errors | safeParse() non-throwing | Zod 3.0+ | Better for API boundaries, structured error handling |
| Manual JSON Schema writing | zod-to-json-schema generation | Zod 4.0+ native support (2025) | DRY principle, but adds complexity for simple schemas |
| Separate validation libraries | Unified Zod ecosystem | Zod 3.0+ ecosystem growth | Consistent patterns, better TypeScript integration |

**Deprecated/outdated:**
- **io-ts:** TypeScript runtime validation library. Still works but Zod has better DX and ecosystem support as of 2024+.
- **joi:** JavaScript validation library. Less TypeScript-native than Zod, requires separate type definitions.
- **Manual type guards:** Writing custom `is` functions. Zod provides automatic type narrowing.

## Open Questions

1. **Should we use zod-to-json-schema to generate JSON Schema from Zod schema?**
   - What we know: Phase 2 schema is simple (5 fields), Zod 4+ has native `z.toJSONSchema()`, zod-to-json-schema package is in maintenance mode (Zod 4 recommended)
   - What's unclear: Whether the DRY benefit outweighs the complexity for a simple schema
   - Recommendation: Hand-write JSON Schema for Phase 2 (simple, explicit). Revisit if we add more tools with complex schemas.

2. **What type coercion behavior should we use?**
   - What we know: User says "Claude's discretion", WebMCP may pass string numbers, Zod offers `z.coerce.number()`
   - What's unclear: Does WebMCP API preserve number types or serialize to JSON strings?
   - Recommendation: Use `z.coerce.number()` to be defensive. Test with real agent invocations and adjust if coercion causes issues.

3. **Should we include yearly aggregated data in response?**
   - What we know: `CalculationResults` includes `yearlyData`, user constraint says "full amortization schedule"
   - What's unclear: Whether "full schedule" means payment-by-payment only or also yearly summaries
   - Recommendation: Include yearly aggregated data as additional field. Agent can ignore if not needed, but provides useful summary view.

4. **How to handle calculation edge cases (0% interest, very large principals)?**
   - What we know: Existing calculationEngine handles these, JSON Schema defines ranges
   - What's unclear: Whether WebMCP tools should have tighter business-logic validation
   - Recommendation: Use JSON Schema ranges as guardrails (0-100% rate, 1-50 year term). Let calculationEngine handle mathematical edge cases (will return valid calculations or 0s).

## Sources

### Primary (HIGH confidence)

- **Zod Official Documentation** - Error Customization: [https://zod.dev/error-customization](https://zod.dev/error-customization)
- **Zod Official Documentation** - Error Formatting: [https://zod.dev/error-formatting](https://zod.dev/error-formatting)
- **Zod Official Documentation** - JSON Schema Support: [https://zod.dev/json-schema](https://zod.dev/json-schema)
- **JSON Schema Official Specification** - Numeric Types: [https://json-schema.org/understanding-json-schema/reference/numeric](https://json-schema.org/understanding-json-schema/reference/numeric)
- **Existing Codebase** - calculationEngine.ts: Verified calculation logic and type interfaces
- **Existing Codebase** - validation.ts: Verified error patterns and validation rules
- **Existing Codebase** - formatters.ts: Verified currency and time formatting utilities
- **Project Dependencies** - package.json: Confirmed Zod 3.24.3 and zod-validation-error 3.4.0 installed

### Secondary (MEDIUM confidence)

- **Steve Kinney** - Best Practices with Zod: [https://stevekinney.com/courses/full-stack-typescript/zod-best-practices](https://stevekinney.com/courses/full-stack-typescript/zod-best-practices)
- **OneUpTime Blog** - How to Validate Data with Zod in TypeScript (2026): [https://oneuptime.com/blog/post/2026-01-25-zod-validation-typescript/view](https://oneuptime.com/blog/post/2026-01-25-zod-validation-typescript/view)
- **WebMCP Error Handling** - MCP Tools Error Patterns: [https://apxml.com/courses/getting-started-model-context-protocol/chapter-3-implementing-tools-and-logic/error-handling-reporting](https://apxml.com/courses/getting-started-model-context-protocol/chapter-3-implementing-tools-and-logic/error-handling-reporting)
- **MCPcat Guide** - Error Handling in MCP Servers: [https://mcpcat.io/guides/error-handling-custom-mcp-servers/](https://mcpcat.io/guides/error-handling-custom-mcp-servers/)

### Tertiary (LOW confidence)

- **Visby Blog** - What is Google WebMCP? (2026): [https://visby.ai/blogs/what-is-google-webmcp-ai-agent-web-standard-2026](https://visby.ai/blogs/what-is-google-webmcp-ai-agent-web-standard-2026) - General overview, not implementation details
- **Medium** - WebMCP: Your AI, Every Website (2026): [https://medium.com/@vinesheg/webmcp-your-ai-every-website-the-webs-new-power-shift-97ad7c60c716](https://medium.com/@vinesheg/webmcp-your-ai-every-website-the-webs-new-power-shift-97ad7c60c716) - Conceptual overview

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Zod and existing codebase verified, patterns well-documented
- Architecture patterns: HIGH - Dual-schema approach is standard, existing code provides clear integration points
- Input/output formats: HIGH - User constraints clearly defined in CONTEXT.md, requirements document specific
- Pitfalls: MEDIUM - Based on common Zod patterns and WebMCP documentation, need real-world testing to confirm type coercion behavior

**Research date:** 2026-02-17
**Valid until:** 60 days (Zod stable, WebMCP early preview but API unlikely to change fundamentally)
