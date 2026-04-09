# Application Workflow (Fund + Mentor)

This is the operational guide for the new workflow.

## 1) Big Picture

The fund workflow is now split into:

- Intake: submitted + review decisions
- Delivery: confirmation + registration + onboarding
- Outcomes: archived completion, withdrawal, or rejection

The key principle:
- `APPROVED` is not the finish line
- The lifecycle is only complete after race outcome is recorded

## 2) Fund Workflow Stages

### Intake
- `SUBMITTED`: Athlete applied.
- `IN_REVIEW`: Admin team reviewing.
- `WAITLISTED`: On hold.
- `DECLINED`: Not selected.

### Delivery
- `AWAITING_CONFIRMATION`: Offer sent, waiting for athlete confirmation.
- `CONFIRMED`: Athlete confirmed they can attend.
- `REGISTRATION_IN_PROGRESS`: Admin is registering athlete.
- `REGISTERED`: Registration completed.
- `ONBOARDING_IN_PROGRESS`: Slack/community/mentor onboarding underway.
- `ACTIVE_IN_PROGRAM`: Athlete is active and race has not happened yet.

### Outcomes
- `NO_LONGER_ACTIVE`: Race cycle completed. Athlete is no longer active for this cycle.
- `NO_SHOW_OR_DROPPED`: Athlete was registered but did not start or withdrew before race day.
- `CLOSED`: Archived lifecycle.

## 2.1) Operations View

The admin team should not manage the fund through every individual stage.
For daily operations, use these buckets:

- `Needs Review`
  - `SUBMITTED`, `IN_REVIEW`, `WAITLISTED`
- `Awaiting Athlete Confirmation`
  - `AWAITING_CONFIRMATION`
- `Ready for Registration`
  - `CONFIRMED`, `REGISTRATION_IN_PROGRESS`
- `Active Athletes`
  - `REGISTERED`, `ONBOARDING_IN_PROGRESS`, `ACTIVE_IN_PROGRAM`
- `Archived Athletes`
  - `NO_LONGER_ACTIVE`, `NO_SHOW_OR_DROPPED`, approved `CLOSED` records
- `Rejected Athletes`
  - `DECLINED`, non-approved `CLOSED` records

Detailed stages still matter for history, timestamps, and auditability.
Buckets are the simpler layer the admin team should look at first.
Deleted applications are removed entirely and do not belong to any bucket.

## 3) Why Two Different Outcome Stages

- `NO_LONGER_ACTIVE` means success path reached race completion and the athlete aged out of active status.
- `NO_SHOW_OR_DROPPED` means registration happened, but they did not start/complete the race lifecycle.

These must stay separate for reporting, fairness, and operational learning.

## 4) Mentor Workflow (Short Version)

- `SUBMITTED` -> `IN_REVIEW` -> `APPROVED_POOL` -> `MATCH_PENDING` -> `MATCHED` -> `ACTIVE`
- Terminal outcomes: `WAITLISTED`, `DECLINED`, `CLOSED`

## 5) Admin Pages and What They Are For

- `/admin/fund-applications`
  - Main operations queue for reviewing and processing applications.
  - Includes reviewed sections for waiting on athlete, registration, active, archived, and rejected buckets.

- `/admin/fund-athletes/active`
  - Dedicated active-athlete board.
  - Shows athletes in `REGISTERED`, `ONBOARDING_IN_PROGRESS`, `ACTIVE_IN_PROGRAM`.
  - Grouped by race series (example: all athletes going to the same race event).

- `/admin/emails/broadcast`
  - Lifecycle-aware cohorts for messaging:
  - `Active Athletes`
  - `Active by Race Series`
  - `No Longer Active`
  - `No Show / Dropped`
  - Plus existing mentor/newsletter cohorts.
  - Legacy "past/upcoming" athlete tabs have been removed to reduce ambiguity.

- `/admin/applications/[id]`
  - Single-application command center.
  - Uses simplified admin actions instead of raw transition lists.
  - Uses a simple admin checklist instead of exposing internal workflow tasks.

## 6) Standard Operating Flow (Fund)

1. Review application.
2. Move to `AWAITING_CONFIRMATION` when approved.
3. Athlete confirms (`CONFIRMED`).
4. Register athlete (`REGISTRATION_IN_PROGRESS` -> `REGISTERED`).
5. Onboard athlete (`ONBOARDING_IN_PROGRESS` -> `ACTIVE_IN_PROGRAM`).
6. After race:
   - Use `NO_LONGER_ACTIVE` for completed race cycle.
   - Use `NO_SHOW_OR_DROPPED` if they were registered but didn’t start / dropped pre-race.

## 7) Notes for Data Consistency

- Snapshot `raceDate` and `raceLocation` onto the application record when the athlete applies or when the race is updated.
- Active views depend on the stored `raceDate`, not just the current Sanity race listing.
- Applications in active stages automatically move to `NO_LONGER_ACTIVE` when their stored race date is in the past.
- Prefer workflow actions over direct status edits to preserve event/task history.

## 8) Athlete Email Rules

- `SUBMITTED`, `IN_REVIEW`
  - No athlete email action is shown from the detail page. Review happens first.
- `AWAITING_CONFIRMATION`
  - Standard approval email is the canonical confirmation-request email.
- `WAITLISTED`
  - Standard waitlist email explains this race is not moving forward and encourages another application.
- `DECLINED`
  - Standard rejection email is the canonical decline email.
- `CONFIRMED`, `REGISTRATION_IN_PROGRESS`
  - Fund detail page offers a stage-specific "registration in progress" email preset.
- `REGISTERED`, `ONBOARDING_IN_PROGRESS`, `ACTIVE_IN_PROGRAM`
  - Fund detail page offers a stage-specific "registered + community handoff" email preset.
- `NO_LONGER_ACTIVE`, approved `CLOSED`
  - Fund detail page offers a post-race closeout email preset.
- `NO_SHOW_OR_DROPPED`
  - Fund detail page offers a withdrawal closeout preset.
