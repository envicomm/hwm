---
phase: 04-team-management
plan: 01
subsystem: auth
tags: [better-auth, convex, ssr, tanstack-start, react]

# Dependency graph
requires:
  - phase: 01-core-authentication
    provides: Auth proxy pattern, SSR auth flow, ConvexBetterAuthProvider
provides:
  - SSR auth infrastructure in generator app (port 3001)
  - SSR auth infrastructure in trucking app (port 3003)
  - Auth proxy routes for Better Auth integration
  - ConvexBetterAuthProvider wrapping for session handling
affects: [04-team-management, 06-cross-app-auth]

# Tech tracking
tech-stack:
  added: ["@convex-dev/better-auth to generator", "@convex-dev/better-auth to trucking"]
  patterns: [SSR auth flow with beforeLoad, Auth proxy route pattern, ConvexBetterAuthProvider wrapping]

key-files:
  created:
    - apps/generator/src/lib/auth-server.ts
    - apps/generator/src/routes/api/auth/$.ts
    - apps/trucking/src/lib/auth-server.ts
    - apps/trucking/src/routes/api/auth/$.ts
  modified:
    - apps/generator/src/routes/__root.tsx
    - apps/generator/src/contexts/auth-context.tsx
    - apps/generator/src/router.tsx
    - apps/generator/src/routes/index.tsx
    - apps/generator/src/routes/auth.$authView.tsx
    - apps/generator/src/components/layout/header.tsx
    - apps/trucking/src/routes/__root.tsx
    - apps/trucking/src/contexts/auth-context.tsx
    - apps/trucking/src/router.tsx
    - apps/trucking/src/routes/index.tsx
    - apps/trucking/src/routes/auth.$authView.tsx
    - apps/trucking/src/components/layout/header.tsx

key-decisions:
  - "Replicate treater SSR auth pattern to generator and trucking apps"
  - "Replace mock localStorage auth with Better Auth useConvexAuth pattern"
  - "Move AuthProvider from router Wrap to __root.tsx (inside ConvexBetterAuthProvider)"

patterns-established:
  - "All apps use consistent SSR auth: auth-server.ts + api/auth/$.ts + __root.tsx with ConvexBetterAuthProvider"
  - "Router provides convexQueryClient in context for serverHttpClient.setAuth(token)"
  - "Auth routes redirect authenticated users to dashboard via beforeLoad"

# Metrics
duration: 10min
completed: 2026-01-21
---

# Phase 04 Plan 01: Multi-App SSR Auth Summary

**SSR auth infrastructure added to generator (3001) and trucking (3003) apps using convexBetterAuthReactStart pattern from treater**

## Performance

- **Duration:** 10 min
- **Started:** 2026-01-21T23:31:10Z
- **Completed:** 2026-01-21T23:41:18Z
- **Tasks:** 3
- **Files modified:** 18

## Accomplishments
- Generator app (port 3001) has full SSR auth infrastructure matching treater pattern
- Trucking app (port 3003) has full SSR auth infrastructure matching treater pattern
- Both apps have auth proxy routes for Better Auth integration
- Auth context updated from mock localStorage to useConvexAuth + Better Auth session
- Router context provides convexQueryClient for SSR token handling

## Task Commits

Each task was committed atomically:

1. **Task 1: Add SSR auth infrastructure to generator app** - `e417d64` (feat)
2. **Task 2: Add SSR auth infrastructure to trucking app** - `1f72e18` (feat)
3. **Task 3: Update router.tsx files for SSR auth context** - `1fedb83` (feat)

## Files Created/Modified

**Generator App (created):**
- `apps/generator/src/lib/auth-server.ts` - SSR auth helpers with convexBetterAuthReactStart
- `apps/generator/src/routes/api/auth/$.ts` - Auth proxy route for Better Auth

**Generator App (modified):**
- `apps/generator/src/routes/__root.tsx` - Added ConvexBetterAuthProvider, beforeLoad auth check
- `apps/generator/src/contexts/auth-context.tsx` - Replaced mock auth with useConvexAuth + session
- `apps/generator/src/router.tsx` - Added convexQueryClient to context
- `apps/generator/src/routes/index.tsx` - Changed to redirect pattern based on auth state
- `apps/generator/src/routes/auth.$authView.tsx` - Added beforeLoad redirect for authenticated users
- `apps/generator/src/components/layout/header.tsx` - Updated to use signOut instead of logout

**Trucking App (created):**
- `apps/trucking/src/lib/auth-server.ts` - SSR auth helpers with convexBetterAuthReactStart
- `apps/trucking/src/routes/api/auth/$.ts` - Auth proxy route for Better Auth

**Trucking App (modified):**
- `apps/trucking/src/routes/__root.tsx` - Added ConvexBetterAuthProvider, beforeLoad auth check
- `apps/trucking/src/contexts/auth-context.tsx` - Replaced mock auth with useConvexAuth + session
- `apps/trucking/src/router.tsx` - Added convexQueryClient to context
- `apps/trucking/src/routes/index.tsx` - Changed to redirect pattern based on auth state
- `apps/trucking/src/routes/auth.$authView.tsx` - Added beforeLoad redirect for authenticated users
- `apps/trucking/src/components/layout/header.tsx` - Updated to use signOut instead of logout

## Decisions Made

1. **Replicate treater SSR auth pattern exactly** - Ensures consistency across all three apps. Same auth-server.ts exports, same api/auth/$.ts pattern, same __root.tsx structure.

2. **Replace mock auth with Better Auth pattern** - The generator and trucking apps had mock localStorage-based auth. Updated to use useConvexAuth as source of truth (matches treater's pattern established in Phase 1).

3. **Move AuthProvider inside ConvexBetterAuthProvider** - AuthProvider needs access to Convex context for useConvexAuth hook. Moved from router.Wrap to __root.tsx within ConvexBetterAuthProvider wrapper.

4. **Remove domain-specific user fields from header** - The new AuthUser type doesn't have generatorName/haulerName (those come from organization context, not auth). Headers now show generic portal names.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Updated auth-context.tsx to Better Auth pattern**
- **Found during:** Task 1 and Task 2
- **Issue:** Existing auth-context.tsx used mock localStorage auth with login/logout methods
- **Fix:** Replaced with useConvexAuth + Better Auth session pattern, exposed signIn/signUp/signOut
- **Files modified:** apps/generator/src/contexts/auth-context.tsx, apps/trucking/src/contexts/auth-context.tsx
- **Verification:** Components can use useAuth() with Better Auth methods

**2. [Rule 2 - Missing Critical] Updated header components to use signOut**
- **Found during:** Task 1 and Task 2
- **Issue:** Headers used logout() method which doesn't exist in new AuthContextType
- **Fix:** Changed to signOut(), updated to async handler, removed domain-specific user fields
- **Files modified:** apps/generator/src/components/layout/header.tsx, apps/trucking/src/components/layout/header.tsx
- **Verification:** TypeScript compiles, signOut calls Better Auth

**3. [Rule 2 - Missing Critical] Updated auth routes with beforeLoad redirect**
- **Found during:** Task 1 and Task 2
- **Issue:** Auth routes didn't check if user was already authenticated
- **Fix:** Added beforeLoad that redirects to /dashboard if context.isAuthenticated
- **Files modified:** apps/generator/src/routes/auth.$authView.tsx, apps/trucking/src/routes/auth.$authView.tsx
- **Verification:** Authenticated users redirected to dashboard

**4. [Rule 2 - Missing Critical] Updated index routes to redirect pattern**
- **Found during:** Task 1 and Task 2
- **Issue:** Index routes had full landing page with custom login form
- **Fix:** Changed to redirect pattern (auth state check -> redirect to dashboard or sign-in)
- **Files modified:** apps/generator/src/routes/index.tsx, apps/trucking/src/routes/index.tsx
- **Verification:** Unauthenticated users go to /auth/sign-in, authenticated go to /dashboard

---

**Total deviations:** 4 auto-fixed (all Rule 2 - Missing Critical for correct auth operation)
**Impact on plan:** All auto-fixes necessary for auth to work correctly. The plan focused on infrastructure files but existing components used the old mock auth API.

## Issues Encountered

- **Pre-existing mock-data type errors in generator app** - These existed before our changes (verified by git stash). Not related to auth infrastructure.
- **Pre-existing communications module errors in treater** - Known issue documented in STATE.md, doesn't affect auth.

## User Setup Required

None - no external service configuration required. SSR auth uses existing Convex Better Auth setup from Phase 1.

## Next Phase Readiness

- All three apps (treater, generator, trucking) now have consistent SSR auth infrastructure
- Users can authenticate via any app using Better Auth
- Session persists across page refresh via ConvexBetterAuthProvider + initialToken
- Ready for team management features (invitations, member management)
- Generator and trucking apps need organization-specific dashboard content (currently have mock data)

---
*Phase: 04-team-management*
*Completed: 2026-01-21*
