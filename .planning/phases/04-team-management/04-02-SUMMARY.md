---
phase: 04-team-management
plan: 02
subsystem: auth
tags: [better-auth, convex, invitation, email, multi-tenant]

# Dependency graph
requires:
  - phase: 02-organization-bridge
    provides: organizationLinks bridge table, getBetterAuthOrgFromEntity helper
provides:
  - Invitation mutations for generators, haulers, and treaters
  - Org-type URL routing for invitation emails
affects: [04-03-invitation-acceptance, phase-5-rbac]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "auth.api.createInvitation pattern for Better Auth invitations"
    - "Org-type URL routing via GENERATOR_APP_URL, TRUCKING_APP_URL env vars"

key-files:
  created:
    - packages/convex/convex/teams/mutations.ts
    - packages/convex/convex/teams/index.ts
  modified:
    - packages/convex/convex/auth.ts

key-decisions:
  - "Route invitation URLs to app-specific URLs based on organizationType metadata"
  - "Use environment variables for production app URLs with localhost fallbacks"
  - "Mutations return invitation metadata including entity name for UI confirmation"

patterns-established:
  - "Teams invitation pattern: inviteToGenerator, inviteToHauler, inviteToTreater mutations"
  - "Org-type URL routing in sendInvitationEmail callback"

# Metrics
duration: 3min
completed: 2026-01-22
---

# Phase 4 Plan 2: Invitation Mutations Summary

**Better Auth invitation mutations with org-type URL routing for generator, hauler, and treater organizations**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-21T23:31:16Z
- **Completed:** 2026-01-21T23:33:46Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Updated sendInvitationEmail callback to route invitation URLs to correct app based on organization type
- Created inviteToGenerator, inviteToHauler, and inviteToTreater mutations in new teams module
- Mutations use Better Auth's auth.api.createInvitation which triggers email callback

## Task Commits

Each task was committed atomically:

1. **Task 1: Update sendInvitationEmail callback for org-type URL routing** - `ec21502` (feat)
2. **Task 2: Create invitation mutations for generators and haulers** - `436d9c9` (feat)

## Files Created/Modified
- `packages/convex/convex/auth.ts` - Added org-type URL routing in sendInvitationEmail callback
- `packages/convex/convex/teams/mutations.ts` - Invitation mutations using Better Auth API
- `packages/convex/convex/teams/index.ts` - Barrel export for teams module

## Decisions Made
- Route invitation URLs based on organizationType in org metadata:
  - generator -> GENERATOR_APP_URL (localhost:3001)
  - hauler -> TRUCKING_APP_URL (localhost:3003)
  - treater -> siteUrl (localhost:3002)
- Use environment variables for production URLs with localhost fallbacks for development
- Mutations verify entity exists before creating invitation
- Return invitation metadata including entity name for UI feedback

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - TypeScript compilation passed (pre-existing errors in communications module are a known issue documented in STATE.md).

## User Setup Required

For production deployment, add environment variables:
- `GENERATOR_APP_URL` - Production URL for generator app (e.g., https://generator.hwm.app)
- `TRUCKING_APP_URL` - Production URL for trucking app (e.g., https://trucking.hwm.app)

For local development, the localhost defaults work without configuration.

## Next Phase Readiness
- Invitation mutations ready for UI integration
- Next plan (04-03) can implement invitation acceptance route
- sendInvitationEmail callback properly routes to correct app

---
*Phase: 04-team-management*
*Completed: 2026-01-22*
