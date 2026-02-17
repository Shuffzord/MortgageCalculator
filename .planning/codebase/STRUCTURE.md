# Codebase Structure

**Analysis Date:** 2026-02-17

## Directory Layout

```
MortgageCalculator/                     # Project root
├── client/                             # All frontend source (Vite root)
│   ├── src/
│   │   ├── components/                 # React UI components
│   │   │   ├── mortgage-calculator/    # Mortgage-specific sub-components
│   │   │   ├── tutorial/               # Tutorial overlay components
│   │   │   └── ui/                     # shadcn/ui primitives + currency-selector
│   │   ├── hooks/                      # Custom React hooks
│   │   ├── lib/                        # Core business logic and utilities
│   │   │   ├── comprehensive-tests/    # Test suites for calculation accuracy
│   │   │   ├── services/               # Service layer (UI-facing APIs)
│   │   │   └── tutorial/               # Tutorial config, steps, state, analytics
│   │   ├── pages/                      # Route-level page components
│   │   ├── plugins/                    # Vite plugins (removeConsole)
│   │   └── test-utils/                 # Test helpers, mocks, test data
│   ├── e2e-tests/                      # Puppeteer E2E tests
│   │   ├── config/                     # E2E test configuration
│   │   ├── page-objects/               # Page object models
│   │   ├── specs/                      # Test spec files
│   │   ├── test-data/                  # E2E test data
│   │   └── utils/                      # E2E test utilities
│   └── public/
│       ├── locales/                    # i18n translation JSON files
│       │   ├── en/
│       │   ├── pl/
│       │   └── es/
│       └── images/
├── server/                             # Azure Static Web Apps server config
│   └── functions/
│       └── lib/                        # Server-side types/config (minimal)
│           ├── config/
│           ├── middleware/
│           ├── routes/
│           ├── services/
│           └── types/
├── shared/                             # Shared types between client and server
├── scripts/                            # Build scripts (security audit, log check, pre-build)
├── attached_assets/                    # Static assets (accessed via @assets alias)
├── .planning/                          # Planning and analysis documents
│   └── codebase/                       # Codebase mapping documents
├── dist/                               # Build output (generated, not committed)
│   └── public/
├── archive/                            # Archived refactor documentation
├── claudedocs/                         # Claude-generated documentation
└── enhancements/                       # Enhancement planning documents
```

## Directory Purposes

**`client/src/components/`:**
- Purpose: All React UI components
- Contains: Domain-specific panels, page layout components, modal dialogs
- Key files:
  - `client/src/components/HomePage.tsx` - Main page orchestrator; owns calculation state
  - `client/src/components/LoanInputForm.tsx` - Primary user input form
  - `client/src/components/LoanSummary.tsx` - Summary statistics display
  - `client/src/components/ChartSection.tsx` - Recharts visualizations
  - `client/src/components/AmortizationSchedule.tsx` - Payment schedule table
  - `client/src/components/OverpaymentOptimizationPanel.tsx` - Optimization UI
  - `client/src/components/DataTransferPanel.tsx` - Import/export UI
  - `client/src/components/ScenarioComparison.tsx` - Multi-scenario comparison
  - `client/src/components/LoadModal.tsx` - Saved calculations loader
  - `client/src/components/LanguageSwitcher.tsx` - i18n language selector
  - `client/src/components/Navigation.tsx` - Top navigation bar
  - `client/src/components/SEOHead.tsx` - Page-level SEO meta tags
  - `client/src/components/EducationalPanel.tsx` - Glossary and concept explanations
  - `client/src/components/TutorialOverlay.tsx` - react-joyride tutorial wrapper
  - `client/src/components/ExperienceLevelAssessment.tsx` - User skill level onboarding

**`client/src/components/mortgage-calculator/`:**
- Purpose: Reusable mortgage-domain sub-components
- Key files:
  - `client/src/components/mortgage-calculator/calculator-form.tsx`
  - `client/src/components/mortgage-calculator/payment-summary.tsx`
  - `client/src/components/mortgage-calculator/amortization-schedule.tsx`
  - `client/src/components/mortgage-calculator/visualization.tsx`
  - `client/src/components/mortgage-calculator/saved-calculations-modal.tsx`

**`client/src/components/ui/`:**
- Purpose: shadcn/ui component library primitives (Radix UI based)
- Contains: Accordion, Button, Card, Chart, Dialog, Input, Select, Table, Toast, etc.
- Key files:
  - `client/src/components/ui/Clippy.tsx` - Custom assistant/helper UI widget
  - `client/src/components/ui/currency-selector/` - Currency selection component
  - `client/src/components/ui/footer.tsx` - App footer

**`client/src/hooks/`:**
- Purpose: Custom React hooks
- Key files:
  - `client/src/hooks/use-mobile.tsx` - Mobile breakpoint detection
  - `client/src/hooks/use-toast.ts` - Toast notification hook
  - `client/src/hooks/use-comparison.ts` - Scenario comparison state hook

**`client/src/lib/`:**
- Purpose: Core business logic, calculation engines, utilities, and service layer
- Key files:
  - `client/src/lib/types.ts` - All TypeScript interfaces and type definitions
  - `client/src/lib/calculationCore.ts` - Lowest-level shared math (`roundToCents`, `calculateBaseMonthlyPayment`, `convertScheduleFormat`)
  - `client/src/lib/calculationEngine.ts` - Main calculation orchestrator
  - `client/src/lib/overpaymentCalculator.ts` - All overpayment logic
  - `client/src/lib/optimizationEngine.ts` - Overpayment strategy optimization
  - `client/src/lib/comparisonEngine.ts` - Multi-scenario comparison calculations
  - `client/src/lib/formatters.ts` - Currency, date, rate, schedule formatting
  - `client/src/lib/validation.ts` - Input validation
  - `client/src/lib/dataTransferEngine.ts` - CSV export and data import
  - `client/src/lib/educationalContent.ts` - Glossary terms and concept data
  - `client/src/lib/languageUtils.ts` - Language validation utilities
  - `client/src/lib/storage.ts` - localStorage CRUD for `LoanDetails`
  - `client/src/lib/storageService.ts` - Higher-level localStorage with `SavedCalculation` wrapping
  - `client/src/lib/queryClient.ts` - React Query client configuration
  - `client/src/lib/utils.ts` - General utility functions
  - `client/src/lib/testCaseValues.ts` - Standard test inputs for unit tests

**`client/src/lib/services/`:**
- Purpose: Service layer - UI-facing API wrapper over calculation engines
- Key files:
  - `client/src/lib/services/calculationService.ts` - Primary service (singleton `calculationService`)
  - `client/src/lib/services/comparisonService.ts` - Comparison service wrapper

**`client/src/lib/tutorial/`:**
- Purpose: Tutorial system configuration and state management
- Key files:
  - `client/src/lib/tutorial/tutorialState.ts` - Zustand store with persist middleware
  - `client/src/lib/tutorial/tutorialSteps.ts` - Main tutorial step definitions
  - `client/src/lib/tutorial/beginnerTutorialSteps.ts` - Beginner-level steps
  - `client/src/lib/tutorial/joyrideConfig.ts` - react-joyride configuration
  - `client/src/lib/tutorial/analytics.ts` - Tutorial analytics tracking

**`client/src/lib/comprehensive-tests/`:**
- Purpose: Detailed calculation accuracy test suites
- Key files:
  - `client/src/lib/comprehensive-tests/amortization-validation.test.ts`
  - `client/src/lib/comprehensive-tests/additional-costs.test.ts`
  - `client/src/lib/comprehensive-tests/overpayment-*.test.ts`
  - `client/src/lib/comprehensive-tests/interest-rate-changes.test.ts`
  - `client/src/lib/comprehensive-tests/edge-cases.test.ts`

**`client/src/pages/`:**
- Purpose: Top-level route page components
- Key files:
  - `client/src/pages/About.tsx` - About page
  - `client/src/pages/Education.tsx` - Educational content page
  - `client/src/pages/not-found.tsx` - 404 fallback

**`client/src/plugins/`:**
- Purpose: Custom Vite build plugins
- Key files:
  - `client/src/plugins/removeConsole.ts` - Strips `console.*` calls from production builds

**`client/src/test-utils/`:**
- Purpose: Shared test infrastructure
- Key files:
  - `client/src/test-utils/test-data.ts` - Standard test cases
  - `client/src/test-utils/helpers.ts` - Test helper functions
  - `client/src/test-utils/mocks.ts` - Mock implementations

**`client/e2e-tests/`:**
- Purpose: End-to-end Puppeteer test suite
- Key files:
  - `client/e2e-tests/page-objects/LoanForm.ts` - Page object for loan form
  - `client/e2e-tests/page-objects/LoanSummary.ts` - Page object for summary
  - `client/e2e-tests/specs/*.spec.ts` - Test specifications

**`client/public/locales/`:**
- Purpose: i18n translation files loaded at runtime via HTTP backend
- Structure: `{lang}/translation.json` for each supported language (en, pl, es)

**`scripts/`:**
- Purpose: Pre-build and CI validation scripts
- Key files:
  - `scripts/security-audit.js` - Dependency vulnerability audit
  - `scripts/check-console-logs.js` - Detect stray console.logs
  - `scripts/pre-build-checks.js` - Combined pre-build validation

**`shared/`:**
- Purpose: Types or utilities shared between client and server

**`server/`:**
- Purpose: Azure Static Web Apps server-side configuration and functions
- Note: App is described as 100% client-side; server directory contains minimal infrastructure (middleware, config, route definitions)

## Key File Locations

**Entry Points:**
- `client/index.html` - HTML shell (Vite root is `client/`)
- `client/src/main.tsx` (inferred) - React app mount
- `client/src/components/HomePage.tsx` - Main page, owns all calculation state

**Configuration:**
- `vite.config.ts` - Vite build config, path aliases, plugins
- `tsconfig.json` - TypeScript config with path aliases
- `jest.config.cjs` - Jest unit test configuration
- `jest.setup.cjs` - Jest setup file
- `tailwind.config.ts` - Tailwind CSS configuration
- `components.json` - shadcn/ui component config
- `staticwebapp.config.json` - Azure Static Web Apps routing config
- `azure.config.json` - Azure deployment configuration
- `postcss.config.js` - PostCSS configuration

**Core Logic:**
- `client/src/lib/types.ts` - All type definitions (start here)
- `client/src/lib/calculationCore.ts` - Fundamental math primitives
- `client/src/lib/calculationEngine.ts` - Main orchestrator
- `client/src/lib/services/calculationService.ts` - UI-facing service singleton

**Testing:**
- `client/src/lib/comprehensive-tests/` - Detailed calculation tests
- `client/src/test-utils/` - Shared test infrastructure
- `client/e2e-tests/` - E2E Puppeteer tests

## Naming Conventions

**Files:**
- React components: PascalCase (e.g., `LoanInputForm.tsx`, `ChartSection.tsx`)
- Utility modules: camelCase (e.g., `calculationEngine.ts`, `formatters.ts`)
- shadcn/ui primitives: kebab-case (e.g., `button.tsx`, `card.tsx`, `dialog.tsx`)
- Test files: `*.test.ts` or `*.test.tsx` co-located with source or in `comprehensive-tests/`
- E2E specs: `*.spec.ts` in `client/e2e-tests/specs/`
- Disabled tests: `*.test.tsx.todo` suffix

**Directories:**
- Feature directories: camelCase for lib modules (e.g., `tutorial/`, `services/`)
- Component subdirectories: kebab-case (e.g., `mortgage-calculator/`, `currency-selector/`)

## Where to Add New Code

**New Calculation Logic:**
- Core math used by multiple modules: `client/src/lib/calculationCore.ts`
- Orchestration/repayment model logic: `client/src/lib/calculationEngine.ts`
- Overpayment-specific logic: `client/src/lib/overpaymentCalculator.ts`
- Expose to UI via: `client/src/lib/services/calculationService.ts`
- Type definitions: `client/src/lib/types.ts`
- Tests: `client/src/lib/comprehensive-tests/` (new `*.test.ts` file)

**New UI Component:**
- Domain components: `client/src/components/` (PascalCase `.tsx`)
- Reusable mortgage sub-components: `client/src/components/mortgage-calculator/` (kebab-case `.tsx`)
- UI primitives: `client/src/components/ui/` (kebab-case `.tsx`)
- Component tests: co-locate as `ComponentName.test.tsx`

**New Page:**
- Add to: `client/src/pages/` (PascalCase `.tsx`)
- Wire up routing in app entry point

**New Hook:**
- Add to: `client/src/hooks/` (camelCase, prefix with `use-`)

**New Formatter:**
- Add to: `client/src/lib/formatters.ts`

**New Validation:**
- Add to: `client/src/lib/validation.ts`

**New i18n Strings:**
- Add to: `client/public/locales/{en,pl,es}/translation.json` for all supported languages

**Utilities:**
- General: `client/src/lib/utils.ts`
- Test helpers: `client/src/test-utils/helpers.ts`
- Test data: `client/src/test-utils/test-data.ts` and `client/src/lib/testCaseValues.ts`

## Special Directories

**`dist/public/`:**
- Purpose: Production build output
- Generated: Yes
- Committed: No

**`.planning/codebase/`:**
- Purpose: Codebase mapping documents for AI-assisted development
- Generated: Yes (by mapping agents)
- Committed: No (in `.gitignore` or tracked separately)

**`archive/`:**
- Purpose: Archived refactor documentation and migration plans
- Generated: No
- Committed: Yes

**`client/e2e-tests/screenshots/`:**
- Purpose: E2E test screenshots (baseline and diff images)
- Generated: Yes (by Puppeteer tests)
- Committed: Baselines yes, diffs no

**`client/client/`:**
- Purpose: Appears to be an accidental nested directory from a misplaced E2E test run
- Note: Contains `client/client/e2e-tests/` — likely artifact, not intentional

---

*Structure analysis: 2026-02-17*
