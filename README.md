# Smarter Loan — Mortgage Calculator

![License: MIT](https://img.shields.io/badge/License-MIT-green)
![Status: Active](https://img.shields.io/badge/Status-Active-blue)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

A fast, accessible, and multilingual mortgage calculator that helps you plan a home loan with amortization schedules, overpayment strategies, and clear visualizations.

## Live Site

- https://smarter-loan.com/

The site is deployed via Azure Static Web Apps using GitHub Actions and built from this repository.

## Features

- Amortization schedule with principal/interest breakdown
- One‑time and recurring overpayments with impact preview
- Scenario comparison and overpayment optimization helpers
- Import/export calculations (local JSON), persistent local storage
- Multilingual UI (English, Spanish, Polish) with i18next
- SEO‑friendly routing with language prefixes and sitemap
- Interactive charts (Recharts/Chart.js) and rich UI (Radix UI)
- Guided tutorial and educational content panels

## Technology Stack

- React + TypeScript (Vite)
- Tailwind CSS (+ Radix UI components)
- TanStack Query for async state
- i18next + react‑i18next for localization
- Zustand for tutorial state
- Recharts and Chart.js for data visualization
- Jest + Testing Library for unit tests; Puppeteer/Jest for E2E tests

## License

This project is licensed under the MIT License (see `package.json`).

## Project Structure

```
client/
├─ index.html
├─ public/                # static assets, locales/, sitemap.xml, icons
├─ e2e-tests/             # Puppeteer E2E runner and specs
└─ src/
   ├─ components/         # UI components (calculator, charts, panels)
   ├─ lib/                # calculation engines, formatters, storage, types
   ├─ pages/              # routed pages (about, education, 404)
   ├─ i18n.ts             # i18next initialization
   ├─ index.css           # Tailwind styles
   └─ main.tsx            # app entry

scripts/                  # pre-build checks, security audit, translations
.github/workflows/        # Azure Static Web Apps deployment
vite.config.ts            # Vite config (root = client, port 3000)
staticwebapp.config.json  # SPA routing and caching headers
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Setup

1) Install dependencies

```
npm install
```

2) Start the development server (Vite on port 3000)

```
npm run dev
```

3) Open your browser to `http://localhost:3000`

### Common Scripts

```
# Type-check
npm run check

# Build for production (outputs to dist/public)
npm run build

# Preview the production build
npm run preview

# Validate (security + build info)
npm run validate

# Unit tests
npm test
npm run test:watch
npm run test:failed
npm run test:coverage

# End-to-end tests (starts dev server automatically)
npm run test:e2e
npm run test:e2e:report

# Translation validator
npm run check:translations
npm run check:translations:report
npm run check:translations:ci
```

## Architecture & Internals

Calculation logic lives under `client/src/lib/` and is split into focused modules:

- `calculationCore.ts` — fundamental mortgage math
- `calculationEngine.ts` — amortization and schedule generation
- `overpaymentCalculator.ts` — recurring/one‑off overpayments and impact
- `optimizationEngine.ts` — helpers for optimizing strategies
- `formatters.ts` — currency/number/date formatting
- `types.ts` — shared types

UI components in `client/src/components/` consume these modules and render charts, schedules, and summaries. Routing uses language‑prefixed paths (e.g. `/en/`, `/es/`, `/pl/`) with `wouter`. i18next loads translations from `client/public/locales/{en,es,pl}/translation.json`.

## Testing

Unit tests (Jest) and E2E tests (Puppeteer) are available:

```
# Run unit tests
npm test

# E2E tests (starts dev server automatically)
npm run test:e2e

# Generate E2E HTML report
npm run test:e2e:report
```

## Deployment

- GitHub Actions workflow: `.github/workflows/azure-static-web-apps.yml`
- Vite builds to `dist/public`, deployed to Azure Static Web Apps
- SPA routes and cache headers configured in `staticwebapp.config.json`
- Build metadata injected via `scripts/pre-build-checks.js` → `client/public/build-info.js`

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) and follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Community

Open an issue or pull request to discuss ideas and improvements.

---

Created with ❤️ by Mateusz Wozniak and contributors

