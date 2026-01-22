---
phase: 05-role-based-access-control
plan: 05
subsystem: api
tags: [rbac, mutations, convex, audit-logging, permissions]

# Dependency graph
requires:
  - phase: 05-01
    provides: Permission matrix and requirePermission function
  - phase: 05-02
    provides: protectedMutation wrapper with UserContext and AuditLogger
  - phase: 05-04
    provides: requireGeneratorAccess, requireHaulerAccess domain guards
provides:
  - Permission-protected generator mutations (create, update, remove)
  - Permission-protected hauler mutations (create, update, remove, createPartnership, removePartnership)
  - Audit logging for all generator/hauler mutation operations
  - treaterId inference from user context (no longer passed as argument)
affects: [05-06, generator-ui, hauler-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "protectedMutation wrapper for all RBAC-controlled mutations"
    - "requirePermission checks before data modification"
    - "requireGeneratorAccess/requireHaulerAccess for domain boundary enforcement"
    - "Audit logging for all create/update/delete operations"

key-files:
  created: []
  modified:
    - packages/convex/convex/generators/mutations.ts
    - packages/convex/convex/haulers/mutations.ts
    - packages/convex/convex/lib/audit.ts

key-decisions:
  - "treaterId inferred from UserContext (BREAKING: removed from create args)"
  - "createPartnership/removePartnership simplified to only require haulerId (treaterId from context)"
  - "Partnership-specific audit events added (partnership_created/reactivated/removed)"
  - "Hauler removal also deactivates related partnerships"

patterns-established:
  - "Permission check ordering: access check first, then permission check"
  - "Audit logging at end of successful mutation"
  - "Org type guard at start of create mutations (treater-only)"

# Metrics
duration: 3min
completed: 2026-01-22
---

# Phase 5 Plan 5: Protected Mutations Summary

**Generator and hauler mutations refactored with protectedMutation, requirePermission, domain access checks, and comprehensive audit logging**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-01-22T03:04:54Z
- **Completed:** 2026-01-22T03:07:52Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Refactored generators/mutations.ts with protectedMutation wrapper
- Refactored haulers/mutations.ts with protectedMutation wrapper
- Added requirePermission checks (owner/admin for create/update, owner only for delete)
- Added requireGeneratorAccess/requireHaulerAccess domain boundary checks
- Added audit logging for all mutation operations
- Removed treaterId argument from create mutations (now inferred from user context)
- Added partnership-specific audit events to AuditEvent type
- Verified no existing call sites need updating

## Task Commits

1. **Task 1: Refactor generator mutations with permission checks** - `a848390` (feat)
   - Replaced mutation() with protectedMutation
   - Added requirePermission for create/update/delete
   - Added audit logging
   - Removed treaterId from create args

2. **Task 2: Refactor hauler mutations with permission checks** - `23ee62c` (feat)
   - Replaced mutation() with protectedMutation
   - Added requirePermission for all mutations
   - Added audit logging including partnership events
   - Simplified createPartnership/removePartnership to use user context

3. **Task 3: Verify and update mutation call sites** - no commit needed
   - Verified no existing call sites for generator/hauler mutations
   - Full monorepo typecheck passes (excluding pre-existing mobile app issues)

## Files Created/Modified

- `packages/convex/convex/generators/mutations.ts` - 3 mutations refactored (create, update, remove)
- `packages/convex/convex/haulers/mutations.ts` - 5 mutations refactored (create, update, remove, createPartnership, removePartnership)
- `packages/convex/convex/lib/audit.ts` - Added 3 partnership audit events

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Infer treaterId from UserContext | Simplifies API, enforces that only authenticated treaters can create generators/haulers |
| Add partnership-specific audit events | Audit completeness - partnership operations are distinct from CRUD operations |
| Remove deactivates partnerships | Cascading deactivation prevents orphaned active partnerships |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Schema mismatch in plan code**
- **Found during:** Task 2
- **Issue:** Plan code used incorrect schema fields (serviceArea as string, partnerSince, updatedAt on partnerships)
- **Fix:** Updated hauler mutations to match actual schema (serviceArea as object with cities array, partnerships without partnerSince/updatedAt)
- **Files modified:** packages/convex/convex/haulers/mutations.ts

**2. [Rule 2 - Missing Critical] Partnership audit events not in AuditEvent type**
- **Found during:** Task 2
- **Issue:** TypeScript error when logging partnership_created/reactivated/removed events
- **Fix:** Added partnership audit event types to AuditEvent union in audit.ts
- **Files modified:** packages/convex/convex/lib/audit.ts

## Issues Encountered

- **Pre-existing TypeScript errors in communications module** (email.ts, sms.ts) - Known issue, unrelated to this plan
- **Pre-existing TypeScript errors in mobile app** (NativeWind className issues) - Known issue, unrelated to this plan
- Convex package and all web apps typecheck successfully

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All generator and hauler mutations now use RBAC permission checks
- Audit logging is active for all sensitive operations
- Ready for 05-06 (Permission UI Integration) to surface permission errors in the UI
- Pattern established for refactoring other mutations (wasteBags, treatments, etc.)

## Success Criteria Verification

| Criteria | Status |
|----------|--------|
| Generator create fails for non-treater users | PASS - orgType check throws Error |
| Generator create fails for member role users | PASS - requirePermission checks for owner/admin |
| Generator update fails for member role users | PASS - requirePermission checks for owner/admin |
| Generator delete fails for non-owner users | PASS - requirePermission checks for owner only |
| Hauler mutations follow same permission patterns | PASS - all 5 mutations use protectedMutation + requirePermission |
| All mutations create audit log entries | PASS - ctx.audit called in all mutations |
| No treaterId argument needed | PASS - inferred from user.treaterId |
| All existing call sites updated and typecheck passes | PASS - no call sites exist, typecheck passes |

---
*Phase: 05-role-based-access-control*
*Completed: 2026-01-22*
