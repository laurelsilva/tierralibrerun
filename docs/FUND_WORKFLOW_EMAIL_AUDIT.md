# Fund Workflow + Athlete Email Audit

Date: March 25, 2026

## Scope

This audit covers the live Athlete Fund admin workflow, the individual application detail view, and the athlete emails that can be sent from the current codebase.

Files audited:

- `src/app/admin/fund-applications/page.tsx`
- `src/app/admin/applications/[id]/page.tsx`
- `src/components/admin/workflow-action-panel.tsx`
- `src/components/admin/email-sender.tsx`
- `src/server/actions/workflow.ts`
- `src/server/workflow/service.ts`
- `src/app/fund/apply/actions.ts`
- `src/server/actions/admin.ts`
- `src/lib/email/orchestrator.ts`
- `src/lib/services/resend.ts`
- `src/server/admin/service.ts`
- `src/lib/types/workflow.ts`

## What Was No Longer Serving The Live System

Removed:

- Legacy fund transition action in `src/server/actions/workflow.ts`.
  - The fund admin UI now uses `runFundAdminAction`, not raw fund stage posts.
- Legacy fund and mentor status email actions in `src/server/actions/admin.ts`.
  - Nothing in the live admin UI called them.
- Unused email preset CRUD in `src/server/actions/admin.ts`.
  - The current email dialog does not load or save presets.
- Unused orchestrated wrapper action in `src/server/actions/admin.ts`.
  - The live email dialog calls `src/app/admin/emails/actions.ts` directly.
- Legacy HTML template system in `src/lib/emails/templates.ts`.
  - The live app sends through `src/lib/email/orchestrator.ts`, not the old template file.
- Old Resend helper methods for fund and mentor status emails in `src/lib/services/resend.ts`.
  - After the legacy actions were removed, those wrappers were dead.
- Unused fund queue enums and labels in `src/lib/types/workflow.ts`.
- Unused fund counts helper in `src/server/admin/service.ts`.

Trimmed:

- `getFundWorkflowContext()` no longer loads raw fund tasks or stage transition lists.
  - The fund detail page does not use them anymore.
- `EmailSender` no longer lets admins switch the program manually on an individual application.
  - An individual application email should stay tied to that application.

## Individual Application Audit

### Queue View

`src/app/admin/fund-applications/page.tsx`

- The queue now reflects the real working buckets:
  - `Needs Review`
  - `Awaiting Athlete Confirmation`
  - `Ready for Registration`
  - `Active Athletes`
  - `Archived Athletes`
  - `Rejected Athletes`
- `WAITLISTED` stays in `Needs Review`.
- Approved `CLOSED` records land in `Archived Athletes`.
- Non-approved `CLOSED` records land in `Rejected Athletes`.
- Pagination is removed.
- Nested dropdowns are removed.
- Needs-review grouping by race is removed.

### Individual Detail View

`src/app/admin/applications/[id]/page.tsx`

- The header now shows:
  - admin status
  - registration status
- The checklist now reflects the real operator flow instead of raw workflow tasks:
  - review
  - athlete confirms
  - register athlete
  - mark active
  - archive after race
- The workflow panel now exposes admin actions that map to real work, not database stage jargon.
- Race date and location now prefer the snapshot stored on the application record.

### Workflow Write Path

`src/server/actions/workflow.ts`

- Fund writes now flow through a single admin action entry point: `runFundAdminAction`.
- That prevents the UI from drifting between:
  - simplified admin actions
  - raw stage transitions

## Athlete Email Audit

### Automatic Emails

Automatic fund emails still send only for three transitions in `src/server/workflow/service.ts`:

- `AWAITING_CONFIRMATION`
  - Sends the approval/confirmation-request email.
- `WAITLISTED`
  - Sends the hold/reapply email.
- `DECLINED`
  - Sends the rejection email.

This matches the actual workflow. These are the only places where a standardized automatic athlete email is clearly required by the current system.

### Manual Emails From The Individual Application Page

`src/components/admin/email-sender.tsx`

The email dialog is now stage-aware for fund applications.

Current fund email options:

- `AWAITING_CONFIRMATION`
  - `Confirmation Request`
- `WAITLISTED`
  - `Hold / Reapply Update`
- `DECLINED` or rejected `CLOSED`
  - `Not Moving Forward`
- `CONFIRMED`, `REGISTRATION_IN_PROGRESS`
  - `Registration In Progress`
- `REGISTERED`, `ONBOARDING_IN_PROGRESS`, `ACTIVE_IN_PROGRAM`
  - `Registered + Community Handoff`
- `NO_LONGER_ACTIVE`, approved `CLOSED`
  - `Post-Race Closeout`
- `NO_SHOW_OR_DROPPED`
  - `Closeout After Withdrawal`

No email button is shown for:

- `SUBMITTED`
- `IN_REVIEW`

That is intentional. The admin should decide first before emailing.

### What The Fund Email Dialog No Longer Does

- It no longer lets admins choose a different program from inside an individual application.
- It no longer presents raw `APPROVED / WAITLISTED / REJECTED` as the main mental model for fund lifecycle emails.
- It no longer exposes email choices that do not fit the athlete’s current workflow stage.

### Remaining Manual Reality

The system still relies on human operations for:

- actual UltraSignup registration
- Slack invite sending
- mentor handoff coordination

The code now reflects that reality more honestly:

- automatic email only where the workflow is standardized
- manual stage-aware email where the workflow is still operational and human-run

## Data Integrity Audit

Confirmed in the current system:

- application submissions now snapshot `raceDate` and `raceLocation`
- legacy null `race_date` rows were backfilled in PlanetScale
- stale active or pre-race applications with past race dates were closed out

This matters because old fund email and admin views were previously forced to infer race data from live Sanity race documents, which breaks once old races are deleted.

## Remaining Known Gaps

These are real workflow gaps, not dead-code leftovers:

- There is still no direct UltraSignup integration.
- There is still no first-class “Slack invite sent” field.
- There is still no first-class “mentor handoff complete” field.
- Post-registration emails are still manual operator sends, not automatic workflow emails.

Those are product gaps. They should not be solved by reintroducing old code paths.
