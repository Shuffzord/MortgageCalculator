Here’s a concrete, repo-specific plan to get this project truly open-source ready. I’ll sequence work so you can make fast progress while building quality safeguards.

Current Observations

Build/deploy: Vite app (root client), Azure Static Web Apps GitHub Action (.github/workflows/azure-static-web-apps.yml), Node 20, unit tests in CI.
Tests: Many unit tests for calculation engines, Puppeteer E2E runner present but not in CI by default.
i18n: i18next with locales in client/public/locales/{en,es,pl}/translation.json. Translation validator exists.
Potential cleanup: .bak sources (client/src/lib/*.{ts}.bak), .todo tests, attached_assets/ paste artifacts, archive/ leftovers, hard-coded GTM/GA IDs in client/index.html.
Tooling gaps: No ESLint/Prettier config checked in; no CodeQL/Scorecards; no coverage gate; no LICENSE file (MIT in package.json but add file); no branch protection policy encoded.
Phase 0 — Source Hygiene (P0)

Remove vestigial files:
client/src/lib/*.bak, client/src/components/*/*.todo, attached_assets/*, archive/* if not needed.
Add ignores for test artifacts, screenshots, reports if large.
Identify and delete dead code:
Run depcheck and ts-prune to find unused deps/exports.
Add “unused import” rule in ESLint to stop regressions.
Secrets & IDs:
Move hard-coded analytics IDs out of client/index.html to Vite env (VITE_ANALYTICS_ID, VITE_GTM_ID) and wire at runtime.
Licensing:
Add LICENSE (MIT) to match package.json.
Phase 1 — Tooling & Quality Gates (P0)

Linting & formatting:
ESLint (typescript-eslint, react, jsx-a11y, testing-library, jest) and Prettier config.
Add npm run lint and a CI job that fails on errors.
TypeScript:
Ensure strict mode on, tighten tsconfig.json (noImplicitAny, noUnusedLocals/Params, exactOptionalPropertyTypes).
Pre-commit automation:
Husky + lint-staged to run eslint --fix, prettier --check, type-check on staged files.
Commit/PR standards:
Conventional Commits (commitlint) or at least a PR template to capture test plan, screenshots, and i18n updates.
Coverage:
Add Jest coverage thresholds and fail CI under threshold.
Optional: upload to Codecov with PR comments.
Phase 2 — Testing Strategy (P0/P1)

Unit tests:
Ensure coverage on core engines: client/src/lib/calculationCore.ts, calculationEngine.ts, overpaymentCalculator.ts, optimizationEngine.ts, formatters.ts.
Add regression tests for rounding, edge cases (rate changes mid-term, overpayment edge months).
E2E tests:
Run Puppeteer E2E in CI headless on PRs, at least smoke paths:
/en/ rendering, form interactions, amortization schedule visible, chart renders, i18n switch.
Store artifacts (screenshots/reports) as workflow artifacts on failure.
Optionally evaluate Playwright later for parallel, trace, and cross-browser.
Accessibility checks:
Add axe-core checks in E2E or a11y unit tests for key flows.
Performance tests:
Add Lighthouse CI on PRs for Home page; fail on major regressions (LCP, CLS, Best Practices).
Phase 3 — Security & Supply Chain (P0)

GitHub security:
Enable Dependabot (security + version updates), Secret scanning, Code scanning (CodeQL for JS/TS).
Add OSSF Scorecard workflow.
Audits:
Keep npm audit integrated (already via scripts/security-audit.js); enforce severity threshold in CI.
Lockfiles:
Keep package-lock.json committed and updated; avoid pinning to latest.
CSP hardening:
Review CSP in staticwebapp.config.json and client/index.html.
Reduce 'unsafe-inline' where possible by moving analytics to external script tags with nonces or using framework-based injection; document any required exceptions.
Dependency policy:
Add Renovate or Dependabot for automated version bumps; include grouping and weekly batched PRs.
Phase 4 — CI/CD Refinements (P0/P1)

Split workflows:
ci.yml: lint, type-check, unit tests, coverage, E2E smoke (pull_request).
deploy.yml: build + Azure deploy on main after CI passes.
Caching & speed:
Use actions/setup-node cache for npm, and cache ~/.vite if helpful.
PR Preview:
Azure SWA already gives preview for PRs; ensure the E2E smoke can run against preview URL or local Vite server, not both.
Required checks:
Make CI status checks required on main: lint, type-check, unit tests, E2E smoke.
Phase 5 — Dependencies & Performance (P1)

Update dependencies:
Use npx npm-check-updates -ui locally to evaluate upgrades; schedule batch updates with tests.
Bundle & perf:
Enable bundle analysis (rollup-plugin-visualizer) for periodic audits.
Verify tree-shaking with Radix, Recharts/Chart.js; lazy-load heavy charts.
Optimize CSP-compatible analytics loading (defer scripts).
Phase 6 — Documentation & Community (P0/P1)

Already added: README.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md.
Add:
SECURITY.md (vuln report policy), SUPPORT.md (how to get help), ROADMAP.md (high-level milestones), GOVERNANCE.md (decision-making), CODEOWNERS (review routing).
Issue templates (bug, feature), PR template.
FUNDING.yml if sponsorship is desired.
Architecture docs:
Brief “How the calculator works” with formulas and assumptions.
Document i18n process and translation validator usage.
Privacy:
Add Privacy and Terms pages; be transparent about analytics and cookies.
Phase 7 — Branch Protections & Policies (P0)

Protect main:
Require PR, 1–2 approvals, dismiss stale reviews on new commits.
Require up-to-date branch, required status checks (lint/type/test/e2e/coverage).
Enforce linear history or squash merges; enable “delete head branches” after merge.
Optionally require signed commits or DCO.
Phase 8 — Repository Cleanup & Consistency (P0/P1)

Consolidate directories:
Remove/relocate attached_assets/ and archive/ out of the main repo or into docs/appendix/ if needed.
Editor settings:
Add .editorconfig and consistent .gitattributes (line endings), VSCode recommendations file if desired.
Assets:
Ensure large images are optimized or stored via LFS if they must be versioned.
Phase 9 — Releases & Versioning (P1)

Tags & changelog:
Adopt Keep a Changelog; tag releases with GitHub Releases.
Automation:
Use changesets or release-please to automate versioning and notes (even if not publishing to npm).
“Initial public release”:
After cleanup and gates are green, squash history (if desired) and tag v1.0.0.
Phase 10 — Optional Enhancements (P2)

Split core into a reusable package:
Extract client/src/lib/* mortgage logic to a @smarter-loan/mortgage-core npm package for reuse and testability.
Visual regression testing:
Use Playwright or jest-image-snapshot for key charts/schedules.
Telemetry for errors:
Client-side error reporting (Sentry) with privacy-first configuration and opt-out.
How To Execute Efficiently

Week 1 (P0): Hygiene (cleanup, IDs to env), ESLint/Prettier/Husky, CI split + required checks, basic coverage threshold, SECURITY.md, issue/PR templates, branch protections.
Week 2 (P0/P1): E2E smoke in CI, Dependabot/Renovate, CodeQL/Scorecard, CSP review, documentation set (Roadmap/Support), Lighthouse CI.
Week 3 (P1): Dependency updates, bundle analysis improvements, additional unit tests and a11y checks, privacy/terms pages.
Week 4 (P1/P2): Optional packaging split, visual regression, release automation, tag initial release.
Success Criteria

CI green on lint, type-check, unit tests, E2E smoke, coverage ≥ threshold.
No unused exports/dependencies per ts-prune/depcheck.
Security scanners (Dependabot, CodeQL, Audit) show no known critical issues.
Docs complete (README, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, ROADMAP, SUPPORT).
Branch protection enforced; PR previews working; automated release process in place.
If you want, I can open issues for each phase with checklists and wire up the CI templates next.