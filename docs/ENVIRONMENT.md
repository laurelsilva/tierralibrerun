# Environment Setup

Use this guide when configuring local development or a new deployment target.
All configuration values map to entries in `.env.local` (for local work) or your
hosting provider's dashboard (Vercel, Fly, etc.). The runtime schema lives in
`src/lib/env/index.ts` and will throw if required values are missing.

## Required variables

| Group       | Variable                              | Description                                                                   |
| ----------- | ------------------------------------- | ----------------------------------------------------------------------------- |
| Core        | `NODE_ENV`                            | Defaults to `development`. Set to `production` in deployed environments.      |
| Core        | `NEXT_PUBLIC_SITE_URL`                | Fully-qualified URL for canonical links and SEO metadata.                     |
| Core        | `NEXT_PUBLIC_APP_URL`                 | Base URL used by client-side helpers. Usually matches `NEXT_PUBLIC_SITE_URL`. |
| Core        | `GOOGLE_SITE_VERIFICATION`            | Optional code for Google Search Console verification.                         |
| Clerk       | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`   | Front-end key from the Clerk dashboard.                                       |
| Clerk       | `CLERK_SECRET_KEY`                    | Server-side key used by Clerk SDK.                                            |
| Clerk       | `CLERK_WEBHOOK_SECRET`                | Optional secret if you forward Clerk webhooks to `/api/clerk/webhook`.        |
| Clerk       | `NEXT_PUBLIC_CLERK_SIGN_IN_URL`       | Relative path for the sign-in modal. Defaults to `/?auth=sign-in`.            |
| Clerk       | `NEXT_PUBLIC_CLERK_SIGN_UP_URL`       | Relative path for sign-up.                                                    |
| Clerk       | `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Redirect path after sign-in.                                                  |
| Clerk       | `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Redirect path after sign-up.                                                  |
| PlanetScale | `PLANETSCALE_DB_HOST`                 | Hostname from the PlanetScale connection string.                              |
| PlanetScale | `PLANETSCALE_DB_USERNAME`             | Username from PlanetScale credentials.                                        |
| PlanetScale | `PLANETSCALE_DB_PASSWORD`             | Password from PlanetScale credentials.                                        |
| Sanity      | `NEXT_PUBLIC_SANITY_PROJECT_ID`       | Sanity project ID used by the Studio and GROQ queries.                        |
| Sanity      | `NEXT_PUBLIC_SANITY_DATASET`          | Dataset slug (e.g., `production`).                                            |
| Sanity      | `NEXT_PUBLIC_SANITY_API_VERSION`      | API version; defaults to `2025-06-01`.                                        |
| Sanity      | `SANITY_API_TOKEN`                    | Token for server-side Sanity queries (optional if you only read public data). |
| Email       | `RESEND_API_KEY`                      | API key for transactional email.                                              |
| Newsletter  | `RESEND_API_KEY`                      | API key for Resend contacts and email.                                        |

## Local setup checklist

1. Duplicate `.env.local.example` to `.env.local`.
2. Fill each variable using sandbox accounts:
   - **Clerk**: create a development instance and copy both keys. Set Clerk
     fallback redirects to `/dashboard` for sign-in and `/new-user` for sign-up.
     Do not set Clerk `*_FORCE_REDIRECT_URL` values in env for this app. They
     override per-flow destinations like `/fund/apply` and `/mentor/apply`.
   - **PlanetScale**: generate a password for the development branch.
   - **Sanity**: run `pnpm dlx sanity@latest init` or reuse an existing project
     ID/dataset.
   - **Resend**: generate test keys (Resend provides `re_` prefixed test
     tokens).
3. Run `pnpm dev` and verify the site boots without env validation errors.

## Secrets hygiene

- `.env*` files are ignored via `.gitignore`. Do not commit them.
- Rotate credentials if they were ever checked into version control.
- Use your hosting provider's secret management UI (Vercel environment
  variables, etc.) instead of storing values in repo files.

## Production tips

- Set `NEXT_PUBLIC_SITE_URL` to the final domain before enabling indexing.
- Provide unique Resend API keys per environment—production and staging should
  not share credentials.
- Configure Clerk webhook endpoints only after verifying HTTPS certificates.
- Prefer Clerk `*_FALLBACK_REDIRECT_URL` values only in env. Leave
  `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL` and
  `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL` unset so contextual redirects
  during onboarding and application flows keep working.
- The app intentionally uses per-flow Clerk force redirects in code when a user
  opens a sign-in/sign-up modal from a specific journey. That is how a new
  athlete can start on `/fund`, sign up, pass through `/new-user`, and still
  land in onboarding with `/fund/apply` preserved.

If you run into validation failures, inspect the console output from
`src/lib/env/index.ts`—it prints the missing keys to help you correct the
configuration.
