# MortgageCalc WebMCP Integration

## What This Is

A client-side React mortgage calculator with advanced features (multiple repayment models, overpayment optimization, scenario comparison, i18n) — now being extended to support WebMCP, allowing AI agents to invoke calculator functions directly from the browser.

## Core Value

AI agents can programmatically calculate mortgages through the WebMCP API, demonstrating how web applications can expose functionality to AI assistants.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. Inferred from existing codebase. -->

- ✓ Basic mortgage calculation (principal, rate, term → payment, schedule) — existing
- ✓ Multiple repayment models (equal installments, decreasing) — existing
- ✓ Variable interest rate support (multiple rate periods) — existing
- ✓ Overpayment system (one-time, recurring, reduce term/payment) — existing
- ✓ Overpayment optimization recommendations — existing
- ✓ Scenario comparison (side-by-side loan configurations) — existing
- ✓ Amortization schedule display with charts — existing
- ✓ Save/load calculations to localStorage — existing
- ✓ CSV export and import/export — existing
- ✓ Interactive tutorial system — existing
- ✓ Internationalization (EN, PL, ES) — existing
- ✓ Dark/light theme — existing
- ✓ Educational content (glossary, explanations) — existing

### Active

<!-- Current scope. Building toward these. -->

- [ ] WebMCP integration via `navigator.modelContext` API
- [ ] Basic calculation tool exposed to agents (principal, rate, term → payment, total interest, schedule)
- [ ] Tool input validation with JSON Schema
- [ ] Agent calls work invisibly (no UI indicators)

### Out of Scope

- UI indicators for agent activity — invisible operation preferred
- Backend/server-side MCP server — WebMCP is browser-native
- Advanced tools in v1 (overpayment, comparison, optimization) — future phases

## Context

WebMCP is an emerging W3C proposal (Web Machine Learning Community Group) that enables web pages to act as MCP servers. The calculator will register tools via `navigator.modelContext.provideContext()` that AI agents can discover and invoke.

**Key WebMCP concepts:**
- `navigator.modelContext` — entry point (HTTPS only)
- `ModelContextTool` — tool definition with name, description, inputSchema, execute callback
- Tools return structured data that agents can process

**Existing calculator architecture:**
- `calculationService` is the UI-facing API for all calculations
- `calculationEngine` orchestrates calculation logic
- `types.ts` defines `LoanDetails`, `PaymentData`, `CalculationResults`
- All calculation logic is client-side (no backend)

The WebMCP integration will create a thin adapter layer that:
1. Registers calculator tools on page load
2. Translates agent inputs to `LoanDetails` format
3. Calls `calculationService` methods
4. Returns structured results to agents

## Constraints

- **Browser API:** WebMCP requires HTTPS and `navigator.modelContext` support
- **Client-side only:** No backend changes; WebMCP runs entirely in browser
- **Existing architecture:** Must use `calculationService` as the API surface (per project conventions)
- **TypeScript:** All new code must be TypeScript with strict typing

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Start with basic calculation only | Incremental approach; prove concept before expanding | — Pending |
| Invisible agent activity | Cleaner demo; focus on capability, not UI chrome | — Pending |
| Use calculationService | Follows existing architecture; avoids bypassing validation | — Pending |

---
*Last updated: 2026-02-17 after project initialization*
