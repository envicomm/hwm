# Plan 06-04: Cross-App Authentication Testing

**Status:** Complete (tests deferred)
**Completed:** 2026-01-22

## Objective

Comprehensive testing of cross-app authentication to verify XAUTH-01 through XAUTH-04 requirements.

## Deliverables

| Deliverable | Status | Notes |
|-------------|--------|-------|
| Test environment setup | ✓ Complete | Added VITE_CONVEX_SITE_URL to all apps |
| Session sharing tests | ⏸ Deferred | User requested skip |
| Organization routing tests | ⏸ Deferred | User requested skip |

## Tasks Completed

### Task 1: Prepare test environment

**Commit:** `329fd3e`

**What was done:**
- Discovered missing `VITE_CONVEX_SITE_URL` environment variable causing auth page errors
- Added `VITE_CONVEX_SITE_URL=https://polite-lynx-19.convex.site` to all three apps' `.env.local` files
- Updated all `.env.example` files to document this required variable

**Files modified:**
- `apps/generator/.env.example`
- `apps/treater/.env.example`
- `apps/trucking/.env.example`
- `apps/generator/.env.local` (local only)
- `apps/treater/.env.local` (local only)
- `apps/trucking/.env.local` (local only)

### Task 2: Cross-app session sharing tests (XAUTH-01, XAUTH-02, XAUTH-03)

**Status:** Deferred by user request

**Tests defined but not executed:**
1. Session sharing from treater to other apps
2. Session sharing from generator to other apps
3. Session sharing from trucking to other apps
4. Sign out propagation across apps

### Task 3: Organization-based routing tests (XAUTH-04)

**Status:** Deferred by user request

**Tests defined but not executed:**
1. Auto-redirect based on org type (generator → port 3001)
2. Auto-redirect for hauler org (hauler → port 3003)
3. No redirect for correct org type
4. Auth pages exempt from redirect
5. No redirect loops

## Architecture Verified (Code Review)

While manual tests were skipped, the implementation was verified through code review:

1. **Session sharing:** Better Auth crossDomain plugin configured in `packages/auth/src/server.ts` with all three app domains
2. **Organization routing:** `shouldRedirectToApp()` in `packages/auth/src/routing.ts` correctly maps org types to apps
3. **Exempt paths:** `isRoutingExemptPath()` properly excludes `/auth`, `/accept-invitation`, `/api/auth`
4. **SSR detection:** `getCurrentAppOrgTypeSSR()` uses port numbers for server-side app detection

## Deviations

| Deviation | Reason | Impact |
|-----------|--------|--------|
| Manual tests skipped | User requested to proceed without testing | XAUTH requirements not manually verified; recommend testing before production |

## Recommendations

Before deploying to production:
1. Run the session sharing tests (Tests 1-4) to verify cross-app auth
2. Run the organization routing tests (Tests 5-9) to verify auto-redirect
3. Test with actual multi-org users in a staging environment

## Key Files

- `packages/auth/src/routing.ts` - App routing helpers
- `apps/*/src/routes/__root.tsx` - Organization-type routing in beforeLoad
- `apps/*/.env.example` - Environment variable documentation
