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

**Phase:** Phase 1 - Core Authentication (1 of 6)
**Plan:** 01-02 complete, 01-03 next (3 plans in phase)
**Status:** In progress
**Last activity:** 2026-01-21 - Completed 01-02-PLAN.md (SSR Auth Integration)

```
Progress: [████░░░░░░░░░░░░░░░░] ~6%

Phase 1: Core Authentication        [████░░░░░░] 2/3 plans (01-01, 01-02 done)
Phase 2: Organization Bridge        [░░░░░░░░░░] 0/? plans
Phase 3: Organization Management    [░░░░░░░░░░] 0/? plans
Phase 4: Team Management            [░░░░░░░░░░] 0/? plans
Phase 5: Role-Based Access Control  [░░░░░░░░░░] 0/? plans
Phase 6: Cross-App Authentication   [░░░░░░░░░░] 0/? plans
```

---

## Performance Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Plans Completed | 2/3 (Phase 1) | 3/3 | In Progress |
| Phases Completed | 0/6 | 6/6 | In Progress |
| Commits This Phase | 7 | - | On Track |
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

### Immediate (Phase 1 In Progress)

- [x] Complete 01-01-PLAN.md (Auth Proxy Route)
- [x] Execute 01-02-PLAN.md (SSR Auth Integration)
- [ ] Execute 01-03-PLAN.md (Email Verification)
- [ ] Verify Better Auth component is configured correctly in convex.json
- [ ] Confirm Resend API key is set for email verification

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

---

## Session Continuity

### Last Session Summary

**Date:** 2026-01-21
**Activity:** Executed 01-02-PLAN.md (SSR Auth Integration)
**Outcome:** Wired SSR auth flow with ConvexBetterAuthProvider and replaced mock auth

**Commits:**
- `9b9746b` - feat(01-02): add convexQueryClient to router context
- `226e916` - feat(01-02): add SSR auth token loading in root layout
- `0470e93` - feat(01-02): replace mock auth with Better Auth integration

**Files Modified:**
- apps/treater/src/router.tsx
- apps/treater/src/routes/__root.tsx
- apps/treater/src/contexts/auth-context.tsx

**Key Patterns Established:**
- SSR auth flow: beforeLoad -> getToken -> ConvexBetterAuthProvider
- Auth state: useConvexAuth for isAuthenticated, Better Auth session for user details

### Next Session Goals

1. Execute 01-03-PLAN.md (Email Verification flow)
2. Test full auth flow with Convex dev server
3. Complete Phase 1 implementation

### Context for Next Claude

**What you're building:** Multi-tenant auth infrastructure for hospital waste management platform. Treaters create and manage generators (hospitals) and haulers (trucking partners) with role-based access control.

**Where we are:** Plans 01-01 and 01-02 complete. Auth proxy route at `/api/auth/$` is ready. SSR auth flow wired with ConvexBetterAuthProvider. Next is 01-03 (Email Verification).

**What's special:** Using Better Auth organization plugin with bridge table pattern (organizationLinks) to map Better Auth's generic orgs to domain entities (treaters/generators/haulers). All queries must be organization-scoped for tenant isolation.

**Key files:**
- `apps/treater/src/lib/auth-server.ts` - Server-side auth helpers (getToken)
- `apps/treater/src/routes/api/auth/$.ts` - Auth proxy route
- `apps/treater/src/routes/__root.tsx` - SSR auth loading + ConvexBetterAuthProvider
- `apps/treater/src/contexts/auth-context.tsx` - useConvexAuth-based auth context

**Key constraint:** Better Auth 1.4.10 + Convex adapter 0.10.9 already installed. Config exists in packages/convex/convex/auth.ts.

---

**State initialized:** 2026-01-21 after roadmap creation
**Last update:** 2026-01-21 after 01-02-PLAN.md completion
