# Roadmap

This roadmap turns the open-source readiness checklist into time-bound milestones. It reflects both the project’s experimental AI-assisted beginnings and the path to a stable, community-friendly release.

Status key: P0 = Blocker, P1 = Important, P2 = Nice-to-have

## Milestones

### 0) Open-Source Readiness (P0)
- Source hygiene: remove/relocate vestigial assets (`archive/`, `attached_assets/`, `*.bak`, `*.todo`), add `.gitignore` entries for E2E artifacts
- Config consistency: add `.editorconfig` and `.gitattributes`
- Env hygiene: move analytics IDs from `client/index.html` to Vite env (`VITE_ANALYTICS_ID`, `VITE_GTM_ID`)
- Licensing: ensure MIT license present and referenced
- Dead code audit: `npx depcheck` (deps) and `npx ts-prune` (exports)

### 1) Tooling & Quality Gates (P0)
- ESLint + Prettier baseline (typescript-eslint, react, jsx-a11y, testing-library, jest)
- TS strictness: `strict`, `noImplicitAny`, `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes`
- Pre-commit (Husky + lint-staged): `eslint --fix`, `prettier --check`, type-check on staged files
- PR standards: PR template, optional Conventional Commits (commitlint)
- Coverage thresholds in Jest; CI fails below threshold; badges in README
- Disallow `console.*` via ESLint

### 2) Testing Strategy (P0/P1)
- Unit tests for: `calculationCore.ts`, `calculationEngine.ts`, `overpaymentCalculator.ts`, `optimizationEngine.ts`, `formatters.ts`
- Edge/regression tests: mid-term rate changes, overpayment boundary months, rounding behavior
- E2E smoke in CI: render `/en/`, submit form, verify amortization table/chart, language switch; upload artifacts on failure
- Accessibility checks with `axe-core` (fail on serious/critical)
- Performance check: Lighthouse CI with budgets

### 3) Security & Supply Chain (P0)
- Enable Dependabot (security + version updates), secret scanning, push protection
- Add CodeQL workflow for JS/TS and OSSF Scorecard
- Enforce `npm audit` threshold in CI (block high/critical)
- CSP hardening; document exceptions

### 4) CI/CD (P0/P1)
- `ci.yml` (pull_request): lint, type-check, unit, coverage, translation check, E2E smoke
- `deploy.yml` (push to main): build + Azure Static Web Apps deploy after CI pass
- Cache npm and Vite; mark status checks required on `main`

### 5) Dependencies & Performance (P1)
- Audit and update packages; validate via tests
- Bundle analysis (rollup-plugin-visualizer), lazy-load heavy charts, verify tree-shaking

### 6) Documentation & Community (P0/P1)
- Community health: `SECURITY.md`, `SUPPORT.md`, issue/PR templates, `GOVERNANCE.md`, `CODEOWNERS`, `FUNDING.yml`
- Architecture notes: formulas/assumptions, i18n workflow
- Privacy/Terms pages in-app; document analytics/data handling

### 7) Translations & Accessibility (P0/P1)
- Add Chinese (`zh`) and encourage contributions for more languages
- Run `npm run check:translations`; maintain key parity and placeholders
- Improve keyboard navigation and focus management

### 8) Product Features (P1)
- Scenario comparison (side-by-side)
- Export schedules/summaries (CSV/PDF/JSON)
- Overpayment planning enhancements and optimization hints
- Education mode improvements (concepts, examples, tooltips)

### 9) AI Tooling Sandbox (P2)
- Maintain branches for agent-driven experiments; summarize outcomes
- Track refactor/cleanup issues post-experiments

## Timeline (Suggested)
- Week 1 (P0): Readiness (hygiene, license), ESLint/Prettier/Husky, TS strict, CI split + required checks, coverage, SECURITY/SUPPORT, issue/PR templates
- Week 2 (P0/P1): E2E smoke in CI, Dependabot/CodeQL/Scorecard, CSP review, Lighthouse CI, translation validation and zh bootstrap
- Week 3 (P1): Dependency updates, bundle analysis, focused unit tests + a11y fixes, privacy/terms stubs
- Week 4 (P1/P2): Optional core extraction, visual regression, release automation, tag `v1.0.0`

## Tracking & Status
- Use GitHub Issues for each milestone item and link them here as they’re created.
- Reference the detailed checklist in `Open-Source-Checklist.md` for acceptance criteria and commands.

## Recently Completed
- MIT `LICENSE`, `SECURITY.md`, `SUPPORT.md`
- Issue templates and PR template
- README, CONTRIBUTING, CODE_OF_CONDUCT updates
