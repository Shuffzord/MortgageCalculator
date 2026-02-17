# WebMCP React Integration Research

**Researched:** 2026-02-17
**Confidence:** MEDIUM (WebMCP is an emerging standard; patterns based on API specification and React best practices)

## Executive Summary

WebMCP is an emerging browser API that allows web pages to expose tools to AI agents via `navigator.modelContext`. For a React 18 + TypeScript + Vite application, the recommended integration pattern is a **standalone module with a React hook wrapper** rather than a full context provider. This approach minimizes complexity while providing proper lifecycle management.

**Key finding:** WebMCP tools should be registered as early as possible (ideally in module initialization) but the React hook provides cleanup on unmount and state synchronization for dynamic tools.

---

## 1. WebMCP API Overview

### Core API Surface

```typescript
// Navigator extension (HTTPS only)
interface Navigator {
  modelContext: ModelContext;
}

interface ModelContext {
  // Register a single tool
  registerTool(tool: ModelContextTool): void;

  // Register multiple tools at once
  provideContext(context: ModelContextContext): void;

  // Unregister a tool by name
  unregisterTool(name: string): void;
}

interface ModelContextTool {
  name: string;
  description: string;
  inputSchema: JSONSchema;  // JSON Schema for input validation
  execute: (input: unknown) => Promise<unknown>;
}

interface ModelContextContext {
  tools: ModelContextTool[];
  // Future: resources, prompts, etc.
}
```

### Important Constraints

1. **HTTPS Required** - `navigator.modelContext` only available on secure origins
2. **No Official TypeScript Types** - Must define custom types (no @types/webmcp package exists)
3. **Polyfill May Be Needed** - Browser support is limited; check for API availability
4. **Synchronous Registration** - Tools registered synchronously become immediately available

---

## 2. React Integration Patterns

### Pattern A: Standalone Module (Recommended for Static Tools)

Best when tools don't depend on React state or component lifecycle.

```typescript
// src/lib/webmcp/tools.ts
import { calculationService } from '@/lib/services/calculationService';

export interface WebMCPTool {
  name: string;
  description: string;
  inputSchema: object;
  execute: (input: unknown) => Promise<unknown>;
}

export const mortgageTools: WebMCPTool[] = [
  {
    name: 'calculate_mortgage',
    description: 'Calculate monthly payment, total interest, and amortization schedule',
    inputSchema: {
      type: 'object',
      properties: {
        principal: { type: 'number', minimum: 1 },
        interestRate: { type: 'number', minimum: 0.01, maximum: 100 },
        loanTermYears: { type: 'number', minimum: 1, maximum: 50 },
        currency: { type: 'string', default: 'USD' }
      },
      required: ['principal', 'interestRate', 'loanTermYears']
    },
    execute: async (input) => {
      const { principal, interestRate, loanTermYears, currency } = input as {
        principal: number;
        interestRate: number;
        loanTermYears: number;
        currency?: string;
      };

      const result = calculationService.calculateBasicLoanDetails(
        principal,
        interestRate,
        loanTermYears,
        currency
      );

      return {
        monthlyPayment: result.monthlyPayment,
        totalInterest: result.totalInterest,
        totalPayment: result.monthlyPayment * loanTermYears * 12,
        actualTermMonths: result.actualTerm * 12,
        scheduleLength: result.amortizationSchedule.length
      };
    }
  }
];
```

```typescript
// src/lib/webmcp/register.ts
import { mortgageTools, WebMCPTool } from './tools';

function isWebMCPAvailable(): boolean {
  return typeof navigator !== 'undefined'
    && 'modelContext' in navigator
    && typeof (navigator as any).modelContext?.registerTool === 'function';
}

export function registerWebMCPTools(tools: WebMCPTool[] = mortgageTools): boolean {
  if (!isWebMCPAvailable()) {
    // Development fallback - log but don't error
    if (import.meta.env.DEV) {
      console.warn('[WebMCP] navigator.modelContext not available');
    }
    return false;
  }

  const mc = (navigator as any).modelContext;

  for (const tool of tools) {
    mc.registerTool({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      execute: tool.execute
    });
  }

  return true;
}

export function unregisterWebMCPTools(toolNames: string[]): void {
  if (!isWebMCPAvailable()) return;

  const mc = (navigator as any).modelContext;
  for (const name of toolNames) {
    mc.unregisterTool(name);
  }
}
```

**Registration in main.tsx (earliest possible):**

```typescript
// src/main.tsx
import { registerWebMCPTools } from './lib/webmcp/register';

// Register immediately on module load (before React renders)
registerWebMCPTools();

// ... rest of React setup
```

### Pattern B: React Hook (Recommended for Dynamic Tools)

Use when tools depend on React state or need lifecycle management.

```typescript
// src/hooks/useWebMCP.ts
import { useEffect, useRef } from 'react';
import { WebMCPTool } from '@/lib/webmcp/tools';

interface UseWebMCPOptions {
  tools: WebMCPTool[];
  enabled?: boolean;
}

interface UseWebMCPResult {
  isAvailable: boolean;
  registeredTools: string[];
}

export function useWebMCP({ tools, enabled = true }: UseWebMCPOptions): UseWebMCPResult {
  const registeredToolsRef = useRef<string[]>([]);
  const isAvailable = typeof navigator !== 'undefined'
    && 'modelContext' in navigator;

  useEffect(() => {
    if (!enabled || !isAvailable) return;

    const mc = (navigator as any).modelContext;
    const registered: string[] = [];

    for (const tool of tools) {
      try {
        mc.registerTool({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
          execute: tool.execute
        });
        registered.push(tool.name);
      } catch (err) {
        console.error(`[WebMCP] Failed to register tool: ${tool.name}`, err);
      }
    }

    registeredToolsRef.current = registered;

    // Cleanup: unregister on unmount or when tools change
    return () => {
      for (const name of registered) {
        try {
          mc.unregisterTool(name);
        } catch (err) {
          // Ignore unregister errors during cleanup
        }
      }
      registeredToolsRef.current = [];
    };
  }, [tools, enabled, isAvailable]);

  return {
    isAvailable,
    registeredTools: registeredToolsRef.current
  };
}
```

### Pattern C: Context Provider (NOT Recommended)

A full context provider adds complexity without significant benefit for WebMCP, since:
- Tool registration is a side effect, not state
- Tools don't need to be accessed from multiple components
- No need to pass WebMCP state through the component tree

**Avoid unless** you need to expose WebMCP status across many components.

---

## 3. Lifecycle Considerations

### When to Register Tools

| Timing | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **Module load** (outside React) | Earliest availability; tools ready before first render | No cleanup on HMR; can't depend on React state | Best for static tools |
| **App component mount** | Access to providers; proper cleanup | Slight delay; tools unavailable during SSR hydration | Good for most cases |
| **Specific component mount** | Fine-grained control; conditional registration | Tools only available when component mounted | Use for feature-specific tools |

### HMR (Hot Module Replacement) Handling

Vite's HMR can cause issues with WebMCP registration. Tools may be registered multiple times without cleanup.

```typescript
// Handle HMR in development
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    // Cleanup registered tools before module reload
    unregisterWebMCPTools(['calculate_mortgage', 'compare_scenarios']);
  });
}
```

### Strict Mode Considerations

React 18's Strict Mode double-invokes effects in development. WebMCP tools should handle this gracefully:

```typescript
useEffect(() => {
  // Check if tool already registered (handles Strict Mode double-invoke)
  // Note: WebMCP may not expose a way to check this; may need local tracking

  // Register...

  return () => {
    // Always cleanup
  };
}, []);
```

---

## 4. TypeScript Setup

### Custom Type Definitions

Create a declaration file since no official types exist:

```typescript
// src/types/webmcp.d.ts
declare global {
  interface Navigator {
    modelContext?: ModelContext;
  }
}

interface ModelContext {
  registerTool(tool: ModelContextTool): void;
  provideContext(context: ModelContextContext): void;
  unregisterTool(name: string): void;
}

interface ModelContextTool {
  name: string;
  description: string;
  inputSchema: JSONSchema7;  // Use json-schema types
  execute: (input: unknown) => Promise<unknown>;
}

interface ModelContextContext {
  tools: ModelContextTool[];
}

export {};
```

### JSON Schema Typing

For input schema typing, use the `json-schema` package types:

```bash
npm install --save-dev @types/json-schema
```

```typescript
import { JSONSchema7 } from 'json-schema';

interface WebMCPTool {
  name: string;
  description: string;
  inputSchema: JSONSchema7;
  execute: (input: unknown) => Promise<unknown>;
}
```

### Type-Safe Tool Execution

```typescript
import { z } from 'zod';

// Define schema with Zod for runtime validation
const calculateMortgageSchema = z.object({
  principal: z.number().positive(),
  interestRate: z.number().min(0.01).max(100),
  loanTermYears: z.number().int().min(1).max(50),
  currency: z.string().optional().default('USD')
});

type CalculateMortgageInput = z.infer<typeof calculateMortgageSchema>;

// Convert Zod schema to JSON Schema for WebMCP
import { zodToJsonSchema } from 'zod-to-json-schema';

const inputSchema = zodToJsonSchema(calculateMortgageSchema);

// Type-safe execute function
const execute = async (input: unknown): Promise<MortgageResult> => {
  const validated = calculateMortgageSchema.parse(input);  // Throws if invalid
  // ... perform calculation
};
```

---

## 5. Code Structure Recommendations

### Recommended Directory Structure

```
client/src/
  lib/
    webmcp/
      index.ts           # Main exports
      types.ts           # TypeScript interfaces
      tools/
        index.ts         # Export all tools
        calculate.ts     # Basic calculation tool
        compare.ts       # Scenario comparison tool (future)
        optimize.ts      # Optimization tool (future)
      register.ts        # Registration logic
      utils.ts           # Helper functions
  hooks/
    useWebMCP.ts         # React hook (if needed)
  types/
    webmcp.d.ts          # Global type declarations
```

### Tool Organization

Each tool in its own file for maintainability:

```typescript
// lib/webmcp/tools/calculate.ts
import { calculationService } from '@/lib/services/calculationService';
import { WebMCPTool } from '../types';

export const calculateMortgageTool: WebMCPTool = {
  name: 'calculate_mortgage',
  description: 'Calculate monthly mortgage payment, total interest, and amortization schedule for a given loan amount, interest rate, and term.',
  inputSchema: { /* ... */ },
  execute: async (input) => { /* ... */ }
};
```

```typescript
// lib/webmcp/tools/index.ts
export { calculateMortgageTool } from './calculate';
// Future tools:
// export { compareScenariosTool } from './compare';
// export { optimizeOverpaymentsTool } from './optimize';

import { calculateMortgageTool } from './calculate';
export const allTools = [calculateMortgageTool];
```

---

## 6. Testing Strategies

### Mocking navigator.modelContext

```typescript
// __mocks__/webmcp.ts
export const mockModelContext = {
  registerTool: jest.fn(),
  unregisterTool: jest.fn(),
  provideContext: jest.fn()
};

export function setupWebMCPMock() {
  Object.defineProperty(navigator, 'modelContext', {
    value: mockModelContext,
    writable: true,
    configurable: true
  });
}

export function cleanupWebMCPMock() {
  delete (navigator as any).modelContext;
}
```

### Testing Tool Registration

```typescript
// webmcp/register.test.ts
import { setupWebMCPMock, cleanupWebMCPMock, mockModelContext } from '../__mocks__/webmcp';
import { registerWebMCPTools } from './register';
import { mortgageTools } from './tools';

describe('WebMCP Registration', () => {
  beforeEach(() => {
    setupWebMCPMock();
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanupWebMCPMock();
  });

  it('registers all tools when WebMCP is available', () => {
    const result = registerWebMCPTools(mortgageTools);

    expect(result).toBe(true);
    expect(mockModelContext.registerTool).toHaveBeenCalledTimes(mortgageTools.length);
  });

  it('returns false when WebMCP is not available', () => {
    cleanupWebMCPMock();

    const result = registerWebMCPTools(mortgageTools);

    expect(result).toBe(false);
  });
});
```

### Testing Tool Execution

```typescript
// webmcp/tools/calculate.test.ts
import { calculateMortgageTool } from './calculate';

describe('calculate_mortgage tool', () => {
  it('calculates correct monthly payment', async () => {
    const result = await calculateMortgageTool.execute({
      principal: 300000,
      interestRate: 3.5,
      loanTermYears: 30
    });

    expect(result).toHaveProperty('monthlyPayment');
    expect((result as any).monthlyPayment).toBeCloseTo(1347.13, 2);
  });

  it('throws on invalid input', async () => {
    await expect(calculateMortgageTool.execute({
      principal: -100,  // Invalid
      interestRate: 3.5,
      loanTermYears: 30
    })).rejects.toThrow();
  });
});
```

---

## 7. Implementation Recommendations

### For This Project (MortgageCalculator)

**Recommended approach:** Standalone module with registration at app entry.

1. **Create `lib/webmcp/` directory** with types, tools, and registration logic
2. **Register in `main.tsx`** immediately on module load (before React)
3. **Use calculationService** as the API surface (per existing architecture)
4. **Start with one tool** (`calculate_mortgage`), add more in future phases
5. **Add Zod validation** for type-safe input handling (already in project)
6. **Skip context provider** - unnecessary complexity for this use case

### Phase 1 Scope

- Single tool: `calculate_mortgage`
- Inputs: principal, interestRate, loanTermYears, currency
- Outputs: monthlyPayment, totalInterest, totalPayment, scheduleLength
- No UI indicators (invisible operation)
- Proper TypeScript types
- Error handling with validation

### Future Phases

| Tool | Description | Dependencies |
|------|-------------|--------------|
| `compare_scenarios` | Compare multiple loan configurations | comparisonService |
| `optimize_overpayments` | Recommend optimal overpayment strategy | optimizationEngine |
| `get_amortization_schedule` | Full schedule with optional filtering | calculationService |

---

## 8. Confidence Assessment

| Finding | Confidence | Rationale |
|---------|------------|-----------|
| API shape (`navigator.modelContext`) | HIGH | Per project context and W3C proposal |
| No @types package exists | MEDIUM | Unable to verify via web search |
| Standalone module pattern | HIGH | Standard React best practice |
| Hook pattern for dynamic tools | HIGH | Standard React pattern |
| Zod for validation | HIGH | Already in project stack |
| HMR handling needed | MEDIUM | Known Vite behavior |

---

## 9. Open Questions

1. **Browser support** - Which browsers currently support WebMCP? May need polyfill strategy.
2. **Tool discovery** - How do agents discover available tools? (Likely automatic via browser)
3. **Error reporting** - How should tool errors be reported back to agents?
4. **Rate limiting** - Should tools implement any rate limiting for agent calls?
5. **Logging** - How to log agent interactions without console.logs (per project convention)?

---

## Sources

- Project context: `.planning/PROJECT.md` (WebMCP concepts)
- Project architecture: `.planning/codebase/ARCHITECTURE.md`
- calculationService implementation: `client/src/lib/services/calculationService.ts`
- React 18 documentation (training data)
- WebMCP emerging specification (training data, confidence MEDIUM)

**Note:** Web search was unavailable. Findings based on project context and React/TypeScript best practices. Recommend verifying WebMCP specifics against official googlechromelabs/webmcp-tools repository when web access is available.
