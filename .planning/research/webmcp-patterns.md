# WebMCP Implementation Patterns Research

**Researched:** 2026-02-17
**Source:** WebMCP Early Preview (Chrome 146, updated Feb 10, 2026)
**Confidence:** HIGH (based on official Chrome documentation)

---

## Executive Summary

WebMCP is a proposed web standard that exposes structured tools from web pages to AI agents via `navigator.modelContext`. It replaces screen-scraping with robust, type-safe page interaction. The API provides both imperative (JavaScript) and declarative (HTML form annotation) approaches.

For the mortgage calculator integration, the **imperative API** is the correct choice because:
1. We have complex calculation logic already in TypeScript
2. We need structured JSON responses (not form submissions)
3. We want invisible operation (no form UI indicators)

---

## API Reference

### Entry Point

```typescript
window.navigator.modelContext
```

**Availability:** Chrome 146+ with `chrome://flags/#enable-webmcp-testing` enabled. HTTPS required.

### Core Methods

| Method | Purpose | Use When |
|--------|---------|----------|
| `registerTool(tool)` | Add a single tool | Adding tools incrementally |
| `unregisterTool(name)` | Remove a tool by name | Tool no longer applicable |
| `provideContext({ tools })` | Replace ALL tools at once | State change requires complete reset |
| `clearContext()` | Remove all tools | Page cleanup / teardown |

---

## Tool Definition Structure

```typescript
interface ModelContextTool {
  name: string;                    // Unique identifier (e.g., "calculateMortgage")
  description: string;             // What it does (agents use this to decide when to call)
  inputSchema: JSONSchema;         // JSON Schema defining parameters
  annotations?: ToolAnnotations;   // Hints for agent behavior
  execute: (args: object) => ToolResult;  // The actual function
}

interface ToolAnnotations {
  readOnlyHint?: "true" | "false";  // Does this tool modify state?
  // Additional annotations may be added in future spec versions
}

interface ToolResult {
  content: ContentBlock[];
}

interface ContentBlock {
  type: "text";          // Currently only "text" type documented
  text: string;          // The actual response content
}
```

---

## Execute Callback Patterns

### Basic Pattern

```typescript
execute: ({ param1, param2 }) => {
  // Perform operation
  const result = doSomething(param1, param2);

  // Return structured content
  return {
    content: [
      { type: "text", text: `Result: ${result}` }
    ]
  };
}
```

### With Structured Data (JSON in text)

```typescript
execute: ({ principal, rate, term }) => {
  const result = calculateMortgage(principal, rate, term);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          monthlyPayment: result.monthlyPayment,
          totalInterest: result.totalInterest,
          totalPayment: result.totalPayment
        })
      }
    ]
  };
}
```

### With Error Handling

```typescript
execute: (args) => {
  // Validate inputs (schema is not guaranteed to be enforced)
  if (!args.principal || args.principal <= 0) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: true,
            code: "INVALID_PRINCIPAL",
            message: "Principal must be a positive number"
          })
        }
      ]
    };
  }

  try {
    const result = doCalculation(args);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: true,
            code: "CALCULATION_ERROR",
            message: error.message
          })
        }
      ]
    };
  }
}
```

---

## Input Schema Patterns

### Basic Types

```typescript
inputSchema: {
  type: "object",
  properties: {
    text: { type: "string" },
    count: { type: "number" },
    enabled: { type: "boolean" }
  }
}
```

### With Required Fields

```typescript
inputSchema: {
  type: "object",
  properties: {
    principal: { type: "number" },
    interestRate: { type: "number" },
    loanTermYears: { type: "number" }
  },
  required: ["principal", "interestRate", "loanTermYears"]
}
```

### With Descriptions (helps agents understand parameters)

```typescript
inputSchema: {
  type: "object",
  properties: {
    principal: {
      type: "number",
      description: "Loan amount in dollars (e.g., 250000 for $250,000)"
    },
    interestRate: {
      type: "number",
      description: "Annual interest rate as percentage (e.g., 6.5 for 6.5%)"
    },
    loanTermYears: {
      type: "number",
      description: "Loan term in years (e.g., 30 for a 30-year mortgage)"
    }
  },
  required: ["principal", "interestRate", "loanTermYears"]
}
```

### With Enums (constrained choices)

```typescript
inputSchema: {
  type: "object",
  properties: {
    repaymentModel: {
      type: "string",
      enum: ["equalInstallments", "decreasingInstallments"],
      description: "Repayment model: 'equalInstallments' (fixed monthly payment) or 'decreasingInstallments' (decreasing monthly payment)"
    }
  }
}
```

### With Nested Objects

```typescript
inputSchema: {
  type: "object",
  properties: {
    loanDetails: {
      type: "object",
      properties: {
        principal: { type: "number" },
        term: { type: "number" }
      }
    },
    options: {
      type: "object",
      properties: {
        currency: { type: "string" },
        locale: { type: "string" }
      }
    }
  }
}
```

---

## Error Handling Patterns

### Principle: Validate Strictly in Code, Loosely in Schema

The documentation explicitly states:
> "While schema constraints are helpful, they are not guaranteed. Validate constraints within your function code and return **descriptive errors**."

### Error Response Pattern

```typescript
// Consistent error structure enables agent self-correction
interface ErrorResponse {
  error: true;
  code: string;           // Machine-readable code for categorization
  message: string;        // Human/agent-readable explanation
  details?: object;       // Optional additional context
}

// Success response pattern
interface SuccessResponse {
  error?: false;          // Optional, absence implies success
  // ... actual result data
}
```

### Validation-First Pattern

```typescript
execute: (args) => {
  // 1. Validate all required fields
  const errors: string[] = [];

  if (args.principal === undefined || args.principal === null) {
    errors.push("principal is required");
  } else if (typeof args.principal !== "number" || args.principal <= 0) {
    errors.push("principal must be a positive number");
  }

  if (args.interestRate === undefined || args.interestRate === null) {
    errors.push("interestRate is required");
  } else if (typeof args.interestRate !== "number" || args.interestRate < 0 || args.interestRate > 100) {
    errors.push("interestRate must be between 0 and 100");
  }

  // 2. Return all errors at once (helps agent fix in single retry)
  if (errors.length > 0) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          error: true,
          code: "VALIDATION_ERROR",
          message: "Invalid input parameters",
          details: { errors }
        })
      }]
    };
  }

  // 3. Proceed with valid inputs
  try {
    const result = calculate(args);
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  } catch (e) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          error: true,
          code: "CALCULATION_ERROR",
          message: e.message
        })
      }]
    };
  }
}
```

---

## Best Practices from Documentation

### 1. Naming and Semantics

**Distinguish execution from initiation:**
- Use `calculate_mortgage` for immediate calculation
- Use `start_mortgage_wizard` if it opens a UI form

**Positive, clear descriptions:**
- GOOD: "Calculates monthly payment, total interest, and amortization schedule for a fixed-rate mortgage"
- BAD: "Don't use for variable rate mortgages"

### 2. Schema Design

**Accept raw user input:**
- Accept `interestRate: 6.5` not `interestRate: 0.065`
- Accept date strings like `"2026-01-15"` not milliseconds since epoch

**Explicit types with business logic:**
- GOOD: `"repaymentModel": { "enum": ["equalInstallments", "decreasingInstallments"], "description": "Use 'equalInstallments' for fixed monthly payments, 'decreasingInstallments' when you want payments to decrease over time" }`

### 3. Return After UI Update

> "Agents might use UI state to verify function execution and plan next steps. Ensure the function returns *after* UI updates for consistency."

For mortgage calculator: Since we want invisible operation, this is less critical, but if we update any displayed results, ensure the execute callback waits for React state updates.

### 4. Atomic and Composable Tools

**Avoid overlapping tools:**
- BAD: `calculateMortgage`, `calculateMortgageWithOverpayments`, `calculateMortgageWithVariableRate`
- GOOD: Single `calculateMortgage` with optional `overpayments` and `variableRates` parameters

### 5. Trust Agent Flow Control

- Don't add instructions like "Call this before calling X"
- Let agents compose tools based on their understanding

---

## Annotations

### readOnlyHint

```typescript
annotations: {
  readOnlyHint: "true"  // This tool does not modify application state
}
```

For mortgage calculator: All calculation tools should have `readOnlyHint: "true"` since they compute values without side effects.

---

## Registration Patterns

### Single Tool Registration

```typescript
// For adding one tool without affecting others
navigator.modelContext.registerTool({
  name: "calculateMortgage",
  description: "...",
  inputSchema: { ... },
  execute: (args) => { ... }
});
```

### Batch Registration with provideContext

```typescript
// Replaces ALL tools - use when state changes require tool reset
navigator.modelContext.provideContext({
  tools: [
    { name: "tool1", description: "...", inputSchema: {}, execute: () => {} },
    { name: "tool2", description: "...", inputSchema: {}, execute: () => {} }
  ]
});
```

### Cleanup

```typescript
// Remove specific tool
navigator.modelContext.unregisterTool("calculateMortgage");

// Remove all tools
navigator.modelContext.clearContext();
```

---

## Feature Detection

```typescript
// Check if WebMCP is available
if ('modelContext' in navigator) {
  // WebMCP supported - register tools
  navigator.modelContext.registerTool({ ... });
} else {
  // WebMCP not available - graceful degradation
  console.warn('WebMCP not available in this browser');
}
```

---

## Limitations and Gotchas

### 1. Browsing Context Required

> "A browsing context (i.e. a browser tab or a webview) must be opened. There is no support for agents or assistive tools to call tools 'headlessly'."

**Implication:** The mortgage calculator page must be open in a tab for agents to use its tools.

### 2. Schema Not Guaranteed

> "While schema constraints are helpful, they are not guaranteed."

**Implication:** Always validate inputs in `execute` function, never rely solely on `inputSchema`.

### 3. No Tool Discovery Mechanism

> "There is no built-in mechanism for client applications to discover which sites provide callable tools without visiting or querying them directly."

**Implication:** Agents must navigate to the mortgage calculator page to discover available tools.

### 4. HTTPS Only

WebMCP requires HTTPS (with possible exception for localhost during development).

### 5. Chrome-Only (Currently)

Early preview is Chrome 146+ only. Other browsers may implement in future.

### 6. Return Type: Only Text Content

Currently, the only documented content type is `{ type: "text", text: "..." }`. For structured data, serialize to JSON string.

---

## Recommended Pattern for Mortgage Calculator

```typescript
// src/lib/webmcp/tools.ts

interface WebMCPTool {
  name: string;
  description: string;
  inputSchema: object;
  annotations?: { readOnlyHint?: string };
  execute: (args: any) => { content: { type: string; text: string }[] };
}

const createMortgageCalculatorTool = (
  calculationService: ICalculationService
): WebMCPTool => ({
  name: "calculateMortgage",
  description: "Calculates monthly payment, total interest, and full amortization schedule for a fixed-rate mortgage. Returns structured JSON with payment breakdown.",
  inputSchema: {
    type: "object",
    properties: {
      principal: {
        type: "number",
        description: "Loan amount in currency units (e.g., 250000 for $250,000)"
      },
      interestRate: {
        type: "number",
        description: "Annual interest rate as percentage (e.g., 6.5 for 6.5%)"
      },
      loanTermYears: {
        type: "number",
        description: "Loan term in years (e.g., 30)"
      },
      repaymentModel: {
        type: "string",
        enum: ["equalInstallments", "decreasingInstallments"],
        description: "Optional. 'equalInstallments' for fixed monthly payment (default), 'decreasingInstallments' for decreasing payments"
      }
    },
    required: ["principal", "interestRate", "loanTermYears"]
  },
  annotations: {
    readOnlyHint: "true"
  },
  execute: (args) => {
    // Validate inputs
    const errors = validateInputs(args);
    if (errors.length > 0) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ error: true, code: "VALIDATION_ERROR", errors })
        }]
      };
    }

    // Build LoanDetails from args
    const loanDetails = buildLoanDetails(args);

    // Calculate using existing service
    const result = calculationService.calculateLoanDetails(loanDetails);

    // Return structured response
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          monthlyPayment: result.monthlyPayment,
          totalInterest: result.totalInterest,
          totalPayment: result.monthlyPayment * result.actualTerm,
          loanTermMonths: result.actualTerm,
          // Optionally include schedule summary (not full schedule - too large)
          firstPayment: result.amortizationSchedule[0],
          lastPayment: result.amortizationSchedule[result.amortizationSchedule.length - 1]
        })
      }]
    };
  }
});
```

---

## Sources

- WebMCP Early Preview Documentation (Chrome, Feb 10, 2026)
- Chrome flags: `chrome://flags/#enable-webmcp-testing`
- Demo: https://googlechromelabs.github.io/webmcp-tools/demos/react-flightsearch/
- GitHub: https://github.com/GoogleChromeLabs/webmcp-tools
- Spec: https://github.com/webmachinelearning/webmcp

---

## Open Questions for Implementation

1. **Response Size Limits:** Documentation doesn't specify. For amortization schedules with 360 payments, should we summarize or paginate?

2. **Async Execute:** Documentation examples show synchronous execute. If calculationService becomes async, does execute support Promise returns?

3. **Multiple Tools vs. Single Tool:** Should we expose one `calculateMortgage` tool with many options, or multiple focused tools (`calculateBasic`, `calculateWithOverpayments`, `compareScenarios`)?

4. **TypeScript Declarations:** No official @types package found. May need to declare `navigator.modelContext` types locally.

---

*Research completed: 2026-02-17*
