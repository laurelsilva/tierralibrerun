# Admin + Athlete Experience Audit (Post-Refactor)

## Current State

The platform now uses workflow stages as the source of truth for lifecycle state.
Core admin and athlete flows are aligned around:

- Intake (`SUBMITTED`, `IN_REVIEW`, decisions)
- Delivery (`AWAITING_CONFIRMATION` -> `REGISTERED` -> onboarding)
- Outcomes (`NO_LONGER_ACTIVE`, `NO_SHOW_OR_DROPPED`)

## Admin Findings

1. Workflow consistency is now strong in detail pages.
2. Queueing is improved, but the admin area still has multiple pages with different sorting/grouping patterns.
3. Broadcast targeting now supports lifecycle cohorts, which reduces accidental mixed messaging.
4. Remaining complexity is mostly in discoverability, not data model.

## Athlete Findings

1. Athlete dashboard now surfaces workflow state clearly.
2. The biggest athlete friction is uncertainty about "what do I do next?" after each stage.
3. Confirmation and onboarding are still email-heavy; in-product checklist can be stronger.
4. Mentor side is clear but can benefit from same "next action" treatment as fund.

## Recommended Next Phase

1. Add a first-class "Athlete Checklist" card in `/dashboard`:
   - Confirm participation
   - Registration complete
   - Join Slack
   - Intro post done
   - Mentor matched (if requested)
2. Add race timeline context:
   - Days until race
   - Outcome reminder banner when race date passes
3. Add admin "Needs Outcome Update" queue page:
   - Athletes still active with past race date
4. Add structured close reasons:
   - Replace free-text close reason with reason presets + optional notes
5. Add notification center in-app:
   - Mirror major email events in dashboard notification list

## Cleanup Completed In This Phase

1. Removed legacy status-update admin components and actions.
2. Removed legacy bulk status API route.
3. Removed legacy athlete email broadcast tabs (`past/upcoming/by-race`).
4. Removed status fallback logic from dashboard/fund/mentor application views.
5. Converted key admin counts to workflow-stage based queries.
