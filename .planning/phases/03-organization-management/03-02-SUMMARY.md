---
phase: 03-organization-management
plan: 02
subsystem: ui
tags: [react, tanstack-query, convex, better-auth, organization-management]

# Dependency graph
requires:
  - phase: 03-01
    provides: Authenticated organization queries (generators, haulers, organizationLinks)
provides:
  - useActiveTreater hook for resolving Better Auth org to Convex treaterId
  - GeneratorsOverview component fetching real data from Convex
  - Loading and error states for generator list
affects: [03-03, 03-04, future-treater-ui-features]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useActiveTreater pattern: Better Auth org → Convex organizationLink → domain entity ID"
    - "Convex API access via api.module.index.functionName for directories with index.ts"
    - "Loading skeleton + error state pattern for data-fetching components"

key-files:
  created:
    - apps/treater/src/hooks/use-active-treater.ts
  modified:
    - apps/treater/src/components/dashboard/generators-overview.tsx

key-decisions:
  - "Access Convex exports via api.module.index.functionName when directory has index.ts re-exporting"
  - "Stub computed fields (currentStorageKg, pendingBags) until wasteBags queries available in future phase"
  - "Client-side filtering for active/inactive instead of separate queries"

patterns-established:
  - "useActiveTreater pattern: Resolves Better Auth active org → Convex treaterId for org-scoped queries"
  - "Loading skeleton shows 3 placeholder cards while data fetches"
  - "Error state component shows AlertTriangle icon + error message"

# Metrics
duration: 45min
completed: 2026-01-21
---

# Phase 3 Plan 2: Generator List UI Summary

**Generator list UI fetches real data from Convex via useActiveTreater hook and organization-scoped queries with loading/error states**

## Performance

- **Duration:** 45 min
- **Started:** 2026-01-21T13:58:28Z
- **Completed:** 2026-01-21T14:43:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- useActiveTreater hook resolves Better Auth organization to Convex treaterId
- GeneratorsOverview fetches real generator data via api.generators.index.getByTreater
- Loading skeleton displays while data fetches
- Error state shows when query fails
- Generator cards render with real Convex data (name, address, contact, qrMode, capacity, status)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useActiveTreater hook** - `0ad73b8` (feat)
2. **Task 2: Refactor GeneratorsOverview to use real data** - `a54c263` (feat)

## Files Created/Modified
- `apps/treater/src/hooks/use-active-treater.ts` - Hook to resolve Better Auth active org to Convex treaterId
- `apps/treater/src/components/dashboard/generators-overview.tsx` - Generator list component fetching real data

## Decisions Made

**1. Convex API path structure**
- Decision: Access queries via `api.module.index.functionName` when directory has index.ts
- Rationale: Convex generates separate API keys for `/index`, `/queries`, `/mutations` when directory structure exists. Since we use index.ts to re-export, must access via `.index.` namespace
- Impact: Pattern to follow for all future Convex API calls

**2. Stub computed fields**
- Decision: Display placeholder values (0) for currentStorageKg, pendingBags until wasteBags queries available
- Rationale: These require aggregating wasteBags data which will come in a future phase
- Impact: UI functional but shows zero values for storage utilization

**3. Client-side filtering**
- Decision: Fetch all generators (includeInactive: true) and filter client-side
- Rationale: Small dataset, simpler query logic, instant filter changes
- Impact: Single query instead of multiple active/inactive queries

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**1. Convex API import path resolution**
- Problem: Initial imports used `@hwm/convex/api` and `@hwm/convex/dataModel` which don't exist
- Resolution: Discovered `@hwm/convex` package exports api, Id, Doc types from src/index.ts
- Pattern established: Import from `@hwm/convex` barrel export

**2. Convex API nested structure**
- Problem: TypeScript errors for `api.generators.getByTreater` - property doesn't exist
- Resolution: Convex generates separate keys for `/index`, `/queries`, `/mutations`. Must use `api.generators.index.getByTreater`
- Pattern established: All Convex calls use `.index.` for directories with index.ts re-exports

## Next Phase Readiness

**Ready for next phase:**
- useActiveTreater hook available for all treater app components
- Pattern established for organization-scoped queries
- Loading/error state pattern ready to replicate in other components

**Limitations:**
- Computed fields (storage utilization, pending/treated counts) show placeholder values
- Will need wasteBags queries in future phase to calculate real values

**Next steps:**
- Apply same pattern to HaulersOverview component
- Build forms for creating generators/haulers
- Add generator detail view with wasteBags data

---
*Phase: 03-organization-management*
*Completed: 2026-01-21*
