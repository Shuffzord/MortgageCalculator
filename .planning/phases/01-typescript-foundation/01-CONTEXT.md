# Phase 1: TypeScript Foundation - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish type-safe WebMCP infrastructure. Create TypeScript types for WebMCP API (navigator.modelContext) and global type declarations. This is foundational work that other phases build upon.

</domain>

<decisions>
## Implementation Decisions

### Type Strictness
- All parameters explicitly typed — no 'any' or 'unknown' at boundaries
- Use readonly modifiers to enforce immutability where applicable
- Use explicit optional properties with '?' — implementation provides defaults
- Use branded types for IDs and special strings (ToolName, SessionId) to prevent mixing up strings

### File Organization
- Split types by concern — separate files: navigator.ts, tools.ts, context.ts
- Global navigator augmentation in dedicated file: `client/src/types/webmcp.d.ts`
- Single barrel file (index.ts) for re-exporting all types — clean imports via `@/lib/webmcp`
- Tool-specific types live in shared types folder, not co-located with implementations

### Naming Conventions
- No 'I' prefix on interfaces — use `ModelContext`, not `IModelContext`
- Descriptive names for tool types — `CalculateMortgageInput`, `CalculateMortgageOutput`
- kebab-case for filenames — `model-context.ts`, `tool-types.ts`

### Future Extensibility
- Concrete types per tool — no generic base classes
- Only define types needed now (Phase 1-3) — YAGNI principle
- No versioning infrastructure — add when actually needed
- Types must be framework-agnostic — no React dependencies in type definitions

### Claude's Discretion
- When to use 'type' vs 'interface' — idiomatic per case

</decisions>

<specifics>
## Specific Ideas

- Types should work outside React — pure TypeScript, reusable in any context
- Branded types add type safety for strings that shouldn't be mixed up

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-typescript-foundation*
*Context gathered: 2026-02-17*
