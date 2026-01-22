---
phase: 03-organization-management
plan: 04
subsystem: ui
tags: [tanstack-router, react, convex, detail-pages, navigation]

# Dependency graph
requires:
  - phase: 03-02
    provides: useActiveTreater hook and generators overview component
  - phase: 03-03
    provides: haulers overview component
  - phase: 03-01
    provides: authenticated organization queries with authorization
provides:
  - Generator detail page at /dashboard/generators/$generatorId
  - Hauler detail page at /dashboard/haulers/$haulerId
  - Navigation from overview cards to detail pages
  - Authorization enforcement at detail page level
affects: [04-team-management, 05-rbac]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TanStack Router file-based routing for detail pages
    - Parameterized routes with authorization checks
    - Navigation via useNavigate hook from overview components

key-files:
  created:
    - apps/treater/src/routes/dashboard/generators/index.tsx
    - apps/treater/src/routes/dashboard/generators/$generatorId.tsx
    - apps/treater/src/routes/dashboard/haulers/index.tsx
    - apps/treater/src/routes/dashboard/haulers/$haulerId.tsx
  modified:
    - apps/treater/src/components/dashboard/generators-overview.tsx
    - apps/treater/src/components/dashboard/haulers-overview.tsx

key-decisions:
  - "Index routes redirect to dashboard (list view is on main dashboard)"
  - "Detail pages use api.generators.index.getById and api.haulers.index.getById with treaterId for authorization"
  - "Display serviceArea.cities instead of fleetSize for haulers (matches schema)"
  - "Location card shown conditionally if location data exists"

patterns-established:
  - "Detail page pattern: loading state → error state → not-found state → data display"
  - "Navigation pattern: useNavigate hook in card click handlers"
  - "Authorization pattern: treaterId verification in detail page queries"

# Metrics
duration: 6min
completed: 2026-01-21
---

# Phase 03 Plan 04: Organization Detail Pages Summary

**Treaters can view detailed information for generators and haulers by clicking cards, with proper authorization and loading states**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-21T14:08:29Z
- **Completed:** 2026-01-21T14:14:12Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Generator detail pages show organization details, contact info, storage configuration, and location
- Hauler detail pages show organization details (license, service area), contact info, and headquarters location
- Navigation from dashboard overview cards to detail pages works seamlessly
- Authorization enforced via treaterId parameter (generators) and partnership verification (haulers)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create generator detail page route** - `6e96409` (feat)
2. **Task 2: Create hauler detail page route** - `8f047e6` (feat)
3. **Task 3: Wire card clicks to detail pages** - `678f53c` (feat)

## Files Created/Modified
- `apps/treater/src/routes/dashboard/generators/index.tsx` - Redirect route (list is on dashboard)
- `apps/treater/src/routes/dashboard/generators/$generatorId.tsx` - Generator detail page with authorization
- `apps/treater/src/routes/dashboard/haulers/index.tsx` - Redirect route (list is on dashboard)
- `apps/treater/src/routes/dashboard/haulers/$haulerId.tsx` - Hauler detail page with authorization
- `apps/treater/src/components/dashboard/generators-overview.tsx` - Added navigation on card click
- `apps/treater/src/components/dashboard/haulers-overview.tsx` - Added navigation on card click

## Decisions Made

1. **Index routes redirect to dashboard**
   - Rationale: Generator and hauler lists are already on the main dashboard, no separate list view needed
   - Impact: Clean URL structure, no duplicate list pages

2. **Use serviceArea.cities instead of fleetSize for haulers**
   - Rationale: fleetSize doesn't exist in haulers schema, serviceArea does
   - Impact: Display matches actual data model

3. **Query organization links separately**
   - Rationale: Can use specific api.organizationLinks.index.getByGenerator/getByHauler queries
   - Impact: Shows Better Auth organization ID on detail pages for debugging

4. **Conditional location cards**
   - Rationale: Location data is optional in schema
   - Impact: UI degrades gracefully when location not provided

## Deviations from Plan

**1. [Rule 1 - Bug] Fixed hauler detail to use serviceArea instead of fleetSize**
- **Found during:** Task 2 (Hauler detail page typecheck)
- **Issue:** Plan referenced hauler.fleetSize field which doesn't exist in schema (packages/convex/convex/schema/haulers.ts only has licenseNumber, serviceArea, location)
- **Fix:** Changed display from fleetSize to serviceArea.cities.length
- **Files modified:** apps/treater/src/routes/dashboard/haulers/$haulerId.tsx
- **Verification:** TypeScript compilation passes
- **Committed in:** 8f047e6 (Task 2 commit)

**2. [Rule 2 - Missing Critical] Added location card to hauler detail**
- **Found during:** Task 2 (Hauler detail page implementation)
- **Issue:** Plan didn't specify showing hauler location, but schema has location field and generators detail shows it
- **Fix:** Added conditional location card showing headquarters location (same pattern as generators)
- **Files modified:** apps/treater/src/routes/dashboard/haulers/$haulerId.tsx
- **Verification:** Consistent with generator detail page pattern
- **Committed in:** 8f047e6 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)
**Impact on plan:** Both fixes ensure UI matches actual schema and maintains consistency between generator/hauler detail pages.

## Issues Encountered
None - straightforward implementation after schema alignment.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Organization detail pages complete (ORG-05, ORG-06 requirements satisfied)
- Ready for Phase 4: Team Management (user invitation and management within organizations)
- Navigation pattern established for future detail pages
- Authorization pattern established for entity-level access control

---
*Phase: 03-organization-management*
*Completed: 2026-01-21*
