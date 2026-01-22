---
phase: 05-role-based-access-control
plan: 01
subsystem: auth
tags: [rbac, permissions, audit-logging, convex-helpers]

# Dependency graph
requires:
  - phase: 02-organization-bridge
    provides: organizationLinks schema and organizationType validator
provides:
  - auditLogs table schema with compliance-ready indexes
  - PERMISSIONS matrix defining resource/action/role mappings
  - hasPermission and requirePermission type-safe utilities
  - convex-helpers dependency for protected wrappers
affects:
  - 05-02 (protected query/mutation wrappers)
  - 05-03 (audit log mutations)
  - All future plans using permission checks

# Tech tracking
tech-stack:
  added: [convex-helpers ^0.1.111]
  patterns: [permission matrix pattern, audit log schema pattern]

key-files:
  created:
    - packages/convex/convex/schema/auditLogs.ts
    - packages/convex/convex/lib/permissions.ts
  modified:
    - packages/convex/convex/schema/index.ts
    - packages/convex/convex/schema.ts
    - packages/convex/package.json

key-decisions:
  - "Use organizationType validator from organizationLinks for audit log schema consistency"
  - "Permission matrix uses readonly arrays for type safety"
  - "requirePermission throws ConvexError with FORBIDDEN code for consistent error handling"

patterns-established:
  - "Permission matrix pattern: resource -> action -> OrgRole[] mapping"
  - "Audit log pattern: who (actor), what (event/resource), where (org), when (timestamp)"

# Metrics
duration: 3min
completed: 2026-01-22
---

# Phase 5 Plan 01: RBAC Foundation Summary

**Permission matrix with resource/action/role mappings for 5 resources, audit log schema with 4 indexes for compliance tracking**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-22T02:51:22Z
- **Completed:** 2026-01-22T02:54:49Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Created auditLogs table schema with indexes for organization, actor, resource, and event queries
- Implemented PERMISSIONS object covering organization, team, generator, hauler, wasteBag resources
- Built type-safe hasPermission and requirePermission utilities with generics
- Installed convex-helpers for protected query/mutation wrappers in Plan 02

## Task Commits

Each task was committed atomically:

1. **Task 1: Create audit log schema and permission definitions** - `3db7169` (feat)
2. **Task 2: Install convex-helpers for custom function wrappers** - `3f56884` (chore)

## Files Created/Modified

- `packages/convex/convex/schema/auditLogs.ts` - Audit log table with indexes for compliance tracking
- `packages/convex/convex/lib/permissions.ts` - PERMISSIONS matrix with hasPermission/requirePermission utilities
- `packages/convex/convex/schema/index.ts` - Added auditLogs export
- `packages/convex/convex/schema.ts` - Added auditLogs to schema definition
- `packages/convex/package.json` - Added convex-helpers dependency

## Decisions Made

1. **Used organizationType validator from organizationLinks** - Ensures audit logs use the same type validator as the organization bridge, maintaining consistency across the schema.

2. **Permission matrix uses readonly arrays** - TypeScript's `as const` assertion makes the permission arrays readonly, preventing accidental mutations and enabling type inference.

3. **requirePermission throws ConvexError with FORBIDDEN code** - Consistent with existing error handling patterns in lib/auth.ts, enables structured error responses.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Pre-existing TypeScript errors in communications module and userContext.ts prevented full typecheck pass, but these are documented blockers from previous phases. New files (auditLogs.ts, permissions.ts) compile correctly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- auditLogs schema ready for mutation implementation in Plan 03
- PERMISSIONS matrix ready for integration into protected wrappers in Plan 02
- convex-helpers available for customQuery/customMutation creation

---
*Phase: 05-role-based-access-control*
*Completed: 2026-01-22*
