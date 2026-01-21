---
phase: 01-core-authentication
plan: 04
subsystem: auth
tags: [react, context, better-auth, useAuth]

# Dependency graph
requires:
  - phase: 01-core-authentication
    plan: 02
    provides: AuthProvider component and useAuth hook definition
provides:
  - AuthProvider wired into component tree
  - Header component using correct Better Auth API
  - useAuth() available throughout application
affects: [phase-2-organization-bridge, dashboard, protected-routes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "AuthProvider wraps inside ConvexBetterAuthProvider"
    - "signOut() is async (must await)"
    - "user.name is nullable (requires fallback)"

key-files:
  created: []
  modified:
    - apps/treater/src/routes/__root.tsx
    - apps/treater/src/components/layout/header.tsx

key-decisions:
  - "AuthProvider inside ConvexBetterAuthProvider (requires useConvexAuth)"
  - "treaterName removed, static label until Phase 2 org bridge"

patterns-established:
  - "AuthProvider wrap pattern: ConvexBetterAuthProvider > AuthProvider > Outlet"
  - "Handle null user.name with fallback to 'U' for initials"

# Metrics
duration: 5min
completed: 2026-01-21
---

# Phase 01 Plan 04: Auth Provider Wiring Summary

**AuthProvider wired into root component tree and Header updated to use Better Auth signOut API**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-21T10:43:04Z
- **Completed:** 2026-01-21T10:48:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- AuthProvider now wraps Outlet inside ConvexBetterAuthProvider
- useAuth() hook works throughout the application (no more "must be used within AuthProvider" error)
- Header component uses signOut() instead of non-existent logout()
- Header gracefully handles null user.name for initials calculation
- Removed treaterName reference (will be added in Phase 2)

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire AuthProvider into __root.tsx** - `9ca315c` (feat)
2. **Task 2: Update Header to use new auth API** - `5edb777` (feat)

## Files Created/Modified
- `apps/treater/src/routes/__root.tsx` - Added AuthProvider wrapping Outlet
- `apps/treater/src/components/layout/header.tsx` - Fixed auth API usage (signOut, null handling)

## Decisions Made
- **AuthProvider inside ConvexBetterAuthProvider:** AuthProvider uses useConvexAuth() which requires the Convex context, so it must be nested inside ConvexBetterAuthProvider
- **treaterName replaced with static label:** The treaterName property doesn't exist on AuthUser until Phase 2 organization bridge is implemented; using "Treatment Facility" as placeholder

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Auth context fully wired and available throughout treater app
- Header component functional with correct API
- Ready for Phase 2 organization bridge to add treaterName to AuthUser

---
*Phase: 01-core-authentication*
*Completed: 2026-01-21*
