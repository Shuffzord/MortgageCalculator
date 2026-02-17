# Phase 2: Calculate Tool Implementation - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement the `calculateMortgage` WebMCP tool that AI agents can call to get mortgage calculations. This phase creates the tool definition, input validation, and response formatting. Registration with the browser API is Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Response Format
- Full amortization schedule included — LLM decides how to present it to users
- Raw numeric values only (no formatted strings like "$1,703.37")
- Use same structure as existing calculation engine output
- Metadata (currency, repayment model, timestamp) at Claude's discretion

### Error Responses
- Return first validation error only (not all errors at once)
- Error message without hints (agent figures out correction)
- Include field path for programmatic handling: `{field: "principal", message: "..."}`
- Use existing error code patterns from codebase

### Input Flexibility
- Interest rate as percentage only (6.5 means 6.5%, matches UI)
- Defaults provided: currency = "USD", repaymentModel = "equalInstallments"
- No overpayment field — basic calculation only (overpayment tool is future phase)
- Type coercion strictness at Claude's discretion (follow WebMCP patterns)

### Natural Language Output
- No natural language summary — return data only
- Agent generates its own user-facing summary from raw data

### Claude's Discretion
- Whether to include calculation metadata (timestamp, inputs echo)
- Type coercion behavior for string-to-number
- Amortization schedule organization details

</decisions>

<specifics>
## Specific Ideas

- Match existing calculation engine data structures where possible
- Keep response lean — agents don't need formatted values

</specifics>

<deferred>
## Deferred Ideas

- Overpayment calculation — Future phase (Phase 6 in roadmap)
- Multiple scenarios comparison — Future phase

</deferred>

---

*Phase: 02-calculate-tool-implementation*
*Context gathered: 2026-02-17*
