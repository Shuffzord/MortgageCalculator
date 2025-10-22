# Contributing to Smarter Loan

Thanks for your interest in contributing! This guide explains how to set up your environment, propose changes, and get them reviewed.

## Quick Start

1) Install dependencies

```
npm install
```

2) Start the dev server

```
npm run dev
# http://localhost:3000
```

3) Run tests locally

```
npm test              # unit tests
npm run test:e2e      # end-to-end tests (starts dev server automatically)
```

## Development Guidelines

- TypeScript: keep types precise and colocated under `client/src/lib/types.ts` where shared.
- UI: prefer existing components under `client/src/components/` and Tailwind utilities. Keep styles consistent.
- State: use React state/hooks locally; prefer TanStack Query for async server-like data; Zustand is used for the tutorial state only.
- i18n: add keys to `client/public/locales/{en,es,pl}/translation.json` and run the translation validator.
- Accessibility: verify new UI with Testing Library and (when applicable) axe checks.

## Scripts Checklist

Before opening a PR, run:

```
npm run check                 # Type-check
npm run validate              # Security audit + build info
npm test                      # Unit tests
npm run test:e2e              # E2E tests (optional for UI-only fixes)
npm run check:translations    # Verify translation keys
```

## Branch & PR Workflow

- Branch from `main`: `feat/<name>`, `fix/<name>`, or `chore/<name>`
- Keep PRs focused and small; include screenshots for UI changes
- Describe what changed and why; list manual test steps
- Mention if AI assistance was used and how you verified results
- Link related issues and add tests where applicable

## Coding Style

- Follow existing patterns; keep functions small and pure where possible
- Use path alias `@` for `client/src` imports (see `vite.config.ts`)
- Avoid introducing new dependencies without discussion

## Internationalization (i18n)

- Add keys in English first under `client/public/locales/en/translation.json`
- Mirror the keys in `es` and `pl` (temporary English values are OK)
- Validate: `npm run check:translations` or `npm run check:translations:ci`

## Testing

- Unit tests: colocate test files next to code or under `client/src/lib/`
- E2E tests: add specs under `client/e2e-tests/specs/`
- Prefer Testing Library queries by role/text over test IDs

## Security

- Never commit secrets; configuration is via GitHub Action secrets
- Report vulnerabilities by opening a security issue or a private advisory on GitHub

## Communication

Use GitHub issues and pull requests for discussion. Be respectful and collaborative—see our [Code of Conduct](CODE_OF_CONDUCT.md).

