# Phase 1: TypeScript Foundation - Research

**Researched:** 2026-02-17
**Domain:** WebMCP TypeScript Type Definitions & Navigator API Augmentation
**Confidence:** HIGH

## Summary

This research investigates TypeScript type definition patterns for WebMCP (Web Model Context Protocol), a W3C Community Group standard that enables browser-native AI agent interaction through the `navigator.modelContext` API. The phase requires creating type-safe TypeScript infrastructure for WebMCP tool registration, including global navigator augmentation, core API interfaces, and tool-specific types.

WebMCP is a relatively new browser API (Chrome 146+ preview, February 2026) with emerging TypeScript ecosystem support via `@mcp-b/global` and related packages. The implementation will leverage TypeScript's strict mode, branded types for type safety, and declaration merging for navigator augmentation.

**Primary recommendation:** Use TypeScript's `declare global` pattern for navigator augmentation in a dedicated `.d.ts` file, split type definitions by concern into separate files (navigator, tools, context), leverage branded types for string-based IDs, and follow project conventions with `type` for unions/primitives and `interface` for object shapes.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Type Strictness
- All parameters explicitly typed — no 'any' or 'unknown' at boundaries
- Use readonly modifiers to enforce immutability where applicable
- Use explicit optional properties with '?' — implementation provides defaults
- Use branded types for IDs and special strings (ToolName, SessionId) to prevent mixing up strings

#### File Organization
- Split types by concern — separate files: navigator.ts, tools.ts, context.ts
- Global navigator augmentation in dedicated file: `client/src/types/webmcp.d.ts`
- Single barrel file (index.ts) for re-exporting all types — clean imports via `@/lib/webmcp`
- Tool-specific types live in shared types folder, not co-located with implementations

#### Naming Conventions
- No 'I' prefix on interfaces — use `ModelContext`, not `IModelContext`
- Descriptive names for tool types — `CalculateMortgageInput`, `CalculateMortgageOutput`
- kebab-case for filenames — `model-context.ts`, `tool-types.ts`

#### Future Extensibility
- Concrete types per tool — no generic base classes
- Only define types needed now (Phase 1-3) — YAGNI principle
- No versioning infrastructure — add when actually needed
- Types must be framework-agnostic — no React dependencies in type definitions

### Claude's Discretion
- When to use 'type' vs 'interface' — idiomatic per case

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NFR-2 | TypeScript - All WebMCP code MUST be TypeScript with strict typing | Strict mode patterns, branded types, readonly modifiers documented |
| NFR-3 | Code Organization - Follow project conventions with specific file structure | File organization patterns from existing codebase align with WebMCP separation of concerns |
| FR-1 | WebMCP Tool Registration - Tool via navigator.modelContext.registerTool() | Navigator augmentation patterns and ModelContextTool interface structure documented |
| FR-2 | Basic Calculation Tool - calculateMortgage tool with typed input/output | Tool type patterns and JSON Schema integration researched |
| FR-3 | Input Validation - Zod validation with descriptive errors | Zod best practices and safeParse patterns documented |
| FR-4 | Feature Detection - Graceful handling without WebMCP | Type-safe feature detection patterns researched |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.6.3 | Type system | Already in project, required for strict typing (NFR-2) |
| Zod | 3.24.3 | Runtime validation | Already in project, WebMCP best practice for input validation |
| N/A (Native API) | Chrome 146+ | WebMCP browser API | W3C standard, browser-native (no library needed) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @mcp-b/global | Latest | WebMCP polyfill/types | Optional - provides existing types, but project will define custom types per user decisions |
| zod-validation-error | 3.4.0 | Zod error formatting | Already in project, useful for descriptive validation errors (FR-3) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom types | @mcp-b/global types | Custom gives full control per user decisions; @mcp-b/global might not match split-by-concern structure |
| Zod | JSON Schema alone | Zod provides TypeScript inference and better DX; WebMCP accepts JSON Schema natively |
| Branded types | Plain strings | Branded types prevent mixing up string-based IDs (ToolName, SessionId) at compile time |

**Installation:**
```bash
# No new dependencies needed - using existing TypeScript and Zod
# Optional: npm install @mcp-b/global (if choosing to use existing types)
```

## Architecture Patterns

### Recommended Project Structure
```
client/src/
├── lib/webmcp/
│   ├── types/
│   │   ├── navigator.ts       # Navigator-specific types (ModelContext interface)
│   │   ├── tools.ts           # Tool-related types (ModelContextTool, execute signature)
│   │   ├── context.ts         # Context and response types (ToolResponse, Content)
│   │   └── index.ts           # Barrel export
│   └── index.ts               # Main lib export
└── types/
    └── webmcp.d.ts            # Global navigator augmentation (declare global)
```

**Rationale:** Aligns with user decision to split by concern and existing project structure (e.g., `client/src/lib/types.ts`, `client/src/lib/services/`).

### Pattern 1: Navigator Augmentation via `declare global`

**What:** Extend the global `Navigator` interface to add `modelContext` property

**When to use:** For browser-native APIs that aren't in TypeScript's lib.dom.d.ts yet

**Example:**
```typescript
// client/src/types/webmcp.d.ts
// Source: https://www.typescriptlang.org/docs/handbook/declaration-files/templates/global-d-ts.html

export {}; // Marks file as module (required for declare global)

declare global {
  interface Navigator {
    readonly modelContext?: ModelContext;
  }
}
```

**Key insight:** The `export {}` is critical - it marks the file as a module, allowing `declare global` to work. Without it, TypeScript treats the file as a script and throws "Augmentations for the global scope can only be directly nested in external modules."

### Pattern 2: Branded Types for String Safety

**What:** Create distinct types for semantically different strings

**When to use:** For IDs, special string values that shouldn't be interchangeable

**Example:**
```typescript
// Source: https://www.learningtypescript.com/articles/branded-types

// Brand helper using unique symbol
declare const brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [brand]: B };

// Branded types for WebMCP
type ToolName = Brand<string, 'ToolName'>;
type SessionId = Brand<string, 'SessionId'>;

// Type assertion functions for creating branded values
function toolName(name: string): ToolName {
  // Validation logic here
  return name as ToolName;
}

function sessionId(id: string): SessionId {
  return id as SessionId;
}
```

**Key insight:** Branded types exist only at compile time (zero runtime overhead) but prevent mixing up strings. For example, you can't pass a `ToolName` where a `SessionId` is expected.

### Pattern 3: Type vs Interface Decision Matrix

**What:** Choose `type` or `interface` based on use case

**When to use:** Every type definition

**Decision matrix:**
```typescript
// Source: https://www.totaltypescript.com/type-vs-interface-which-should-you-use

// Use TYPE for:
type ToolName = Brand<string, 'ToolName'>;              // Primitives/brands
type ContentType = 'text' | 'image' | 'error';         // Unions
type ToolResponse = { content: Content[] } | { error: string }; // Complex unions

// Use INTERFACE for:
interface ModelContext {                               // Object shapes
  registerTool(tool: ModelContextTool): Promise<void>;
  unregisterTool(name: ToolName): Promise<void>;
}

interface ModelContextTool {                           // Extensible objects
  readonly name: ToolName;
  readonly description: string;
  readonly inputSchema: JSONSchema;
  execute(args: unknown): Promise<ToolResponse>;
}
```

**Rationale:** Interfaces are cached by name in TypeScript's internal registry (performance), support declaration merging (future extensibility), and are more idiomatic for object shapes. Types are required for unions/primitives and provide better error messages for complex types.

### Pattern 4: Readonly Properties for Immutability

**What:** Mark properties that shouldn't be mutated with `readonly`

**When to use:** Tool definitions, configuration objects, API responses

**Example:**
```typescript
// Source: https://betterstack.com/community/guides/scaling-nodejs/ts-readonly/

interface ModelContextTool {
  readonly name: ToolName;           // Tool name shouldn't change after registration
  readonly description: string;      // Description is immutable
  readonly inputSchema: JSONSchema;  // Schema is immutable
  execute(args: unknown): Promise<ToolResponse>; // Function not readonly
}

// For nested objects, use Readonly utility type
type ReadonlyToolConfig = Readonly<{
  name: string;
  schema: JSONSchema;
}>;
```

**Key insight:** `readonly` is compile-time only (zero runtime cost) and only applies to the first level. For deep immutability, use `Readonly<T>` utility type or readonly modifiers on nested properties.

### Pattern 5: Zod Validation with safeParse

**What:** Use Zod's `safeParse` for runtime validation without throwing

**When to use:** All external input validation (agent tool calls)

**Example:**
```typescript
// Source: https://zod.dev/ and https://oneuptime.com/blog/post/2026-01-25-zod-validation-typescript/view

import { z } from 'zod';

// Define schema
const CalculateMortgageInputSchema = z.object({
  principal: z.number().positive(),
  annualInterestRate: z.number().min(0).max(100),
  loanTermYears: z.number().int().positive().max(50),
  currency: z.string().optional(),
  repaymentModel: z.enum(['equalInstallments', 'decreasingInstallments']).optional()
});

// Infer TypeScript type
type CalculateMortgageInput = z.infer<typeof CalculateMortgageInputSchema>;

// Use safeParse (never throws)
function validateInput(data: unknown): CalculateMortgageInput | { error: string } {
  const result = CalculateMortgageInputSchema.safeParse(data);

  if (!result.success) {
    return { error: result.error.message }; // Descriptive error
  }

  return result.data; // Type-safe validated data
}
```

**Key insight:** Zod 4 (current) supports JSON Schema conversion via `z.toJSONSchema()`, but round-trip soundness is not guaranteed. For WebMCP, define Zod schemas for validation and manually create JSON Schema for `inputSchema` field, ensuring both are in sync.

### Anti-Patterns to Avoid

- **Don't use 'I' prefix**: Use `ModelContext` not `IModelContext` (per user decision and modern TypeScript convention)
- **Don't use 'any' at boundaries**: All external inputs should be typed as `unknown` and validated, not `any`
- **Don't co-locate tool types**: Tool-specific types belong in `lib/webmcp/types/`, not next to tool implementations (per user decision)
- **Don't use generic base classes**: Each tool should have concrete types, not `BaseTool<TInput, TOutput>` (per user decision)
- **Don't over-engineer**: Only define types needed for Phase 1-3, not speculative future features (YAGNI principle per user decision)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON Schema validation | Custom validator | Zod with `safeParse` | Handles edge cases, generates TypeScript types, better errors |
| Navigator type extension | Monkey-patching at runtime | TypeScript `declare global` | Type-safe, compile-time only, follows official pattern |
| Immutability | Custom readonly wrappers | TypeScript `readonly` modifier | Zero runtime overhead, native type system support |
| Branded types | Custom class wrappers | TypeScript branded type pattern | Compile-time only, no runtime overhead, standard pattern |

**Key insight:** TypeScript's type system provides powerful compile-time features (branded types, readonly, declaration merging) with zero runtime cost. Don't reinvent these with runtime wrappers.

## Common Pitfalls

### Pitfall 1: Forgetting `export {}` in `.d.ts` files

**What goes wrong:** "Augmentations for the global scope can only be directly nested in external modules or ambient module declarations" error

**Why it happens:** TypeScript treats `.d.ts` files without exports as scripts, not modules. `declare global` only works in modules.

**How to avoid:** Always add `export {};` at the top of `.d.ts` files that use `declare global`

**Warning signs:**
- Build errors about global augmentation
- Navigator.modelContext not recognized in IDE

**Example:**
```typescript
// ❌ BAD - No export
declare global {
  interface Navigator {
    modelContext?: ModelContext;
  }
}

// ✅ GOOD - Has export
export {}; // Marks as module
declare global {
  interface Navigator {
    modelContext?: ModelContext;
  }
}
```

### Pitfall 2: Branded types without assertion functions

**What goes wrong:** Can't create branded type values at all, or unsafely casting everywhere

**Why it happens:** Branded types are compile-time constructs; you need runtime functions to create them

**How to avoid:** Create assertion/factory functions for each branded type

**Warning signs:**
- Lots of `as ToolName` casts scattered in code
- No validation when creating branded values

**Example:**
```typescript
// ❌ BAD - Unsafe casting everywhere
type ToolName = Brand<string, 'ToolName'>;
const name = "calculateMortgage" as ToolName; // No validation

// ✅ GOOD - Factory function with validation
function toolName(name: string): ToolName {
  if (!name || name.length < 3) {
    throw new Error('Invalid tool name');
  }
  return name as ToolName;
}

const name = toolName("calculateMortgage"); // Safe
```

### Pitfall 3: Using `parse()` instead of `safeParse()` in async contexts

**What goes wrong:** Uncaught exceptions crash tool execution; poor error messages to agents

**Why it happens:** Zod's `parse()` throws on invalid input; in async contexts (WebMCP execute), this can cause unhandled rejections

**How to avoid:** Always use `safeParse()` for external input validation

**Warning signs:**
- Try-catch blocks around every validation
- Unhandled promise rejections in console
- Generic error messages to agents

**Example:**
```typescript
// ❌ BAD - Throws, requires try-catch
async execute(args: unknown): Promise<ToolResponse> {
  try {
    const input = CalculateMortgageInputSchema.parse(args);
    // ...
  } catch (error) {
    return { error: 'Validation failed' }; // Generic error
  }
}

// ✅ GOOD - Never throws, descriptive errors
async execute(args: unknown): Promise<ToolResponse> {
  const result = CalculateMortgageInputSchema.safeParse(args);

  if (!result.success) {
    return {
      error: 'VALIDATION_ERROR',
      message: result.error.message, // Descriptive
      details: result.error.errors
    };
  }

  const input = result.data; // Type-safe
  // ...
}
```

### Pitfall 4: Readonly only at first level

**What goes wrong:** Nested object properties can still be mutated despite parent being readonly

**Why it happens:** TypeScript's `readonly` is shallow by default

**How to avoid:** Use `Readonly<T>` for nested objects or readonly modifiers on nested properties

**Warning signs:**
- Mutations happening to nested objects
- IDE not catching property assignments

**Example:**
```typescript
// ❌ BAD - Shallow readonly
interface ToolConfig {
  readonly name: string;
  readonly schema: { type: string; properties: Record<string, unknown> };
}

const config: ToolConfig = {
  name: 'test',
  schema: { type: 'object', properties: {} }
};
config.schema.properties.newProp = { type: 'string' }; // ⚠️ Allowed!

// ✅ GOOD - Deep readonly
interface ToolConfig {
  readonly name: string;
  readonly schema: Readonly<{
    readonly type: string;
    readonly properties: Readonly<Record<string, unknown>>;
  }>;
}
```

### Pitfall 5: Not configuring tsconfig for .d.ts recognition

**What goes wrong:** Global type declarations not recognized; `Navigator.modelContext` shows as error

**Why it happens:** `.d.ts` files need to be included in TypeScript compilation

**How to avoid:** Ensure `tsconfig.json` includes the types directory

**Warning signs:**
- Types defined but not recognized
- "Property 'modelContext' does not exist on type 'Navigator'" error

**Example:**
```json
// ✅ GOOD - tsconfig.json includes types
{
  "include": ["client/src/**/*", "shared/**/*"],
  "compilerOptions": {
    "types": ["vite/client", "jest"],
    // Types directory is automatically included via include path
  }
}
```

## Code Examples

Verified patterns from official sources:

### Navigator Augmentation (Global Declaration)
```typescript
// client/src/types/webmcp.d.ts
// Source: https://www.typescriptlang.org/docs/handbook/declaration-files/templates/global-d-ts.html

export {}; // Required: marks file as module

declare global {
  interface Navigator {
    /**
     * WebMCP Model Context API
     * Available in Chrome 146+ with chrome://flags/#enable-webmcp-testing
     * @see https://webmcp.link/
     */
    readonly modelContext?: ModelContext;
  }
}
```

### Core WebMCP Types
```typescript
// client/src/lib/webmcp/types/navigator.ts
// Source: Synthesized from https://github.com/WebMCP-org/examples and W3C spec

import type { ToolName } from './tools';

/**
 * ModelContext API - Entry point for WebMCP tool registration
 */
export interface ModelContext {
  /**
   * Register a tool that AI agents can discover and invoke
   * @param tool - Tool definition with name, description, schema, and execute handler
   * @returns Promise that resolves when tool is registered
   */
  registerTool(tool: ModelContextTool): Promise<void>;

  /**
   * Unregister a previously registered tool
   * @param name - Name of tool to unregister
   * @returns Promise that resolves when tool is unregistered
   */
  unregisterTool(name: ToolName): Promise<void>;
}
```

### Tool Definition Types
```typescript
// client/src/lib/webmcp/types/tools.ts
// Source: Synthesized from https://github.com/WebMCP-org/examples and https://docs.mcp-b.ai/

import type { JSONSchema, ToolResponse } from './context';

// Branded type for tool names
declare const toolNameBrand: unique symbol;
export type ToolName = string & { readonly [toolNameBrand]: 'ToolName' };

export function toolName(name: string): ToolName {
  if (!name || name.length < 3 || name.length > 50) {
    throw new Error('Tool name must be 3-50 characters');
  }
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
    throw new Error('Tool name must start with letter and contain only alphanumeric and underscore');
  }
  return name as ToolName;
}

/**
 * WebMCP Tool Definition
 * Represents a tool that AI agents can discover and invoke
 */
export interface ModelContextTool {
  /** Unique tool identifier (e.g., "calculateMortgage") */
  readonly name: ToolName;

  /** Human-readable description for AI agents */
  readonly description: string;

  /** JSON Schema defining expected input structure */
  readonly inputSchema: JSONSchema;

  /** Optional hint that tool only reads data (no side effects) */
  readonly readOnlyHint?: boolean;

  /**
   * Execute handler called when agent invokes tool
   * @param args - Input arguments matching inputSchema
   * @returns Promise resolving to tool response
   */
  execute(args: unknown): Promise<ToolResponse>;
}

/**
 * Tool-specific input types
 */
export interface CalculateMortgageInput {
  principal: number;
  annualInterestRate: number;
  loanTermYears: number;
  currency?: string;
  repaymentModel?: 'equalInstallments' | 'decreasingInstallments';
}

export interface CalculateMortgageOutput {
  summary: {
    monthlyPayment: string;
    totalInterest: string;
    totalCost: string;
    termLength: string;
  };
  details: {
    monthlyPaymentRaw: number;
    totalInterestRaw: number;
    termMonths: number;
  };
  yearlyBreakdown: Array<{
    year: number;
    principalPaid: string;
    interestPaid: string;
    balance: string;
  }>;
  naturalLanguageSummary: string;
}
```

### Context and Response Types
```typescript
// client/src/lib/webmcp/types/context.ts
// Source: https://github.com/WebMCP-org/examples

/**
 * JSON Schema type (simplified)
 * Full spec: https://json-schema.org/
 */
export type JSONSchema = {
  readonly type: 'object' | 'string' | 'number' | 'boolean' | 'array' | 'null';
  readonly properties?: Readonly<Record<string, JSONSchema>>;
  readonly required?: ReadonlyArray<string>;
  readonly description?: string;
  readonly items?: JSONSchema;
  readonly enum?: ReadonlyArray<string | number>;
  readonly [key: string]: unknown; // Allow other JSON Schema properties
};

/**
 * Content block in tool response
 */
export interface Content {
  readonly type: 'text' | 'image' | 'error';
  readonly text?: string;
  readonly data?: string; // Base64 for images
  readonly mimeType?: string;
}

/**
 * Tool execution response
 */
export interface ToolResponse {
  readonly content: ReadonlyArray<Content>;
  readonly error?: string;
  readonly code?: string;
}
```

### Barrel Export
```typescript
// client/src/lib/webmcp/types/index.ts
// Centralized exports for clean imports

export type {
  ModelContext
} from './navigator';

export type {
  ModelContextTool,
  ToolName,
  CalculateMortgageInput,
  CalculateMortgageOutput
} from './tools';

export {
  toolName // Export factory function
} from './tools';

export type {
  JSONSchema,
  Content,
  ToolResponse
} from './context';
```

### Zod Schema with Type Inference
```typescript
// Example: How Phase 2 will use these types
// Source: https://zod.dev/

import { z } from 'zod';
import type { CalculateMortgageInput } from './types';

// Define Zod schema
const CalculateMortgageInputSchema = z.object({
  principal: z.number().positive({ message: 'Principal must be positive' }),
  annualInterestRate: z.number().min(0).max(100, { message: 'Rate must be 0-100' }),
  loanTermYears: z.number().int().positive().max(50, { message: 'Term must be 1-50 years' }),
  currency: z.string().optional(),
  repaymentModel: z.enum(['equalInstallments', 'decreasingInstallments']).optional()
});

// Verify Zod inferred type matches explicit type
type ZodInferred = z.infer<typeof CalculateMortgageInputSchema>;
const _typeCheck: ZodInferred = {} as CalculateMortgageInput; // Should compile

// Use in validation
function validate(data: unknown): CalculateMortgageInput | { error: string } {
  const result = CalculateMortgageInputSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.message };
  }
  return result.data;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @types/navigator extension packages | `declare global` in .d.ts | TypeScript 2.0+ | Simpler, no extra dependencies |
| Manual type guards everywhere | Zod with safeParse | Zod 3.0 (2022) | Type inference + validation in one |
| Class-based nominal typing | Branded types with unique symbol | TypeScript 2.7+ | Zero runtime overhead |
| 'I' prefix for interfaces | No prefix | ~2020 community shift | Cleaner, matches modern conventions |
| Type declarations in separate @types packages | Co-located .d.ts files | TypeScript 3.8+ | Better organization, fewer dependencies |

**Deprecated/outdated:**
- **@types/webmcp**: Doesn't exist yet; WebMCP too new (Feb 2026). Use custom types.
- **Interface prefix 'I'**: Modern TypeScript convention drops this; use `ModelContext` not `IModelContext`
- **Zod v3 parse-only**: Zod v4 (current) adds `toJSONSchema()` but project should manually maintain JSON Schema for WebMCP compatibility

## Open Questions

1. **Should we use @mcp-b/global types or define custom?**
   - What we know: @mcp-b/global provides existing types; user decision requires split-by-concern structure
   - What's unclear: Whether @mcp-b/global types align with navigator.ts / tools.ts / context.ts split
   - Recommendation: Define custom types per user decisions; optionally reference @mcp-b/global for validation but don't depend on its structure

2. **JSON Schema vs Zod: Which is source of truth?**
   - What we know: WebMCP requires JSON Schema for inputSchema; Zod provides validation + type inference
   - What's unclear: Whether to generate JSON Schema from Zod or maintain both manually
   - Recommendation: Maintain both manually for Phase 1 (simple schema); defer to Phase 2 to decide if Zod-to-JSON-Schema conversion is needed

3. **How strict should branded type validation be?**
   - What we know: Branded types need factory functions; validation can range from simple to complex
   - What's unclear: What validation rules make sense for ToolName, SessionId, etc.
   - Recommendation: Start simple (length, character restrictions) and add validation as requirements emerge

## Sources

### Primary (HIGH confidence)
- TypeScript Official Docs - Declaration Files: https://www.typescriptlang.org/docs/handbook/declaration-files/templates/global-d-ts.html
- TypeScript Official Docs - Declaration Merging: https://www.typescriptlang.org/docs/handbook/declaration-merging.html
- Zod Official Docs: https://zod.dev/
- WebMCP Examples Repository: https://github.com/WebMCP-org/examples
- WebMCP Official Site: https://webmcp.link/

### Secondary (MEDIUM confidence)
- Learning TypeScript - Branded Types: https://www.learningtypescript.com/articles/branded-types
- Total TypeScript - Type vs Interface: https://www.totaltypescript.com/type-vs-interface-which-should-you-use
- Better Stack - TypeScript Readonly: https://betterstack.com/community/guides/scaling-nodejs/ts-readonly/
- LogRocket - Branded Types: https://blog.logrocket.com/leveraging-typescript-branded-types-stronger-type-checks/
- WebMCP Documentation: https://docs.mcp-b.ai/introduction

### Tertiary (LOW confidence)
- Medium articles on WebMCP and TypeScript (various authors, Feb 2026) - Used for ecosystem overview only
- MarkTechPost article on WebMCP: https://www.marktechpost.com/2026/02/14/google-ai-introduces-the-webmcp-to-enable-direct-and-structured-website-interactions-for-new-ai-agents/

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - TypeScript and Zod already in project; WebMCP is browser-native
- Architecture: HIGH - Official TypeScript patterns; validated with official docs and established practices
- Pitfalls: MEDIUM-HIGH - Common TypeScript pitfalls well-documented; WebMCP-specific ones inferred from similar APIs

**Research date:** 2026-02-17
**Valid until:** ~30 days (TypeScript stable; WebMCP new but W3C spec won't change rapidly)

**Key validation sources:**
- TypeScript patterns verified against official TypeScript handbook (typescript.org)
- Zod patterns verified against official Zod documentation (zod.dev)
- WebMCP structure verified against WebMCP-org GitHub examples and official site
- Branded types verified against multiple authoritative TypeScript sources

**Notes for planner:**
- Phase 1 is foundational - no runtime code, only types
- Types defined here will be used by Phase 2 (tool implementation) and Phase 3 (registration)
- User decisions are very specific - follow them exactly
- Existing project uses TypeScript strict mode - types must compile without errors
