# Technology Stack

**Analysis Date:** 2026-02-17

## Languages

**Primary:**
- TypeScript 5.6.3 - All source code in `client/src/`, `shared/`, `server/`
- TSX - React components throughout `client/src/components/` and `client/src/pages/`

**Secondary:**
- JavaScript (CJS) - Config files only: `jest.config.cjs`, `jest.setup.cjs`, `postcss.config.js`
- CSS - `client/src/index.css` (Tailwind base styles)

## Runtime

**Environment:**
- Node.js v24.12.0

**Package Manager:**
- npm 11.6.2
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- React 18.3.1 - UI framework, all components in `client/src/components/`
- Vite 6.3.5 - Build tool and dev server, configured in `vite.config.ts`

**Routing:**
- wouter 3.3.5 - Client-side routing with language-prefixed paths (`/en/`, `/pl/`, `/es/`)

**State Management:**
- Zustand 5.0.5 - Specific state stores (check `client/src/` for store files)
- React Context API - Primary state management for calculation state
- @tanstack/react-query 5.60.5 - Server state, configured in `client/src/lib/queryClient.ts`

**Forms:**
- react-hook-form 7.55.0 - Form state management
- @hookform/resolvers 3.10.0 - Zod schema integration with forms
- zod 3.24.3 - Schema validation and type inference
- zod-validation-error 3.4.0 - Human-readable validation messages

**UI/Styling:**
- Tailwind CSS 3.4.17 - Utility-first CSS, config in `tailwind.config.ts`
- shadcn/ui - Component library built on Radix UI primitives (all components in `client/src/components/ui/`)
- Radix UI - Headless UI primitives (accordion, dialog, dropdown, select, tabs, toast, etc.)
- next-themes 0.4.6 - Dark/light theme switching
- framer-motion 11.13.1 - Animations
- lucide-react 0.453.0 - Icon library
- react-icons 5.4.0 - Additional icons
- class-variance-authority 0.7.1 - Component variant styling
- clsx 2.1.1 - Conditional class names
- tailwind-merge 2.6.0 - Tailwind class conflict resolution
- tailwindcss-animate 1.0.7 - Animation utilities
- tw-animate-css 1.2.5 - CSS animation utilities

**Charts:**
- recharts 2.15.2 - Primary charting library in `client/src/components/`
- chart.js 4.4.9 - Secondary charting library

**Date Handling:**
- date-fns 3.6.0 - Date calculations used throughout `client/src/lib/`
- react-day-picker 8.10.1 - Date picker UI component

**Internationalization:**
- i18next 25.0.1 - Core i18n framework, configured in `client/src/i18n.ts`
- react-i18next 15.5.1 - React integration
- i18next-browser-languagedetector 8.0.5 - Auto language detection
- i18next-http-backend 3.0.2 - Loads translations from `public/locales/{lng}/translation.json`

**Tutorial:**
- react-joyride 2.9.3 - Interactive tutorial steps, configured in `client/src/lib/tutorial/`

**Testing:**
- Jest 29.7.0 - Unit test runner, config in `jest.config.cjs`
- ts-jest 29.3.2 - TypeScript Jest transformer
- jest-environment-jsdom - Browser-like test environment
- @testing-library/react 16.3.0 - React component testing
- @testing-library/user-event 14.6.1 - User interaction simulation
- @testing-library/jest-dom 6.6.3 - DOM matchers
- puppeteer 24.9.0 - E2E browser automation, tests in `client/e2e-tests/`
- jest-puppeteer 11.0.0 - Jest/Puppeteer integration
- jest-html-reporter 4.1.0 - HTML test reports
- axe-core 4.10.3 - Accessibility testing
- pixelmatch 7.1.0 - Visual regression testing
- pngjs 7.0.0 - PNG image handling for screenshots

**Build/Dev:**
- @vitejs/plugin-react 4.3.2 - React Fast Refresh for Vite
- @replit/vite-plugin-runtime-error-modal 0.0.3 - Dev error overlay
- ts-node 10.9.2 - TypeScript execution for scripts/E2E runner
- postcss 8.4.47 - CSS processing, config in `postcss.config.js`
- autoprefixer 10.4.20 - CSS vendor prefixing
- serve 14.2.4 - Static file serving for production preview

**Other UI:**
- embla-carousel-react 8.6.0 - Carousel component
- cmdk 1.1.1 - Command palette UI
- vaul 1.1.2 - Drawer component
- input-otp 1.4.2 - OTP input
- react-resizable-panels 2.1.7 - Resizable panel layouts

## Key Dependencies

**Critical:**
- `zod` 3.24.3 - Input validation for all calculator inputs, schema in `client/src/lib/validation.ts`
- `date-fns` 3.6.0 - All date-based overpayment calculations in `client/src/lib/calculationEngine.ts`
- `recharts` 2.15.2 - Primary visualization component for amortization schedule charts
- `i18next` 25.0.1 - Full UI internationalization across EN/ES/PL

**Infrastructure:**
- `firebase` 11.7.3 - Present in dependencies but usage limited (see INTEGRATIONS.md)
- `@tanstack/react-query` 5.60.5 - API state management via `client/src/lib/queryClient.ts`

## Configuration

**Environment:**
- `.env` file present - contains environment configuration (contents not read)
- Required vars: `NODE_ENV`, `PORT` (per `azure.config.json`)
- No `.env.example` found

**Build:**
- `vite.config.ts` - Main build configuration, root set to `client/`, output to `dist/public/`
- `tsconfig.json` - TypeScript config with strict mode, path aliases `@/*` and `@shared/*`
- `tailwind.config.ts` - Custom theme with brand colors and animations
- `postcss.config.js` - PostCSS with Tailwind and Autoprefixer
- `jest.config.cjs` - Jest config with jsdom environment, ts-jest transformer
- `staticwebapp.config.json` - Azure Static Web Apps routing, headers, CSP
- `azure.config.json` - Azure deployment settings

**Path Aliases (tsconfig.json + vite.config.ts):**
- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`
- `@assets/*` → `./attached_assets/*`

## Platform Requirements

**Development:**
- Node.js v20+ (Azure config specifies `WEBSITE_NODE_DEFAULT_VERSION: ~20`)
- npm 11+
- Dev server: port 3000 (`vite.config.ts`)

**Production:**
- Azure Static Web Apps (primary deployment target)
- Configured via `staticwebapp.config.json`
- All SPA routes rewrite to `/index.html`
- Assets cached for 1 year, locales cached 1 hour
- Security headers: X-Content-Type-Options, X-Frame-Options DENY, X-XSS-Protection, CSP

---

*Stack analysis: 2026-02-17*
