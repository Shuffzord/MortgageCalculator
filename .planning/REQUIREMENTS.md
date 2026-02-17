# Requirements: WebMCP Integration

**Version:** 1.0
**Created:** 2026-02-17
**Status:** Active

---

## Overview

Integrate WebMCP into the mortgage calculator to allow AI agents to programmatically calculate mortgages through the browser-native `navigator.modelContext` API.

**Success Criteria:** An AI agent can call the `calculateMortgage` tool from a browser with Chrome 146+ and receive structured calculation results.

---

## Functional Requirements

### FR-1: WebMCP Tool Registration

**Priority:** Must Have

The application MUST register a `calculateMortgage` tool via `navigator.modelContext.registerTool()` when the page loads.

**Acceptance Criteria:**
- [ ] Tool appears in Model Context Tool Inspector extension
- [ ] Tool has name `calculateMortgage`
- [ ] Tool has descriptive description explaining what it does
- [ ] Tool has valid JSON Schema for inputSchema
- [ ] Tool has `readOnlyHint: "true"` annotation

---

### FR-2: Basic Calculation Tool

**Priority:** Must Have

The `calculateMortgage` tool MUST accept loan parameters and return calculation results.

**Input Schema:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `principal` | number | Yes | Loan amount (e.g., 300000) |
| `annualInterestRate` | number | Yes | Annual rate as percentage (e.g., 6.5) |
| `loanTermYears` | number | Yes | Term in years (e.g., 30) |
| `currency` | string | No | Currency code (default: "USD") |
| `repaymentModel` | string | No | "equalInstallments" or "decreasingInstallments" |

**Output Format:**
```json
{
  "summary": {
    "monthlyPayment": "$1,703.37",
    "totalInterest": "$313,212.24",
    "totalCost": "$613,212.24",
    "termLength": "30 years"
  },
  "details": {
    "monthlyPaymentRaw": 1703.37,
    "totalInterestRaw": 313212.24,
    "termMonths": 360
  },
  "yearlyBreakdown": [
    { "year": 1, "principalPaid": "$4,840", "interestPaid": "$15,600", ... }
  ],
  "naturalLanguageSummary": "For this 30 year mortgage..."
}
```

**Acceptance Criteria:**
- [ ] Execute callback receives input parameters
- [ ] Returns structured JSON in `{ content: [{ type: "text", text: "..." }] }` format
- [ ] Monthly payment calculation matches existing calculator UI
- [ ] Yearly breakdown included (not full 360-payment schedule)
- [ ] Natural language summary included for agent use

---

### FR-3: Input Validation

**Priority:** Must Have

The tool MUST validate inputs and return descriptive errors.

**Validation Rules:**
| Field | Rule | Error Message |
|-------|------|---------------|
| `principal` | > 0 | "Principal must be a positive number" |
| `annualInterestRate` | >= 0 and <= 100 | "Interest rate must be between 0 and 100" |
| `loanTermYears` | > 0 and <= 50 | "Loan term must be between 1 and 50 years" |

**Error Response Format:**
```json
{
  "error": true,
  "code": "VALIDATION_ERROR",
  "message": "Invalid input parameters",
  "details": { "errors": ["Principal must be a positive number"] }
}
```

**Acceptance Criteria:**
- [ ] Invalid inputs return error response (not throw)
- [ ] Error messages are descriptive enough for agent self-correction
- [ ] All validation errors returned at once (not one at a time)

---

### FR-4: Feature Detection

**Priority:** Must Have

The application MUST gracefully handle browsers without WebMCP support.

**Acceptance Criteria:**
- [ ] Check `'modelContext' in navigator` before registration
- [ ] No errors thrown if WebMCP unavailable
- [ ] Existing calculator functionality unaffected
- [ ] DEV mode logs warning when WebMCP unavailable

---

### FR-5: Integration with Existing Calculator

**Priority:** Must Have

The tool MUST use the existing `calculationEngine` for calculations.

**Acceptance Criteria:**
- [ ] Maps agent input to `LoanDetails` type
- [ ] Calls `calculateLoanDetails()` from calculationEngine
- [ ] Results match what UI calculator produces for same inputs
- [ ] Uses existing `formatCurrency()` for formatted values

---

## Non-Functional Requirements

### NFR-1: Invisible Operation

**Priority:** Must Have

Tool execution MUST NOT cause visible UI changes.

**Acceptance Criteria:**
- [ ] No loading spinners or indicators
- [ ] No form fields populated
- [ ] No navigation or state changes
- [ ] Console logging only in DEV mode

---

### NFR-2: TypeScript

**Priority:** Must Have

All WebMCP code MUST be TypeScript with strict typing.

**Acceptance Criteria:**
- [ ] Custom type declarations for `navigator.modelContext`
- [ ] Typed tool definitions
- [ ] No `any` types except where unavoidable (API boundaries)

---

### NFR-3: Code Organization

**Priority:** Should Have

WebMCP code MUST follow project conventions.

**File Structure:**
```
client/src/lib/webmcp/
  types.ts           # TypeScript interfaces
  tools/
    calculate.ts     # calculateMortgage tool
    index.ts         # Export all tools
  register.ts        # Registration logic
  index.ts           # Main exports
```

---

### NFR-4: Testability

**Priority:** Should Have

WebMCP integration MUST be testable.

**Acceptance Criteria:**
- [ ] Mock for `navigator.modelContext` in Jest
- [ ] Unit tests for tool execute logic
- [ ] Unit tests for input validation
- [ ] Manual testing checklist documented

---

## Out of Scope (v1)

- Advanced tools (overpayment, comparison, optimization)
- Declarative form-based tools
- UI indicators for agent activity
- E2E Puppeteer tests (defer to future)
- Multiple tool registration (just `calculateMortgage` for v1)

---

## Dependencies

| Dependency | Purpose | Status |
|------------|---------|--------|
| Chrome 146+ | WebMCP API | External |
| `chrome://flags/#enable-webmcp-testing` | Enable flag | External |
| calculationEngine.ts | Calculation logic | Existing |
| types.ts | LoanDetails, CalculationResults | Existing |
| Zod | Input validation | Existing |

---

## Verification

### Manual Testing
1. Open app in Chrome 146+ with WebMCP flag enabled
2. Open Model Context Tool Inspector extension
3. Verify `calculateMortgage` tool appears
4. Execute tool with valid parameters
5. Verify results match UI calculator

### Unit Tests
- Tool registration logic
- Execute callback with valid inputs
- Execute callback with invalid inputs
- Feature detection

---

*Requirements finalized: 2026-02-17*
