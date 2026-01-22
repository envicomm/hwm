---
phase: 01-core-authentication
plan: 03
subsystem: auth
tags: [tanstack-router, better-auth-ui, redirects, route-protection]

# Dependency graph
requires:
  - phase: 01-core-authentication (01-01)
    provides: Auth proxy route at /api/auth/$
  - phase: 01-core-authentication (01-02)
    provides: SSR auth token loading, context.isAuthenticated in beforeLoad
provides:
  - Auth page redirects authenticated users to /dashboard
  - Dashboard route protection (redirects unauthenticated to sign-in)
  - Index route redirect based on auth state
  - AuthView configured with post-auth redirect to /dashboard
affects:
  - 02-organization-bridge (auth flows ready for org context)
  - Phase 6 cross-app auth (pattern established)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TanStack Router beforeLoad for auth guards"
    - "Parameterized route redirects with params object"
    - "AuthView redirectTo prop for post-auth navigation"

key-files:
  created: []
  modified:
    - apps/treater/src/routes/auth.$authView.tsx
    - apps/treater/src/routes/dashboard.tsx
    - apps/treater/src/routes/index.tsx

key-decisions:
  - "Use context.isAuthenticated from root beforeLoad (not localStorage)"
  - "Use parameterized route format for TanStack Router redirects"
  - "Use AuthView redirectTo prop instead of manual callback"

patterns-established:
  - "Route protection: beforeLoad checks context.isAuthenticated and throws redirect"
  - "Param redirect format: { to: '/auth/$authView', params: { authView: 'sign-in' } }"

# Metrics
duration: 3min
completed: 2026-01-21
---

# Phase 01 Plan 03: Auth Redirect Wiring Summary

**Auth route protection with context-based redirects: authenticated to /dashboard, unauthenticated to /auth/sign-in, with AuthView redirectTo for post-login navigation**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-21T09:22:19Z
- **Completed:** 2026-01-21T09:25:34Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Auth page now redirects authenticated users away to /dashboard
- Dashboard route is protected with redirect to sign-in for unauthenticated users
- Index route "/" redirects based on auth state (dashboard if logged in, sign-in if not)
- AuthView configured with redirectTo="/dashboard" for post-auth navigation

## Task Commits

Each task was committed atomically:

1. **Task 1: Add redirect logic to auth page** - `3a9871a` (feat)
2. **Task 2: Protect dashboard route** - `93f6a02` (feat)
3. **Task 3: Update index route redirect** - `c74da63` (feat)

## Files Created/Modified

- `apps/treater/src/routes/auth.$authView.tsx` - Added beforeLoad to redirect authenticated users, added redirectTo prop to AuthView
- `apps/treater/src/routes/dashboard.tsx` - Replaced localStorage check with context.isAuthenticated, redirect to parameterized auth route
- `apps/treater/src/routes/index.tsx` - Auth-aware redirect to dashboard or sign-in

## Decisions Made

1. **Use context.isAuthenticated instead of localStorage** - The root route's beforeLoad already provides isAuthenticated in context from server-side token check. This is more reliable than client-side localStorage checks.

2. **Use parameterized route redirect format** - TanStack Router requires `{ to: "/auth/$authView", params: { authView: "sign-in" } }` format for routes with dynamic segments, not string paths like "/auth/sign-in".

3. **Use AuthView redirectTo prop** - The @daveyplate/better-auth-ui AuthView component accepts a redirectTo prop that gets passed to forms (SignInForm, SignUpForm, etc.) via useOnSuccessTransition hook. This is cleaner than manual callback handling.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Regenerated stale route tree**
- **Found during:** Task 1 (auth page redirect)
- **Issue:** TypeScript errors because routeTree.gen.ts was missing auth routes - file was stale
- **Fix:** Ran `npx @tanstack/router-cli generate` to regenerate route tree
- **Files modified:** apps/treater/src/routeTree.gen.ts (auto-generated, not committed)
- **Verification:** Route tree now includes all routes, no TS errors on route file
- **Committed in:** Not committed (generated file with @ts-nocheck)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for correct type checking. No scope creep.

## Issues Encountered

- Pre-existing TypeScript errors in unrelated files (header.tsx, login-page.tsx, generators-overview.tsx) documented in STATE.md as known issues. These don't affect auth routes and are out of scope for this plan.

## User Setup Required

**External services require manual configuration.** The user_setup section in the plan indicates:
- **Resend API Key**: Required for email verification and password reset
- **Resend sending domain**: Must be verified in Resend dashboard

Environment variables needed:
- `RESEND_API_KEY` - from Resend Dashboard -> API Keys
- `RESEND_FROM_EMAIL` - verified sending domain email

## Next Phase Readiness

**Ready for human verification checkpoint:**
- All route redirects wired
- Auth flows need end-to-end testing with Resend configured
- Phase 1 will be complete after user verifies flows work

**Pending:**
- Email verification flow depends on RESEND_API_KEY being set
- Password reset flow depends on email delivery working

---
*Phase: 01-core-authentication*
*Completed: 2026-01-21*
