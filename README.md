# Trail Running Community Platform

An open-source application for managing community-led trail running
programs. Powers race funding, mentor matching, and event coordination.

Built by [Tierra Libre Run](https://tierralibre.run) — a BIPOC-led nonprofit
building access to trail running.

<img src="https://cdn.sanity.io/images/ql7nlbjf/production/865b1e97b53de5882e5f358f31840a2256767fc1-4464x3058.png?w=1600&h=1096&q=76&fit=max&auto=format" alt="Tierra Libre Run community on the trails" width="100%" />

---

## What it does

### Athlete features

- **Race funding** — Apply for entry fee assistance. Track application status from submission through registration.
- **Mentorship** — Get paired with a mentor based on preferences and needs.
- **Events** — Browse community runs and events. RSVP with custom event questions.
- **Onboarding** — Guided signup flow with social media and platform integration.

### Admin features

- **Application review** — Multi-stage workflow for fund and mentor applications with audit tracking.
- **Pairing studio** — Match mentors to athletes with automated introduction emails.
- **Email system** — Send templated and custom emails with full logging and brand formatting.
- **User management** — Role-based access control, application history, and funding overrides.

### For forked instances

- **Branding via environment variables** — Configure site name, tagline, social links, email, and tax ID without code changes.
- **Sanity CMS** — Manage races, blog posts, events, and staff profiles in a headless CMS.
- **Production deployment** — Pre-configured for Clerk auth, PlanetScale database, Resend email, and Vercel hosting.

## Tech stack

| Layer      | Technology                                   |
| ---------- | -------------------------------------------- |
| Framework  | Next.js 16 (App Router, Server Actions)      |
| Language   | TypeScript                                   |
| Auth       | Clerk (JWT, middleware, role metadata)       |
| Database   | PlanetScale (MySQL) + Drizzle ORM            |
| CMS        | Sanity + GROQ queries                        |
| Email      | Resend                                       |
| UI         | Tailwind CSS + shadcn/ui + Radix primitives  |
| Deployment | Vercel                                       |

## Project structure

```
├── drizzle/               SQL migrations (Drizzle Kit)
├── sanity/                Sanity Studio config
├── src/
│   ├── app/               Routes, layouts, metadata
│   │   ├── admin/         Operations console
│   │   ├── api/           Webhooks, RSVPs, admin endpoints
│   │   ├── fund/          Athlete fund application flow
│   │   ├── mentor/        Mentor application flow
│   │   ├── events/        Event pages with RSVP
│   │   ├── blog/          Community stories (Sanity-powered)
│   │   ├── dashboard/     Athlete home base
│   │   └── onboarding/    Welcome flow
│   ├── components/        UI primitives + layout
│   ├── lib/               Config, email, metadata, services
│   │   ├── config/site.ts All brand configuration
│   │   └── email/         Orchestrator, templates, brand links
│   └── server/            Auth, database, server actions
└── .env.local.example     Every env var with descriptions
```

## Getting started

### Requirements

- Node.js 18.18+
- pnpm 8+
- Accounts: [Clerk](https://clerk.com), [PlanetScale](https://planetscale.com), [Sanity](https://sanity.io), [Resend](https://resend.com)

### Installation

```bash
git clone <your-fork-url>
cd trail-running-community
pnpm install
cp .env.local.example .env.local
```

Fill in `.env.local` using [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md), then run:

```bash
pnpm db:push    # sync database schema
pnpm dev        # start dev server at localhost:3000
```

### Customize branding

All site branding is configured via environment variables:

```bash
NEXT_PUBLIC_SITE_NAME="Your Community Name"
NEXT_PUBLIC_SITE_TAGLINE="Your tagline here"
NEXT_PUBLIC_CONTACT_EMAIL="hello@yourcommunity.org"
NEXT_PUBLIC_INSTAGRAM_URL="https://instagram.com/yourhandle"
NEXT_PUBLIC_STRAVA_URL="https://strava.com/clubs/yourclub"
NEXT_PUBLIC_DONATION_URL="https://your-donation-page.com"
NEXT_PUBLIC_TAX_ID="12-3456789"
ADMIN_EMAILS="you@example.com"
```

See [.env.local.example](.env.local.example) for all options.

## Application workflows

### Fund application lifecycle

```
SUBMITTED → IN_REVIEW → AWAITING_CONFIRMATION → CONFIRMED
→ REGISTRATION_IN_PROGRESS → REGISTERED → ONBOARDING_IN_PROGRESS
→ ACTIVE_IN_PROGRAM → CLOSED
```

All state transitions are logged with actor, timestamp, and payload.

### Mentor matching

```
SUBMITTED → IN_REVIEW → APPROVED_POOL → MATCH_PENDING → MATCHED → ACTIVE
```

Admins pair mentors to athletes through the pairing studio. Introduction emails are sent automatically.

## npm scripts

| Command            | Purpose                    |
| ------------------ | -------------------------- |
| `pnpm dev`         | Dev server (Turbopack)     |
| `pnpm build`       | Production build           |
| `pnpm lint`        | ESLint                     |
| `pnpm type-check`  | TypeScript validation      |
| `pnpm format`      | Prettier                   |
| `pnpm precommit`   | Type-check + lint + format |
| `pnpm db:push`     | Sync schema to database    |
| `pnpm db:studio`   | Open Drizzle Studio        |
| `pnpm db:generate` | Generate migration SQL     |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for workflow guidelines. All interactions must adhere to the [Code of Conduct](CODE_OF_CONDUCT.md).

Security issues should be reported privately — see [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
