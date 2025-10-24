# Smarter Loan – Mortgage Calculator

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Status: Experimental Sandbox](https://img.shields.io/badge/Status-Experimental%20Sandbox-yellow)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)
![Vibe Coded](https://img.shields.io/badge/Vibe%20Coded-AI%20Assisted-purple)

A client-side mortgage calculator focused on clear visuals, practical scenarios, and fast iteration. This repository started as an experiment in “vibe coding/vibe engineering” with AI assistance. It works, but it intentionally contains some obsolete or suboptimal code that accumulated during agent-driven exploration. We will keep this project as a sandbox for AI tooling and rapid prototyping.

If you want to contribute: amazing! We’d especially love help adding tools and features that support people learning about mortgages. Translation help is very welcome — especially Chinese — but any language contributions are appreciated.

## Features

- Mortgage payment and amortization schedule
- Principal vs. interest charts and key summaries
- One-time and recurring overpayments with impact visualization
- Multi-language UI (currently English, Spanish, Polish)
- 100% client-side; no personal data is sent to servers

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS + Radix UI
- i18next (client/public/locales)
- Jest + Testing Library + Puppeteer (unit + E2E)

## Getting Started

Prerequisites

- Node.js 18+ and npm

Setup

1. Clone the repo
   `git clone <your-fork-or-repo-url> && cd MortgageCalculator`
2. Install dependencies
   `npm install`
3. Run in dev mode
   `npm run dev`
4. Build and preview
   `npm run build && npm run preview`

Common scripts

- `npm run dev` – start Vite dev server
- `npm run build` – type-check and build for production
- `npm test` – run unit tests
- `npm run test:e2e` – run E2E tests (Puppeteer)
- `npm run check:translations` – validate i18n files
- `npm run security-audit` – quick dependency audit

## Translations

We appreciate any help — especially Chinese. To add or update translations:

- Add a new folder in `client/public/locales/<lang>/translation.json` mirroring the English keys
- Update `client/src/lib/languageUtils.ts` `SUPPORTED_LANGUAGES`
- If needed, update `scripts/translation-validator.js` `SUPPORTED_LANGUAGES`
- Run `npm run check:translations` and fix any reported issues

## Contributing

Please read CONTRIBUTING.md for how to set up, structure PRs, and use AI assistance responsibly. This project welcomes refactors and cleanups — “refactor” and “tech-debt” issues are especially good places to start.

- Code of Conduct: CODE_OF_CONDUCT.md
- Roadmap: ROADMAP.md

## Notes on the Experiment

This repo was created to explore how effective “vibe coding/vibe engineering” can be. The outcome is a working app with places that reflect the iterative, exploratory process (e.g., some dead code, patterns that could be simplified). We keep those around to study and improve AI tooling. PRs that improve clarity, maintainability, testing, and performance are encouraged.

## License

MIT. See the package.json `license` field. If you need an explicit LICENSE file, please open an issue or PR to add one.

## Acknowledgements

- Thanks to everyone exploring AI-assisted development and sharing learnings
- Shout-out to contributors who help with translations and testing
