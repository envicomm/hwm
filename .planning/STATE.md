# Project State: HWM v1.1

**Last Updated:** 2026-01-21
**Milestone:** v1.1 Authentication + Organization Management

## Project Reference

**Core Value:** Treaters can manage their complete waste tracking ecosystem — creating and overseeing generators and haulers with role-based access control — ensuring regulatory compliance and operational visibility.

**Current Focus:** Building multi-tenant authentication infrastructure with Better Auth + Convex to enable secure organization management across three React applications.

**Tech Stack:**
- Frontend: React 19, TanStack Router (file-based), TanStack Query, Tailwind CSS 4, shadcn/ui
- Backend: Convex 1.31.3 (serverless database + functions)
- Auth: Better Auth 1.4.10 with @convex-dev/better-auth 0.10.9
- Email: Resend (invitation notifications)

---

## Current Position

**Phase:** Phase 2 - Organization Bridge (2 of 6)
**Plan:** 02-01 complete (1 of ~4 plans in phase)
**Status:** Phase 2 in progress - schema bridge fields complete
**Last activity:** 2026-01-21 - Completed 02-01-PLAN.md (Schema Bridge Fields)

```
Progress: [██░░░░░░░░░░░░░░░░░░] ~12%

Phase 1: Core Authentication        [██████████] 5/5 plans complete
Phase 2: Organization Bridge        [██░░░░░░░░] 1/4 plans
Phase 3: Organization Management    [░░░░░░░░░░] 0/? plans
Phase 4: Team Management            [░░░░░░░░░░] 0/? plans
Phase 5: Role-Based Access Control  [░░░░░░░░░░] 0/? plans
Phase 6: Cross-App Authentication   [░░░░░░░░░░] 0/? plans
```

---

## Performance Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Plans Completed | 6 total (5 Phase 1, 1 Phase 2) | - | On Track |
| Phases Completed | 1/6 | 6/6 | In Progress |
| Commits This Phase | 1 | - | On Track |
| Coverage | 100% | 100% | On Track |

---

## Accumulated Context

### Key Decisions Made

| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| 2026-01-21 | Use Better Auth organization plugin with bridge table pattern | Separates auth concerns from domain logic; Better Auth manages generic orgs, organizationLinks maps to domain entities | Architecture: organizationLinks table required; all queries need org scoping |
| 2026-01-21 | Treater is primary tenant, creates generators/haulers | Matches business model; simplifies access control | Organization model: invite-only provisioning, no self-registration |
| 2026-01-21 | Haulers exclusive to one treater | Simplifies data scoping; aligns with typical business relationships | Schema: haulers -> treaterId (not many-to-many) |
| 2026-01-21 | Standard role hierarchy (owner/admin/member) | Common SaaS pattern; sufficient for initial needs | RBAC: 3 org roles + 5 domain roles (generator/treater/hauler/driver/admin) |
| 2026-01-21 | Organization-scoped queries over RLS | Convex is server-only; auth happens at function boundaries | Security: explicit tenant filtering in all queries |
| 2026-01-21 | Use process.env for server-side code in TanStack Start | TanStack Start server-side code requires process.env, not import.meta.env | All server-side auth code must use process.env |
| 2026-01-21 | Add SSR noExternal config for @convex-dev/better-auth | Required for proper SSR bundling | All app vite configs need ssr.noExternal setting |
| 2026-01-21 | Use useConvexAuth for auth state (not useSession) | Better Auth reflects authenticated before Convex validates token, causing race conditions | Auth context must use useConvexAuth as source of truth |
| 2026-01-21 | AuthContextType changed to Better Auth API | Replaced login/logout with signIn/signUp/signOut | Breaking change for useAuth() consumers |
| 2026-01-21 | Use context.isAuthenticated for route guards | Root beforeLoad provides isAuthenticated from server token check | More reliable than localStorage checks |
| 2026-01-21 | Use parameterized route redirect format | TanStack Router requires params object for dynamic segments | Format: { to: "/auth/$authView", params: { authView: "sign-in" } } |
| 2026-01-21 | Use AuthView redirectTo prop | @daveyplate/better-auth-ui passes redirectTo through useOnSuccessTransition | Cleaner than manual callback handling |
| 2026-01-21 | Optional parentBetterAuthOrgId for hierarchy tracking | Enables "all child organizations" queries without domain table joins | Simpler queries, better performance for hierarchy traversal |
| 2026-01-21 | Optional betterAuthUserId for backward compatibility | Supports existing users and users created before Better Auth integration | Graceful migration path, no breaking changes |
| 2026-01-21 | Export organizationType validator | Provides type safety for mutations that validate organization types | Better TypeScript support in organization management code |

### Architecture Patterns Established

**Organization Bridge Pattern:**
```
Better Auth organization (generic)
        | (betterAuthOrgId)
organizationLinks (bridge table)
        | (organizationType + entity ID)
Domain entity (treaters/generators/haulers)
```

**Authorization Layers (defense in depth):**
1. Authentication (Better Auth session validation)
2. Organization membership check
3. Organization type validation
4. Role-based permission check
5. Data scoping by domain entity ID

**Auth Proxy Pattern (01-01):**
```
Client request -> /api/auth/$ -> auth-server.ts handler -> Convex Better Auth
```
- Route at `/api/auth/$` catches all auth requests (sign-in, sign-up, sign-out, etc.)
- Server helpers from `@/lib/auth-server` for SSR contexts

**SSR Auth Flow Pattern (01-02):**
```
beforeLoad (server) -> getToken() -> setAuth(token) -> ConvexBetterAuthProvider
```
- createServerFn wraps getToken for server execution
- Token passed to ConvexBetterAuthProvider as initialToken
- useConvexAuth for auth state, Better Auth session for user details

**Route Protection Pattern (01-03):**
```typescript
// Protected route (e.g., dashboard.tsx):
beforeLoad: async ({ context }) => {
  if (!context.isAuthenticated) {
    throw redirect({ to: "/auth/$authView", params: { authView: "sign-in" } });
  }
}

// Auth route (e.g., auth.$authView.tsx):
beforeLoad: async ({ context }) => {
  if (context.isAuthenticated) {
    throw redirect({ to: "/dashboard" });
  }
}
```

**Query Pattern (tenant isolation):**
```typescript
// Required pattern in every query/mutation:
1. Verify authentication -> getAuthenticatedUser(ctx)
2. Get active organization -> getActiveOrganization(ctx)
3. Resolve organization link -> organizationLinks lookup
4. Validate organization type -> requireOrgType(ctx, "treater")
5. Scope all queries -> filter by treaterId/generatorId/haulerId
```

### Open Questions

1. **Organization Hierarchy Permissions (Phase 2 blocker)**
   - Question: When Treater admin creates Generator, what permissions do they get?
   - Options:
     - Model A (Implicit): Treater admin can view/edit all child orgs (simple but less secure)
     - Model B (Explicit): Treater admin must be invited to each org (complex but stronger isolation)
   - Status: Needs business decision before Phase 2 planning

2. **DENR Philippines Audit Requirements (Phase 5 blocker)**
   - Question: What must be logged for DENR compliance?
   - Specifics: Which actions, retention period, export format?
   - Status: Needs legal/compliance input before audit logging design

3. **Multi-Org User UX (Phase 6)**
   - Question: How should "switch organization" UI work for users in multiple orgs?
   - Status: Will design during Phase 6 planning based on Phase 1-5 learnings

---

## TODO List

### Immediate (Phase 1 Complete)

- [x] Complete 01-01-PLAN.md (Auth Proxy Route)
- [x] Execute 01-02-PLAN.md (SSR Auth Integration)
- [x] Execute 01-03-PLAN.md (Auth Redirect Wiring)
- [x] Execute 01-04-PLAN.md (AuthProvider Integration)
- [x] Execute 01-05-PLAN.md (Gap Closure - dead code cleanup)
- [ ] **USER ACTION:** Configure Resend API key for email verification
- [ ] **USER ACTION:** Verify full auth flow end-to-end

### Upcoming (Next Phases)

- [ ] Decide organization hierarchy permission model (Phase 2 blocker)
- [ ] Research DENR audit logging requirements (Phase 5)
- [ ] Plan migration strategy for existing users table (Phase 2)
- [ ] Design invitation acceptance UX (Phase 4)
- [ ] Define comprehensive permission matrix (Phase 5)

### Research Needed

- [ ] Schedule `/gsd:research-phase 2` for organization hierarchy permissions
- [ ] Contact legal/compliance for DENR audit requirements (Phase 5)
- [ ] Test Better Auth crossDomain plugin with actual 3-app setup (Phase 6)

---

## Blockers

| Blocker | Impact | Mitigation | Owner | Status |
|---------|--------|------------|-------|--------|
| Pre-existing TS errors in treater app | Low - doesn't affect auth routes | Fix TanStack Router types in other route files | Dev | Known Issue |
| Resend API key not configured | High - email verification won't work | User must add RESEND_API_KEY env var | User | Pending |

---

## Session Continuity

### Last Session Summary

**Date:** 2026-01-21
**Activity:** Executed 02-01-PLAN.md (Schema Bridge Fields)
**Outcome:** Added organization hierarchy and Better Auth user linking to schema

**Commits:**
- `73b0d72` - fix(02-02): register organizationLinks table in schema (bundled all 3 tasks)

**Files Modified:**
- packages/convex/convex/schema/organizationLinks.ts (added parentBetterAuthOrgId + index)
- packages/convex/convex/schema/users.ts (added betterAuthUserId + index)
- packages/convex/convex/schema/index.ts (exported organizationType, fixed duplicate)

**Key Outcomes:**
- organizationLinks supports hierarchy queries via parentBetterAuthOrgId
- users table can resolve Better Auth users via betterAuthUserId
- Schema deployed successfully with new indexes
- Pre-existing TypeScript errors in communications module remain (not plan-related)

### Next Session Goals

1. Continue Phase 2: Organization Bridge plans
2. Build organization mutations that use these new schema fields
3. Implement organization hierarchy traversal helpers

### Context for Next Claude

**What you're building:** Multi-tenant auth infrastructure for hospital waste management platform. Treaters create and manage generators (hospitals) and haulers (trucking partners) with role-based access control.

**Where we are:** Phase 1 complete (Core Authentication). Phase 2 in progress - just completed 02-01 (Schema Bridge Fields). Schema now has parentBetterAuthOrgId for hierarchy tracking and betterAuthUserId for Better Auth linking.

**What's special:** Using Better Auth organization plugin with bridge table pattern (organizationLinks) to map Better Auth's generic orgs to domain entities (treaters/generators/haulers). All queries must be organization-scoped for tenant isolation.

**Key files:**
- Phase 1 (Auth): `apps/treater/src/lib/auth-server.ts`, `apps/treater/src/routes/api/auth/$.ts`, `apps/treater/src/contexts/auth-context.tsx`
- Phase 2 (Org Bridge): `packages/convex/convex/schema/organizationLinks.ts`, `packages/convex/convex/schema/users.ts`

**Key constraint:** Better Auth 1.4.10 + Convex adapter 0.10.9 already installed. Schema changes must be backward-compatible (optional fields).

---

**State initialized:** 2026-01-21 after roadmap creation
**Last update:** 2026-01-21 after 02-01-PLAN.md execution (Schema Bridge Fields)
