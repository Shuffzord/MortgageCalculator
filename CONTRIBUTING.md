# Contributing to Smarter Loan – Mortgage Calculator

Thanks for your interest in contributing! This project began as an experiment in “vibe coding/vibe engineering” with AI assistance. It works, but some parts are intentionally rough or obsolete. We’re keeping it as a sandbox for AI tooling and rapid iteration — and we’d love your help to make it better.

## Ways to Contribute

- Fix bugs and improve UX/accessibility
- Refactor or remove obsolete/unoptimized code (see issues labeled "refactor"/"tech-debt")
- Add features or quality-of-life improvements
- Improve documentation and examples
- Add or improve translations (Chinese especially welcome)
- Expand unit/E2E tests and validation

## Ground Rules

- Follow our Code of Conduct (see CODE_OF_CONDUCT.md)
- Keep PRs focused and reasonably small
- Explain the “why” in your PR description
- Include tests (or rationale if tests are not relevant)
- Prefer clarity over cleverness; add comments where intent isn’t obvious

## Local Development

Prerequisites

- Node.js 18+ and npm

Setup

1. Fork and clone the repo
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`
4. Run tests before opening a PR:
   - Unit: `npm test`
   - E2E: `npm run test:e2e`
   - Translations check: `npm run check:translations`

Useful scripts

- `npm run dev` – Vite dev server
- `npm run build` – type-check and build
- `npm test` – unit tests
- `npm run test:e2e` – Puppeteer end-to-end tests
- `npm run check:translations` – i18n validation
- `npm run security-audit` – dependency audit

## AI-Assisted Contributions

AI assistance is welcome. Please:

- Verify and test AI-generated code yourself
- Keep changes minimal and understandable
- Note in the PR if AI tools were used and how
- Avoid introducing unused abstractions or speculative code

## Translations

We’d love help with translations — especially Chinese — but any language is appreciated.

1. Create a new folder: `client/public/locales/<lang>/`
2. Add `translation.json` with the same keys as English
3. Update language lists:
   - `client/src/lib/languageUtils.ts` `SUPPORTED_LANGUAGES`
   - `scripts/translation-validator.js` `SUPPORTED_LANGUAGES`
4. Run `npm run check:translations` and fix any reported issues

Notes

- Prefer simple language codes (e.g., `zh`) consistent across code and URLs
- Keep placeholders (e.g., `{{value}}`) identical to English keys

## Pull Requests

- Create a feature branch: `git checkout -b feat/short-name`
- Keep commits focused; squash if noisy or exploratory
- Ensure CI scripts pass locally (`npm test`, `npm run check:translations`)
- Add screenshots/GIFs for UI changes if helpful
- Link related issues and describe testing performed

## Coding Guidelines

- Use TypeScript where possible; keep types accurate
- Prefer functional React components and hooks
- Keep state co-located or use existing stores consistently
- Avoid adding `console.log` in committed code
- Keep components small; extract helpers where it improves clarity

## Reporting Issues

Please include:

- What you expected vs. what happened
- Steps to reproduce, environment (OS/Browser/Node) and logs
- Screenshots for UI issues

Thank you for helping improve this project!

