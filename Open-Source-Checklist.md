## Open-Source Readiness Checklist

Use this file to track work to make the repo production‑quality and contributor‑friendly. Convert major items into GitHub issues, link them back here, and check items off as they are completed.

Legend: P0 = Blocker, P1 = Important, P2 = Nice‑to‑have

### Completed So Far

- [ ] Update `README.md` with stack, scripts, architecture, deploy notes
- [ ] Add `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md`
- [ ] Remove plan files from repo root

---

### Phase 0 — Source Hygiene (P0)

- [ ] Remove vestigial files and folders: `client/src/lib/*.bak`, `client/src/components/*/*.todo`, `attached_assets/`, `archive/` (confirm necessity or relocate to `docs/appendix/`)
- [ ] Add `.gitignore` entries for E2E screenshots/reports if large
- [ ] Move analytics IDs from `client/index.html` to Vite env (`VITE_ANALYTICS_ID`, `VITE_GTM_ID`); inject via code
- [ ] Add `LICENSE` (MIT) file to match `package.json`
- [ ] Dead code audit: `npx depcheck` (unused deps) and `npx ts-prune` (unused exports)

Acceptance Criteria

- No unused exports reported by `ts-prune`; no unused deps reported by `depcheck`
- No `.bak`/`.todo`/artifact folders left, or documented if retained

Commands

```
npx depcheck
npx ts-prune
```

### Phase 1 — Tooling & Quality Gates (P0)

- [ ] Add ESLint (typescript-eslint, react, jsx-a11y, testing-library, jest) and Prettier; `npm run lint`
- [ ] Enforce TypeScript strictness: enable `noImplicitAny`, `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes`
- [ ] Pre-commit: Husky + lint-staged running `eslint --fix`, `prettier --check`, and type-check on staged files
- [ ] PR standards: add PR template; consider Conventional Commits (commitlint)
- [ ] Coverage: set Jest thresholds; fail CI below threshold; optional Codecov integration
- [ ] Add: https://shields.io/badges
- [x] Add `lint:ci` script and configure CI to use it
- [x] Add `eslint-plugin-unused-imports` to auto-remove unused imports on fix
- [x] Enforce no new `console.log` on commits (lint-staged runs ESLint with `--rule 'no-console:error'`)
- [ ] Enable TS `noUnusedLocals`/`noUnusedParameters` (gate after initial cleanup to reduce noise)

Acceptance Criteria

- CI fails on lint errors, TS errors, and coverage breaches
- Consistent formatting enforced locally and in CI

### Phase 2 — Testing Strategy (P0/P1)

- [ ] Unit tests: ensure coverage for `calculationCore.ts`, `calculationEngine.ts`, `overpaymentCalculator.ts`, `optimizationEngine.ts`, `formatters.ts`
- [ ] Add edge/regression cases: rate changes mid-term, overpayment boundary months, rounding behavior
- [ ] E2E smoke in CI: render `/en/`, submit form, verify amortization schedule, chart, language switch; upload artifacts on failure
- [ ] Accessibility checks with `axe-core` for critical screens
- [ ] Accessibility enforcement: fail E2E on serious/critical axe violations in key flows
- [ ] Performance check: Lighthouse CI on Home page with budgets

Acceptance Criteria

- Reliable, repeatable E2E run headless in CI with artifacts
- Measurable coverage improvement and enforced minimum threshold

### Phase 3 — Security & Supply Chain (P0)

- [ ] Enable Dependabot (security alerts + version updates)
- [ ] Enable secret scanning and push protection
- [ ] Add CodeQL workflow for JS/TS
- [ ] Add OSSF Scorecard workflow
- [ ] Enforce `npm audit` severity threshold in CI (block high/critical)
- [ ] CSP hardening: reduce `'unsafe-inline'` where possible; document exceptions

Acceptance Criteria

- Security dashboards green or actionable; CI blocks high/critical vulns
- CSP documented and justified; no analytics breakage

### Phase 4 — CI/CD Refinements (P0/P1)

- [ ] Create `ci.yml` (pull_request): lint, type-check, unit tests, coverage, E2E smoke
- [ ] Create `deploy.yml` (push to `main`): build + Azure SWA deploy after CI pass
- [ ] Cache npm and Vite appropriately
- [ ] Make status checks required on `main`

Acceptance Criteria

- Fast CI with stable caching; clear separation of test vs. deploy
- Required checks enforced on `main`

### Phase 5 — Dependencies & Performance (P1)

- [ ] Audit outdated packages: `npm outdated`
- [ ] Use `npx npm-check-updates -u` to stage batch upgrades; run tests
- [ ] Add bundle analysis (rollup-plugin-visualizer) and document tops
- [ ] Lazy-load heavy charts; verify tree-shaking of Radix/Recharts/Chart.js

Acceptance Criteria

- Dependencies current with no breaking regressions; bundle size understood

### Phase 6 — Documentation & Community (P0/P1)

- [ ] Add `SECURITY.md` (vulnerability disclosure process)
- [ ] Add `SUPPORT.md` (how to get help)
- [ ] Add `ROADMAP.md` (short- and mid-term milestones)
- [ ] Add `GOVERNANCE.md` and `CODEOWNERS` (review routing)
- [ ] Add issue templates (bug, feature) and PR template
- [ ] Add `FUNDING.yml` if sponsorship desired
- [ ] Architecture notes: formulas/assumptions for calculations; i18n workflow doc
- [ ] Privacy/Terms pages in app; document analytics

### Phase 6.1 — Unused Code (P1)
- [ ] Add script: `analyze:unused` → `ts-prune` to report unused exports
- [ ] Run `npx depcheck` to find unused dependencies
- [ ] Clean up dead code incrementally (PRs should not add unused exports)

Acceptance Criteria

- Contributors can self-serve; predictable reviews; clear policies

### Phase 7 — Branch Protections & Policies (P0)

- [ ] Protect `main`: require PR reviews (1–2), up-to-date branches, required status checks
- [ ] Enforce squash merges or linear history; auto-delete merged branches
- [ ] Consider requiring signed commits or DCO

Acceptance Criteria

- Accidental direct pushes and broken main prevented by policy

### Phase 8 — Repository Cleanup & Consistency (P0/P1)

- [ ] Add `.editorconfig` and `.gitattributes` for consistent editors and line endings
- [ ] Optimize large images or move to LFS
- [ ] Move `attached_assets/` and `archive/` to `docs/appendix/` or remove
- [ ] Update `.gitignore` for E2E artifacts if needed

Acceptance Criteria

- Clean root; predictable diffs; minimal repo bloat

### Phase 9 — Releases & Versioning (P1)

- [ ] Adopt Keep a Changelog; generate release notes
- [ ] Automate releases (Changesets or Release Please)
- [ ] Tag initial public release `v1.0.0`

Acceptance Criteria

- Repeatable, documented release process with changelog

### Phase 10 — Optional Enhancements (P2)

- [ ] Extract `client/src/lib/*` into `@smarter-loan/mortgage-core` package
- [ ] Add visual regression testing (Playwright traces or image snapshots)
- [ ] Add error telemetry (Sentry) with privacy-first config and opt-out

---

## Execution Plan (Suggested)

- Week 1 (P0): Hygiene, ESLint/Prettier/Husky, CI split + required checks, coverage gate, SECURITY.md, issue/PR templates, branch protection
- Week 2 (P0/P1): E2E smoke in CI, Dependabot/Renovate, CodeQL/Scorecard, CSP review, Lighthouse CI, Support/Roadmap
- Week 3 (P1): Dependency updates, bundle analysis, more unit tests + a11y, privacy/terms
- Week 4 (P1/P2): Optional core package extraction, visual regression, release automation, tag `v1.0.0`

## Success Criteria

- CI green on lint, type-check, unit tests, E2E smoke; coverage ≥ threshold
- No unused exports/dependencies (ts-prune/depcheck)
- Security tools (Dependabot, CodeQL, Audit) show no high/critical issues
- Docs and policies complete; protections enforced on `main`

# Conten updates
- [ ] Update about page with information about repo
- [ ] Add to the footer information about the repo
- [ ] Add buy me coffe to github

FInally:
Squash history: git checkout main; git reset $(git commit-tree HEAD^{tree} -m "Initial public release"); verify; git push --force-with-lease origin main. Replace message as needed.

Review: https://www.freecodecamp.org/news/how-to-start-an-open-source-project-on-github-tips-from-building-my-trending-repo/
And think about additioanl improvements
