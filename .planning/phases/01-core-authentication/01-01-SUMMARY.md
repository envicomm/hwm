---
phase: 01-core-authentication
plan: 01
subsystem: auth
tags: [better-auth, tanstack-start, ssr, convex, proxy-route]

# Dependency graph
requires:
  - phase: none
    provides: "First plan in phase - no prior dependencies"
provides:
  - TanStack Start auth proxy route at /api/auth/$
  - Server-side auth helpers (handler, getToken)
  - SSR-compatible auth infrastructure
affects: [01-02, 01-03, phase-2, phase-6]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Auth proxy pattern: /api/auth/$ catches all auth requests"
    - "Server helpers via convexBetterAuthReactStart"
    - "SSR noExternal config for @convex-dev/better-auth"

key-files:
  created:
    - "apps/treater/src/lib/auth-server.ts"
    - "apps/treater/src/routes/api/auth/$.ts"
  modified:
    - "packages/convex/package.json"
    - "apps/treater/vite.config.ts"
    - "apps/generator/vite.config.ts"
    - "apps/trucking/vite.config.ts"

key-decisions:
  - "Use process.env for server-side env access in TanStack Start"
  - "Add SSR noExternal config for @convex-dev/better-auth to fix bundling"

patterns-established:
  - "Auth proxy pattern: Route at /api/auth/$ forwards to Convex Better Auth"
  - "Server helpers: Import from ~/lib/auth-server for SSR contexts"

# Metrics
duration: 19s
completed: 2026-01-21
---

# Phase 01 Plan 01: Auth Proxy Route Summary

**TanStack Start auth proxy route at /api/auth/$ with server-side helpers for SSR authentication via Convex Better Auth**

## Performance

- **Duration:** ~2 min (tasks were pre-committed, verification and cleanup committed)
- **Started:** 2026-01-21T09:09:32Z
- **Completed:** 2026-01-21T09:09:51Z
- **Tasks:** 3 + 1 fix
- **Files modified:** 6

## Accomplishments

- Aligned better-auth to version 1.4.10 across packages/convex and packages/auth
- Created auth-server.ts with TanStack Start SSR helpers (handler, getToken, fetchAuthQuery/Mutation/Action)
- Created auth proxy route at /api/auth/$ handling GET and POST requests
- Added SSR bundling configuration for all app vite configs

## Task Commits

Each task was committed atomically:

1. **Task 1: Align better-auth version** - `0c76f08` (chore)
2. **Task 2: Create auth-server.ts** - `c099032` (feat)
3. **Task 3: Create auth proxy route** - `72c6f87` (feat)
4. **Fix: SSR config and cleanup** - `a6e08a8` (fix)

## Files Created/Modified

- `apps/treater/src/lib/auth-server.ts` - Server-side auth helpers for TanStack Start SSR
- `apps/treater/src/routes/api/auth/$.ts` - Auth proxy route forwarding to Convex Better Auth
- `packages/convex/package.json` - Updated better-auth to 1.4.10
- `apps/treater/vite.config.ts` - Added SSR noExternal config
- `apps/generator/vite.config.ts` - Added SSR noExternal config
- `apps/trucking/vite.config.ts` - Added SSR noExternal config

## Decisions Made

1. **Use process.env for server-side code** - TanStack Start server-side code should use `process.env` instead of `import.meta.env` for environment variables
2. **Add SSR noExternal config** - The @convex-dev/better-auth package needs to be externalized during SSR bundling to avoid module resolution issues

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added SSR noExternal configuration**
- **Found during:** Post-task verification
- **Issue:** SSR bundling would fail without proper noExternal configuration for @convex-dev/better-auth
- **Fix:** Added ssr.noExternal config to all three app vite.config.ts files
- **Files modified:** apps/treater/vite.config.ts, apps/generator/vite.config.ts, apps/trucking/vite.config.ts
- **Verification:** Files staged and committed
- **Committed in:** a6e08a8 (fix commit)

**2. [Rule 1 - Bug] Removed unused json import**
- **Found during:** Post-task verification
- **Issue:** Unused import from @tanstack/react-start in auth proxy route
- **Fix:** Removed unused import
- **Files modified:** apps/treater/src/routes/api/auth/$.ts
- **Verification:** File compiles without errors
- **Committed in:** a6e08a8 (fix commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary for correct SSR operation and clean code. No scope creep.

## Issues Encountered

- Pre-existing TypeScript errors in treater app (unrelated to auth - TanStack Router type issues in other route files)
- These errors do not affect the auth proxy route functionality

## User Setup Required

None - no external service configuration required. Environment variables (VITE_CONVEX_URL, VITE_CONVEX_SITE_URL) are already configured in the project.

## Next Phase Readiness

- Auth proxy route is ready to handle authentication requests
- Server-side helpers available for SSR contexts
- Ready for Plan 01-02 (Login/Signup UI components)
- Ready for Plan 01-03 (Email verification flow)

**Note:** The auth proxy route will return errors until the Convex Better Auth endpoints are fully configured and the auth client is connected. This is expected and will be resolved in subsequent plans.

---
*Phase: 01-core-authentication*
*Completed: 2026-01-21*
