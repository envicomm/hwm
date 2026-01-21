---
phase: 02-organization-bridge
plan: 01
subsystem: database
tags: [convex, schema, better-auth, organization-hierarchy, indexing]

# Dependency graph
requires:
  - phase: 01-core-authentication
    provides: Better Auth integration with Convex
provides:
  - organizationLinks table with parentBetterAuthOrgId for hierarchy tracking
  - users table with betterAuthUserId for Better Auth linking
  - Schema indexes for efficient organization and user lookups
affects: [02-organization-bridge, 03-organization-management, 04-team-management]

# Tech tracking
tech-stack:
  added: []
  patterns: [organization-hierarchy-via-parent-field, optional-fields-for-backward-compatibility]

key-files:
  created: []
  modified:
    - packages/convex/convex/schema/organizationLinks.ts
    - packages/convex/convex/schema/users.ts
    - packages/convex/convex/schema/index.ts

key-decisions:
  - "Use optional parentBetterAuthOrgId to track organization hierarchy without domain table joins"
  - "Use optional betterAuthUserId to support migration and legacy users"
  - "Export organizationType validator for type safety in mutations"

patterns-established:
  - "Organization hierarchy pattern: treaters have undefined parentBetterAuthOrgId, child orgs contain parent's betterAuthOrgId"
  - "Index pattern: every foreign key or lookup field gets a dedicated index"

# Metrics
duration: 4min
completed: 2026-01-21
---

# Phase 02 Plan 01: Schema Bridge Fields Summary

**Added parentBetterAuthOrgId to organizationLinks and betterAuthUserId to users with indexes for organization hierarchy and auth user lookups**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-21T12:18:02Z
- **Completed:** 2026-01-21T12:22:23Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- organizationLinks table now supports hierarchy queries via parentBetterAuthOrgId
- users table can resolve Convex users from Better Auth sessions via betterAuthUserId
- Schema deployed successfully to Convex with new indexes for efficient lookups

## Task Commits

All tasks were committed in a single atomic commit (auto-committed during schema sync):

**Tasks 1-3: Schema bridge fields** - `73b0d72` (fix)
- Added parentBetterAuthOrgId field to organizationLinks
- Added by_parent_org index to organizationLinks
- Added betterAuthUserId field to users
- Added by_better_auth_user index to users
- Exported organizationType from schema/index.ts

## Files Created/Modified
- `packages/convex/convex/schema/organizationLinks.ts` - Added parentBetterAuthOrgId field and by_parent_org index for organization hierarchy queries
- `packages/convex/convex/schema/users.ts` - Added betterAuthUserId field and by_better_auth_user index for Better Auth integration
- `packages/convex/convex/schema/index.ts` - Exported organizationType validator for type safety

## Decisions Made

**1. Optional parentBetterAuthOrgId for hierarchy tracking**
- Rationale: Enables "all child organizations under this treater" queries without joining through domain tables. Treaters have undefined (top-level), generators/haulers contain parent treater's betterAuthOrgId.
- Impact: Simpler queries, better performance for hierarchy traversal

**2. Optional betterAuthUserId for backward compatibility**
- Rationale: Supports existing users who haven't been migrated and users created before Better Auth integration
- Impact: Graceful migration path, no breaking changes to existing data

**3. Export organizationType validator**
- Rationale: Provides type safety for mutations that need to validate organization types
- Impact: Better TypeScript support in organization management code

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed duplicate transportPermits export**
- **Found during:** Task 3 (Schema deployment)
- **Issue:** schema/index.ts had duplicate export statement for transportPermits (lines 26-27)
- **Fix:** Removed duplicate export line
- **Files modified:** packages/convex/convex/schema/index.ts
- **Verification:** Schema deployed successfully without errors
- **Committed in:** 73b0d72 (bundled with schema changes)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix was necessary to deploy schema successfully. No scope creep.

## Issues Encountered

**Pre-existing TypeScript errors in communications module:**
- Unused 'ctx' parameters in email.ts and sms.ts
- Unknown type errors in result handling
- These errors existed before this plan and are not related to schema changes
- Schema-specific TypeScript errors (organizationLinks type errors) were resolved after deployment

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for organization management mutations:**
- Schema changes deployed and validated
- organizationLinks can now track parent-child relationships
- users table ready for Better Auth user linking
- All indexes in place for efficient queries

**No blockers:**
- Schema backward-compatible (optional fields)
- TypeScript types generated correctly
- Convex dashboard shows updated tables

---
*Phase: 02-organization-bridge*
*Completed: 2026-01-21*
