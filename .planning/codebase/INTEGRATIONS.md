# External Integrations

**Analysis Date:** 2026-02-17

## APIs & External Services

**Analytics:**
- Google Analytics / Google Tag Manager - Referenced in CSP header in `staticwebapp.config.json`
  - Allowed domains: `https://www.googletagmanager.com`, `https://www.google-analytics.com`, `https://ssl.google-analytics.com`, `https://*.doubleclick.net`
  - No SDK found in `client/src/` - likely loaded via script tag in `client/index.html`
  - Auth: Not applicable (public tracking)

**Monetization:**
- Buy Me a Coffee - Referenced in CSP `img-src` in `staticwebapp.config.json`
  - Allowed domain: `https://*.buymeacoffee.com`
  - No SDK in source - likely an embedded widget

**Firebase:**
- Firebase 11.7.3 - Present in `package.json` dependencies
  - SDK: `firebase` npm package
  - No active usage found in `client/src/` (may be planned or unused - see `firebase-implementation-plan.md` in root)
  - Auth: Not configured in detected source files

## Data Storage

**Databases:**
- None - No external database. App is 100% client-side.

**Browser Storage:**
- localStorage - Used for saved calculations
  - Key: `mortgage-calculator-saved` (in `client/src/lib/storage.ts`)
  - Stores: Serialized `LoanDetails[]` array
  - Implementation: `client/src/lib/storage.ts` and `client/src/lib/storageService.ts`
- Cookie - Used by i18next for language preference
  - Key: `i18nextLng` (7-day expiry, configured in `client/src/i18n.ts`)
- localStorage - Used by i18next for language preference
  - Key: `i18nextLng`

**File Storage:**
- None - No cloud file storage

**Caching:**
- None (server-side) - Static assets cached via Azure CDN headers in `staticwebapp.config.json`

## Authentication & Identity

**Auth Provider:**
- None active - App is fully client-side with no authentication
- Firebase Auth package installed but not implemented in detected source files
- `client/src/lib/queryClient.ts` includes 401 handling (returnNull or throw) - likely legacy infrastructure

## Monitoring & Observability

**Error Tracking:**
- None detected - No Sentry, Datadog, or other error tracking SDK

**Logs:**
- Console output stripped in production by custom Vite plugin `removeConsolePlugin()` in `client/src/plugins/removeConsole.ts`
- Dev server logs: Server-side logs at `server/combined.log` and `server/error.log`
- Pre-build log check: `scripts/check-console-logs.js` verifies no console statements in source

## CI/CD & Deployment

**Hosting:**
- Azure Static Web Apps - Primary production hosting
  - Config: `staticwebapp.config.json` - SPA routing, cache headers, security headers
  - Deploy script: `scripts/deploy-to-azure.ps1` (PowerShell)
  - Deploy command: `npm run deploy:azure`
  - Local preview: `npm run deploy:local` (uses Azure Static Web Apps CLI `swa`)

**CI Pipeline:**
- None detected - No GitHub Actions, Azure DevOps, or other CI config files found

**Pre-commit Hooks:**
- `npm run precommit` → runs `npm run validate && npm run test`
- Validation scripts in `scripts/` directory:
  - `scripts/pre-build-checks.js` - General validation
  - `scripts/security-audit.js` - Dependency security audit
  - `scripts/check-console-logs.js` - Console.log detection

## Internationalization Backend

**Translation Loading:**
- i18next HTTP backend - Loads translation files at runtime from the same origin
  - Path pattern: `/locales/{{lng}}/{{ns}}.json`
  - Supported languages: `en`, `es`, `pl`
  - Fallback language: `en`
  - Cache headers: 1 hour for `/locales/*` (per `staticwebapp.config.json`)
  - Config: `client/src/i18n.ts`

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None - All calculations are purely client-side

## Environment Configuration

**Required env vars:**
- `NODE_ENV` - Environment identifier (production/development)
- `PORT` - Server port (default: 8080 in Azure config)
- `WEBSITE_NODE_DEFAULT_VERSION` - Azure Node.js version (`~20`)

**Secrets location:**
- `.env` file present at project root (contents not read)
- No `.env.example` documented

## Network Requests

**Internal:**
- `client/src/lib/queryClient.ts` provides `apiRequest()` utility using native `fetch`
- Credentials included with requests (`credentials: "include"`)
- Currently no known active API endpoints (app is client-side only)

**External (via CSP whitelist):**
- Google Analytics / GTM scripts
- Google Fonts (stylesheet and font files)
- Buy Me a Coffee images
- All other origins blocked by default-src 'self'

---

*Integration audit: 2026-02-17*
