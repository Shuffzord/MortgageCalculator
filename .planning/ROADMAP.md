# Roadmap: WebMCP Integration

**Milestone:** 1.0 - WebMCP Basic Calculation Tool
**Created:** 2026-02-17

---

## Overview

Integrate WebMCP to expose mortgage calculation to AI agents.

**Milestone Goal:** AI agents can calculate mortgages through `navigator.modelContext`.

---

## Phases

### Phase 1: TypeScript Foundation

**Goal:** Establish type-safe WebMCP infrastructure

**Plans:** 1 plan

Plans:
- [x] 01-01-PLAN.md — Create WebMCP type definitions and navigator augmentation

**Deliverables:**
- [x] WebMCP TypeScript types (split by concern: navigator, tools, context)
- [x] Global navigator augmentation
- [x] Barrel exports for clean imports

**Success Criteria:** TypeScript compiles without errors for WebMCP types

**Requirements:** [NFR-2, NFR-3]

---

### Phase 2: Calculate Tool Implementation

**Goal:** Implement the calculateMortgage tool

**Plans:** 1 plan

Plans:
- [ ] 02-01-PLAN.md — Implement calculateMortgage tool with validation and response formatting

**Deliverables:**
- [ ] calculateMortgage tool definition
- [ ] Input validation logic
- [ ] Response formatting logic

**Success Criteria:** Tool execute function returns correct results for test inputs

**Requirements:** [FR-2, FR-3, FR-5]

---

### Phase 3: Registration & Integration

**Goal:** Register tools on page load

**Plans:** 1 plan

Plans:
- [ ] 03-01-PLAN.md — Create registration module with feature detection and integrate into app initialization

**Deliverables:**
- [ ] Registration module
- [ ] Integration in app entry point

**Success Criteria:** Tool appears in Chrome extension after page load

**Requirements:** [FR-1, FR-4]

---

### Phase 4: Testing Infrastructure

**Goal:** Enable automated testing of WebMCP code

**Tasks:**
1. Create `client/src/__mocks__/navigator-model-context.ts`:
   - Mock ModelContext implementation
   - Setup/teardown helpers
2. Create `client/src/lib/webmcp/tools/calculate.test.ts`:
   - Valid input tests
   - Invalid input tests
   - Edge case tests
3. Create `client/src/lib/webmcp/register.test.ts`:
   - Registration tests
   - Feature detection tests

**Deliverables:**
- [ ] Navigator mock
- [ ] Unit tests for calculate tool
- [ ] Unit tests for registration

**Success Criteria:** All tests pass; coverage > 80%

---

### Phase 5: Documentation & Verification

**Goal:** Document usage and verify integration

**Tasks:**
1. Update README with WebMCP section:
   - Requirements (Chrome 146+, flag)
   - How to test manually
   - Available tools
2. Create manual testing checklist
3. End-to-end verification with Chrome extension

**Deliverables:**
- [ ] README documentation
- [ ] Testing checklist
- [ ] Verification complete

**Success Criteria:** External developer can test WebMCP tools following docs

---

## Phase Summary

| Phase | Description | Est. Complexity |
|-------|-------------|-----------------|
| 1 | TypeScript Foundation | Low |
| 2 | Calculate Tool Implementation | Medium |
| 3 | Registration & Integration | Low |
| 4 | Testing Infrastructure | Medium |
| 5 | Documentation & Verification | Low |

---

## Dependencies

```
Phase 1 (Types)
    ↓
Phase 2 (Tool) ←── calculationEngine (existing)
    ↓
Phase 3 (Registration)
    ↓
Phase 4 (Testing)
    ↓
Phase 5 (Documentation)
```

---

## Future Phases (Post-v1)

| Phase | Description | Trigger |
|-------|-------------|---------|
| 6 | Overpayment Analysis Tool | User request |
| 7 | Scenario Comparison Tool | User request |
| 8 | Optimization Tool | User request |
| 9 | E2E Puppeteer Tests | CI/CD need |

---

*Roadmap created: 2026-02-17*
