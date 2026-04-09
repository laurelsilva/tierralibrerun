# Contributing

Thanks for your interest in improving the platform! We welcome issues, pull requests, and documentation updates that make it easier for runners and organizers to participate in the community.

## Ways to contribute

- Report bugs or regressions.
- Suggest new features or improvements that expand access to our programs.
- Improve documentation (README, environment setup, operational playbooks).
- Polish UI accessibility, performance, or visual design.
- Add test coverage for critical user journeys (fund application, events, mentorship).

## Development workflow

1. **Fork and clone** the repository.
2. **Install dependencies** with `pnpm install` (see `package.json` for supported Node.js versions).
3. **Copy environment variables**: duplicate `.env.local.example` into `.env.local` and fill the values (see `docs/ENVIRONMENT.md`).
4. **Run the dev server** with `pnpm dev` and visit `http://localhost:3000`.
5. **Write code** with TypeScript and follow the existing folder conventions (feature-based App Router structure).
6. **Validate locally** via `pnpm precommit` (type-check, lint, format check). Add tests or manual QA notes where relevant.
7. **Open a pull request** summarizing the change, risks, and validation steps. Link to any open issue if applicable.

## Commit conventions

- Keep commits focused and descriptive: e.g., `feat(events): add RSVP question editor`.
- Reference issues in your commit message or pull request description (`Fixes #123`).
- Include before/after screenshots for UI changes when possible.

## Code style & tooling

- **TypeScript everywhere**: no `.js` files for app logic.
- **ESLint + Prettier** enforce formatting (`pnpm lint`, `pnpm format`).
- **Tailwind CSS** provides utility classes; prefer semantic class groups and avoid duplication.
- **shadcn/ui** components live under `src/components/ui`; use existing primitives before adding new UI kits.

## Testing expectations

Automated tests are still being introduced. When adding new features, please include:

- Unit tests for isolated utilities when reasonable.
- Integration or Playwright tests for critical flows (fund/mentor applications, event RSVPs) when feasible.
- Manual QA notes describing how you verified the change (screenshots, screencasts, or command output).

## Reporting security issues

Please do **not** open public issues for vulnerabilities. Email the security contact listed in `SECURITY.md` with details so we can coordinate a fix. See `SECURITY.md` for the full policy.

## Community standards

By participating in this project you agree to uphold the [Code of Conduct](CODE_OF_CONDUCT.md). Thank you for helping keep this project welcoming and inclusive.
