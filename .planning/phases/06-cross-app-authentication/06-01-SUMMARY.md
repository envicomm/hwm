---
phase: 06-cross-app-authentication
plan: 01
subsystem: auth
tags: [better-auth, tanstack-router, ssr, routing]

# Dependency graph
requires:
  - phase: 04-team-management
    provides: Multi-app SSR auth with Better Auth organization plugin
  - phase: 02-organization-bridge
    provides: organizationType metadata on Better Auth organizations
provides:
  - Organization-type based routing middleware in all three apps
  - Automatic redirection to correct app based on active organization
  - SSR-safe routing helpers for server-side org type detection
affects: [06-cross-app-authentication, future cross-app features]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SSR-safe routing detection using port parameter"
    - "Organization-type based app routing in beforeLoad"
    - "Routing exempt paths for auth and invitation flows"

key-files:
  created: []
  modified:
    - packages/auth/src/routing.ts
    - packages/auth/src/index.ts
    - apps/treater/src/routes/__root.tsx
    - apps/generator/src/routes/__root.tsx
    - apps/trucking/src/routes/__root.tsx

key-decisions:
  - "Use getCurrentAppOrgTypeSSR with port parameter for SSR contexts"
  - "Type cast session.data.user to access activeOrganization (Better Auth types incomplete)"
  - "Exempt /auth, /accept-invitation, /api/auth from org-type routing"

patterns-established:
  - "Organization-type routing pattern: check session, get org metadata, redirect if mismatch"
  - "Port-based app detection for SSR: 3001=generator, 3002=treater, 3003=trucking"

# Metrics
duration: 5min
completed: 2026-01-22
---

# Phase 06 Plan 01: Organization-Type Routing Summary

**Automatic app routing middleware redirects users to the correct app based on their active organization type**

## Performance

- **Duration:** 5 min 35 sec
- **Started:** 2026-01-22T04:24:51Z
- **Completed:** 2026-01-22T04:30:26Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- SSR-safe organization type detection using port-based routing
- Organization-type routing middleware in all three apps
- Users automatically redirected to correct app based on active organization
- Auth and invitation paths exempt from redirect logic

## Task Commits

Each task was committed atomically:

1. **Task 1: Add SSR-safe organization type detection** - `bfb468b` (feat) - Pre-existing from 06-RESEARCH
2. **Task 2: Add org-type routing to all apps** - `7c4c62b` (feat)

**Plan metadata:** Not committed yet (will be committed as final docs commit)

## Files Created/Modified

### Created
None - all functions added to existing files

### Modified
- `packages/auth/src/routing.ts` - Added getCurrentAppOrgTypeSSR and isRoutingExemptPath functions
- `packages/auth/src/index.ts` - Exported new routing helpers
- `apps/treater/src/routes/__root.tsx` - Added org-type routing in beforeLoad (port 3002)
- `apps/generator/src/routes/__root.tsx` - Added org-type routing in beforeLoad (port 3001)
- `apps/trucking/src/routes/__root.tsx` - Added org-type routing in beforeLoad (port 3003)

## Decisions Made

**1. Use getCurrentAppOrgTypeSSR with port parameter for SSR contexts**
- Rationale: window.location not available in server-side beforeLoad, need explicit port
- Impact: Each app hardcodes its port (3001/3002/3003) in beforeLoad

**2. Type cast session.data.user to access activeOrganization**
- Rationale: Better Auth organization plugin types not fully exported to session type
- Impact: Used `(session?.data?.user as any)?.activeOrganization` with type safety on metadata

**3. Exempt /auth, /accept-invitation, /api/auth from org-type routing**
- Rationale: These paths must work regardless of active organization for login and invitation flows
- Impact: isRoutingExemptPath checks pathname before running org-type redirect logic

## Deviations from Plan

### Task 1 Pre-existing

**1. [No deviation - Task already complete] Routing helpers already existed**
- **Found during:** Task 1 execution
- **Context:** getCurrentAppOrgTypeSSR and isRoutingExemptPath were added in commit bfb468b during Phase 6 research
- **Action:** Verified functions existed, marked task complete
- **Verification:** Functions exported from @hwm/auth package, typechecks pass

---

**Total deviations:** 0 auto-fixed
**Impact on plan:** Task 1 already completed during research phase. Plan executed as written.

## Issues Encountered

**1. Better Auth session type doesn't include activeOrganization**
- **Problem:** TypeScript error accessing session?.data?.user?.activeOrganization
- **Solution:** Type cast to `any` to access property - runtime value exists, types incomplete
- **Impact:** All three apps use same pattern with type assertion

**2. Pre-existing TypeScript errors in communications and mobile**
- **Context:** Known issues from STATE.md (communications ctx unused, mobile className issues)
- **Action:** Verified no new errors introduced by __root.tsx changes
- **Verification:** grep for __root.tsx in typecheck output returned no errors

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for next plans:**
- Organization-type routing works for single-org users
- Foundation in place for multi-org user UX (org switcher UI)
- Cross-domain session sharing needs testing with actual multi-app flow

**Considerations for next plans:**
- Multi-org users will need UI to switch active organization
- Consider redirect loop prevention if user has no matching org
- May need fallback app if user's active org type has no matching app

---
*Phase: 06-cross-app-authentication*
*Completed: 2026-01-22*
