# WebMCP Integration Research Summary

**Synthesized:** 2026-02-17
**Sources:** 4 research documents (patterns, react, mapping, testing)

---

## Key Decisions

### 1. Use Imperative API (not Declarative)

The **imperative API** (`navigator.modelContext.registerTool()`) is correct because:
- Complex calculation logic already exists in TypeScript
- Need structured JSON responses (not form submissions)
- Invisible operation required (no form UI indicators)

### 2. Standalone Module Pattern

**Recommended architecture:**
```
client/src/lib/webmcp/
  types.ts           # TypeScript interfaces
  tools/
    calculate.ts     # Basic calculation tool
    index.ts         # Export all tools
  register.ts        # Registration logic
```

Register in `main.tsx` on module load (before React renders).

### 3. Start with Single Tool

**v1 Tool: `calculateMortgage`**

Input Schema (simplified from full LoanDetails):
- `principal` (required) - loan amount
- `annualInterestRate` (required) - rate as percentage (e.g., 6.5)
- `loanTermYears` (required) - term in years
- `currency` (optional, default "USD")
- `repaymentModel` (optional, default "equalInstallments")

Output (structured JSON in text):
- Summary: monthlyPayment, totalInterest, totalCost
- Yearly breakdown (not full 360-payment schedule)
- Natural language summary for agent use

### 4. Validation in Execute, Not Schema

WebMCP docs state: "Schema constraints are not guaranteed."

- Validate all inputs in execute callback
- Return descriptive errors for agent self-correction
- Use existing Zod schemas from project

### 5. Testing Strategy

| Layer | Tool | Coverage |
|-------|------|----------|
| Unit | Jest + mock | Execute logic, validation |
| Manual | Chrome extension | Tool registration, schema |
| E2E | Puppeteer | Full integration (optional) |

Chrome extension "Model Context Tool Inspector" is primary testing tool.

---

## Implementation Checklist

### Phase 1: Core Integration
- [ ] Create `lib/webmcp/types.ts` with TypeScript declarations
- [ ] Create `lib/webmcp/tools/calculate.ts` with basic tool
- [ ] Create `lib/webmcp/register.ts` with registration logic
- [ ] Register tools in `main.tsx`
- [ ] Add feature detection (graceful fallback)

### Phase 2: Testing
- [ ] Create navigator mock for Jest
- [ ] Unit tests for tool execute logic
- [ ] Manual testing checklist with Chrome extension

### Future Phases
- Overpayment analysis tool
- Scenario comparison tool
- Optimization recommendations tool

---

## Technical Notes

### Tool Response Format
```typescript
{
  content: [{
    type: "text",
    text: JSON.stringify({
      summary: { monthlyPayment, totalInterest, ... },
      yearlyBreakdown: [...],
      naturalLanguageSummary: "..."
    })
  }]
}
```

### Feature Detection
```typescript
if ('modelContext' in navigator) {
  navigator.modelContext.registerTool(...)
}
```

### Requirements
- Chrome 146+ with `chrome://flags/#enable-webmcp-testing`
- HTTPS (or localhost for dev)
- No backend changes needed

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| WebMCP is early preview | Graceful fallback; feature detection |
| Chrome-only support | Document requirement; app works without WebMCP |
| Schema not enforced | Validate in execute; return descriptive errors |
| Large response size | Return yearly summary, not full schedule |

---

*Synthesis complete: 2026-02-17*
