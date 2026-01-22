---
phase: 05-role-based-access-control
plan: 04
subsystem: api
tags: [rbac, data-scoping, convex, multi-tenancy]

# Dependency graph
requires:
  - phase: 05-02
    provides: UserContext type with orgType, treaterId, generatorId, haulerId fields
provides:
  - getAccessibleGenerators function for domain-aware generator visibility
  - getAccessibleHaulers function for domain-aware hauler visibility
  - canAccessGenerator/canAccessHauler boolean access checks
  - requireGeneratorAccess/requireHaulerAccess throwing access guards
affects: [05-05, 05-06, protected-queries, protected-mutations]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Data scoping via UserContext.orgType switch"
    - "Boolean access checks for specific entities"
    - "Throwing guards for mutation protection"

key-files:
  created:
    - packages/convex/convex/lib/dataScoping.ts
  modified: []

key-decisions:
  - "Treaters access generators via by_treater index lookup"
  - "Treaters access haulers via treaterHaulerPartners join"
  - "Generators/haulers access only their own organization"
  - "Cross-org access (generators to haulers, haulers to generators) returns empty/false"

patterns-established:
  - "getAccessible* pattern: Switch on orgType, return Doc[] based on visibility rules"
  - "canAccess* pattern: Switch on orgType, return boolean for specific entity access"
  - "require*Access pattern: Call canAccess*, throw FORBIDDEN on false"

# Metrics
duration: 3min
completed: 2026-01-22
---

# Phase 5 Plan 4: Data Scoping Utilities Summary

**Domain-aware data visibility functions using UserContext.orgType to enforce treater/generator/hauler access boundaries**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-22T02:59:37Z
- **Completed:** 2026-01-22T03:02:37Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- getAccessibleGenerators: Treaters see all their generators, generators see only their own, haulers get empty array
- getAccessibleHaulers: Treaters see partnered haulers, haulers see only their own, generators get empty array
- canAccessGenerator/canAccessHauler: Boolean checks for specific entity access
- requireGeneratorAccess/requireHaulerAccess: Throwing guards for mutation protection

## Task Commits

Work was already completed as part of plan 05-03 execution:

1. **Task 1: Create data scoping utilities** - `0b1a889` (feat)
   - Note: Created alongside audit logger integration in 05-03

**Plan metadata:** No additional commit needed (artifact already exists)

## Files Created/Modified
- `packages/convex/convex/lib/dataScoping.ts` - Data scoping utilities with domain-aware visibility rules

## Decisions Made
None - followed plan specification exactly. Implementation matches plan template.

## Deviations from Plan

None - plan executed exactly as written.

**Note:** The dataScoping.ts file was created during the 05-03 plan execution (commit 0b1a889) rather than in a separate 05-04 execution. This is acceptable as plans 05-03 and 05-04 were in the same wave and the work order was consolidated. All success criteria are met.

## Issues Encountered
- Pre-existing TypeScript errors in communications module (email.ts, sms.ts) - these are known issues unrelated to this plan

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Data scoping layer complete, ready for protected query/mutation integration (05-05)
- Functions use established UserContext pattern from 05-02
- All three org types (treater, generator, hauler) handled with appropriate visibility rules

---
*Phase: 05-role-based-access-control*
*Completed: 2026-01-22*
