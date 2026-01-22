---
phase: 01-core-authentication
plan: 02
subsystem: auth
tags: [better-auth, tanstack-start, ssr, convex, convex-better-auth, useConvexAuth]

# Dependency graph
requires:
  - phase: 01-core-authentication/01
    provides: "Auth proxy route and server helpers (getToken)"
provides:
  - SSR auth token loading via beforeLoad
  - ConvexBetterAuthProvider wrapping app with initialToken
  - Auth context using useConvexAuth for state
  - Real Better Auth session integration (no mock data)
affects: [01-03, phase-2, phase-6]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SSR auth pattern: beforeLoad loads token, passes to ConvexBetterAuthProvider"
    - "Auth state pattern: Use useConvexAuth() not authClient.useSession()"
    - "Router context: Pass convexQueryClient for SSR auth setup"

key-files:
  created: []
  modified:
    - "apps/treater/src/router.tsx"
    - "apps/treater/src/routes/__root.tsx"
    - "apps/treater/src/contexts/auth-context.tsx"

key-decisions:
  - "Use useConvexAuth for auth state to avoid race conditions"
  - "Get user details from Better Auth session only when Convex confirms authentication"

patterns-established:
  - "SSR auth flow: createServerFn -> getToken -> beforeLoad -> ConvexBetterAuthProvider"
  - "Auth context: useConvexAuth for isAuthenticated, Better Auth session for user details"

# Metrics
duration: 6min
completed: 2026-01-21
---

# Phase 01 Plan 02: SSR Auth Integration Summary

**TanStack Start SSR auth flow with ConvexBetterAuthProvider, useConvexAuth-based auth context replacing mock localStorage auth**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-21T09:12:59Z
- **Completed:** 2026-01-21T09:18:54Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Wired SSR auth token loading via createServerFn in root layout beforeLoad
- Replaced ConvexProvider Wrap with ConvexBetterAuthProvider for proper auth integration
- Replaced mock localStorage-based auth with real Better Auth session management
- Established useConvexAuth as source of truth for authentication state

## Task Commits

Each task was committed atomically:

1. **Task 1: Update router to pass convexQueryClient to context** - `9b9746b` (feat)
2. **Task 2: Update root layout with SSR auth token loading** - `226e916` (feat)
3. **Task 3: Replace mock auth context with Better Auth integration** - `0470e93` (feat)

## Files Created/Modified

- `apps/treater/src/router.tsx` - Added convexQueryClient to context, removed AuthProvider wrapper
- `apps/treater/src/routes/__root.tsx` - SSR auth token loading and ConvexBetterAuthProvider
- `apps/treater/src/contexts/auth-context.tsx` - Real Better Auth integration using useConvexAuth

## Decisions Made

1. **Use useConvexAuth for auth state** - Better Auth's useSession() reflects authenticated state before Convex validates the token, causing race conditions. Using useConvexAuth ensures we wait for Convex to confirm authentication.

2. **Combine useConvexAuth and Better Auth session** - Use useConvexAuth for isAuthenticated/isLoading state (source of truth), and Better Auth session only for user details when authenticated.

3. **AuthContextType interface change** - Changed from login/logout methods to signIn/signUp/signOut matching Better Auth API. This is a breaking change for consumers of useAuth().

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Pre-existing TypeScript errors in treater app (TanStack Router type issues in account.$accountView.tsx, organization.$organizationView.tsx, auth.$authView.tsx). These are unrelated to auth and existed before this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- SSR auth flow is fully wired and functional
- Auth context provides real session data
- Ready for Plan 01-03 (Email Verification UI)
- Ready for Phase 2 (Organization Bridge) to add domain-specific user info (treaterId, role, etc.)

**Note:** The auth system is now connected but requires:
1. Convex backend running (`pnpm --filter @hwm/convex dev`)
2. Environment variables set (VITE_CONVEX_URL, VITE_CONVEX_SITE_URL)
3. Better Auth component deployed to Convex

---
*Phase: 01-core-authentication*
*Completed: 2026-01-21*
