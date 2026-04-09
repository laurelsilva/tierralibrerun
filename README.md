# Trail Running Community Platform

**Open-source infrastructure for trail running communities that fund athletes, match mentors, and organize events.**

Built by [Tierra Libre Run](https://tierralibre.run) — a BIPOC-led community advancing access in trail running.

<img src="https://cdn.sanity.io/images/ql7nlbjf/production/865b1e97b53de5882e5f358f31840a2256767fc1-4464x3058.png?w=1600&h=1096&q=76&fit=max&auto=format" alt="Tierra Libre Run community on the trails" width="100%" />

---

## 🌎 Why this exists

Trail running has a representation problem. Entry fees are expensive. The sport's culture can feel exclusionary. And for many athletes of color, the barrier isn't ability — it's access.

This platform was built to change that. It powers race funding applications, mentor-athlete matching, event coordination, and the administrative workflows that keep a volunteer-run nonprofit operating at scale.

## 🌱 Why we're open-sourcing this

We didn't build this just for us.

Tierra Libre started as a group text and a shared love for trails. The technology came later — out of necessity, because spreadsheets stop working when you're managing dozens of funded athletes, mentor pairings, and community events across a season.

We're releasing this code because we believe other communities shouldn't have to rebuild the same infrastructure from scratch. Whether you're a trail running crew in another city, a climbing collective, a cycling co-op, or a paddling group — if your community funds participation, matches mentors, and organizes events, this platform is built for you.

**Fork it. Make it yours. We'll help where we can.**

The outdoor industry doesn't need more gatekeeping. It needs more communities like yours with the tools to operate at scale without losing the soul of what makes them special.

## 🏔️ What it does

### For athletes
- **Race Funding** — Apply for entry fee support through a guided application. Track your status from submission through registration and race day.
- **Mentorship** — Get paired with an experienced trail runner who matches your goals, communication style, and identity preferences.
- **Events & RSVPs** — Browse community runs, workshops, and social meetups. RSVP with custom questions per event.
- **Onboarding** — Multi-step welcome flow that connects you to Strava, Instagram, and community channels.

### For administrators
- **Application Pipeline** — Review fund and mentor applications through a multi-stage workflow: submitted → in review → confirmed → registered → active.
- **Mentor Pairing Studio** — Match mentors to athletes with notes, lifecycle tracking, and introduction emails.
- **Email System** — Templated and custom email modes with full audit logging, BCC controls, and brand-consistent formatting.
- **User Management** — Role-based access, application history, and fund limit overrides.

### For organizers who fork this
- **Environment-driven branding** — Every brand reference (name, tagline, social links, emails, tax ID) is configured through environment variables. No code changes needed.
- **Sanity CMS** — Races, blog posts, events, and company profiles are managed in Sanity Studio.
- **Production-ready** — Clerk auth, PlanetScale database, Resend email, Vercel deployment. All battle-tested in production.

## ⚙️ Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Server Actions) |
| Language | TypeScript end-to-end |
| Auth | Clerk (JWT, middleware, role metadata) |
| Database | PlanetScale (MySQL) + Drizzle ORM |
| CMS | Sanity + GROQ queries |
| Email | Resend (transactional + newsletter contacts) |
| UI | Tailwind CSS + shadcn/ui + Radix primitives |
| Deployment | Vercel |

## 📂 Project structure

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

## 🚀 Getting started

### Prerequisites

- Node.js 18.18+
- pnpm 8+
- Accounts: [Clerk](https://clerk.com), [PlanetScale](https://planetscale.com), [Sanity](https://sanity.io), [Resend](https://resend.com) (free tiers work)

### Setup

```bash
git clone <your-fork-url>
cd trail-running-community
pnpm install
cp .env.local.example .env.local
```

Fill in `.env.local` using [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) as a guide, then:

```bash
pnpm db:push    # sync database schema
pnpm dev        # start dev server at localhost:3000
```

### Configuring your brand

All branding lives in environment variables. Set these to make the platform yours:

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

See [.env.local.example](.env.local.example) for the full list.

## 🔄 Key workflows

### Fund application lifecycle

```
SUBMITTED → IN_REVIEW → AWAITING_CONFIRMATION → CONFIRMED
→ REGISTRATION_IN_PROGRESS → REGISTERED → ONBOARDING_IN_PROGRESS
→ ACTIVE_IN_PROGRAM → CLOSED
```

Every transition is logged in an immutable audit trail with actor role (system, admin, or athlete), timestamps, and payload.

### Mentor matching

```
SUBMITTED → IN_REVIEW → APPROVED_POOL → MATCH_PENDING → MATCHED → ACTIVE
```

Admins pair mentors with athletes through the pairing studio. Introduction emails are sent automatically.

## 🛠 Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm type-check` | TypeScript validation |
| `pnpm format` | Prettier |
| `pnpm precommit` | Type-check + lint + format |
| `pnpm db:push` | Sync schema to database |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm db:generate` | Generate migration SQL |

## 🤝 Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) for workflow guidance. Uphold the [Code of Conduct](CODE_OF_CONDUCT.md) in all interactions.

Security issues should be reported privately — see [SECURITY.md](SECURITY.md).

## 📄 License

[MIT](LICENSE)
