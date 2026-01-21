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

**Phase:** Phase 3 - Organization Management (3 of 6) - IN PROGRESS
**Plan:** 2/4 plans complete (03-01, 03-02)
**Status:** Dashboard shows real generators with organization scoping
**Last activity:** 2026-01-21 - Completed 03-02-PLAN.md (Generator Dashboard UI)

```
Progress: [█████████░░░░░░░░░░░] ~30%

Phase 1: Core Authentication        [██████████] 5/5 plans complete ✓
Phase 2: Organization Bridge        [██████████] 3/3 plans complete ✓
Phase 3: Organization Management    [█████░░░░░] 2/4 plans complete
Phase 4: Team Management            [░░░░░░░░░░] 0/? plans
Phase 5: Role-Based Access Control  [░░░░░░░░░░] 0/? plans
Phase 6: Cross-App Authentication   [░░░░░░░░░░] 0/? plans
```

---

## Performance Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Plans Completed | 10 total (5 Phase 1, 3 Phase 2, 2 Phase 3) | - | On Track |
| Phases Completed | 2/6 (Phase 3 in progress) | 6/6 | In Progress |
| Requirements Complete | 9/29 | 29/29 | On Track |
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
| 2026-01-21 | Use authComponent.getAuth pattern within mutations to call auth.api.createOrganization | Enables Better Auth API calls from Convex mutation context | All organization creation uses this pattern |
| 2026-01-21 | Accept orphaned Better Auth orgs if Convex writes fail (cleanup job for production) | Better Auth org creation is HTTP call before Convex transaction; if Convex fails, orphan exists | MVP tradeoff - cleanup job can be added later |
| 2026-01-21 | Create treaterHaulerPartners record atomically with hauler creation | Establishes hauler-treater relationship immediately (haulers table has no treaterId field) | Partnership exists from creation, no separate linking step needed |
| 2026-01-21 | Add treaterId argument to generator detail queries | Prevents cross-tenant access by requiring caller to prove they know which treater owns the generator | getById and getWithOrgLink now require treaterId parameter |
| 2026-01-21 | Verify hauler partnerships through treaterHaulerPartners table | Haulers don't have direct treaterId - access is many-to-many through partnerships | Detail queries check active partnership exists before returning hauler data |
| 2026-01-21 | Remove insecure getAll query from haulers | Query returned all haulers without any tenant scoping | Clients must use getByTreater which properly scopes to partnerships |
| 2026-01-21 | Import Convex API from @hwm/convex root barrel export | Package exports api, Doc, Id through src/index.ts barrel | Use `import { api } from "@hwm/convex"` not `@hwm/convex/_generated/api` |
| 2026-01-21 | Access Convex queries via folder.index.functionName notation | Convex generates API with /index barrel exports | Use `api.generators.index.getByTreater` to access queries through barrel |
| 2026-01-21 | useActiveTreater pattern for tenant context in React components | Combines Better Auth active org with Convex organizationLinks resolution | All dashboard components use useActiveTreater to get treaterId |
| 2026-01-21 | Stub computed fields until wasteBags queries available | Storage utilization, pending/treated counts require aggregating wasteBags data | Display placeholder values (0) in UI, calculate in future phase |
| 2026-01-21 | Client-side filtering for active/inactive generators | Small dataset, simpler query logic, instant filter changes | Fetch all generators (includeInactive: true) and filter in component |

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
1. Verify authentication -> requireAuth(ctx)
2. Detail queries verify ownership:
   - Generator queries: verify generator.treaterId === args.treaterId
   - Hauler queries: verify active partnership via treaterHaulerPartners
3. List queries scope by tenant:
   - getByTreater filters by treaterId
   - Uses proper indexes (by_treater, by_generator, by_hauler)
4. Throw ConvexError for unauthorized access
```

**Atomic Organization Creation Pattern (02-03):**
```typescript
// Create domain entity + Better Auth org + link atomically:
1. Get auth context -> authComponent.getAuth(createAuth, ctx)
2. Get parent org (for child orgs) -> getBetterAuthOrgFromEntity(ctx, "treater", treaterId)
3. Generate slug -> name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
4. Create Better Auth org -> auth.api.createOrganization({ name, slug, metadata })
5. Create domain entity -> ctx.db.insert("treaters|generators|haulers", {...})
6. Create link -> ctx.db.insert("organizationLinks", makeOrgLinkData(...))
7. Create partnership (haulers only) -> ctx.db.insert("treaterHaulerPartners", {...})
```
- Top-level orgs (treaters): no parentBetterAuthOrgId
- Child orgs (generators, haulers): set parentBetterAuthOrgId to parent's betterAuthOrgId
- Note: If Convex writes fail after Better Auth org created, orphan exists (acceptable for MVP)

### Open Questions

1. **DENR Philippines Audit Requirements (Phase 5 blocker)**
   - Question: What must be logged for DENR compliance?
   - Specifics: Which actions, retention period, export format?
   - Status: Needs legal/compliance input before audit logging design

2. **Multi-Org User UX (Phase 6)**
   - Question: How should "switch organization" UI work for users in multiple orgs?
   - Status: Will design during Phase 6 planning based on Phase 1-5 learnings

---

## TODO List

### Phase 2 Complete

- [x] Complete 02-01-PLAN.md (Schema Bridge Fields)
- [x] Complete 02-02-PLAN.md (Organization Resolution Helpers)
- [x] Complete 02-03-PLAN.md (Atomic Organization Creation)
- [ ] **USER ACTION:** Configure Resend API key for email verification
- [ ] **USER ACTION:** Verify full auth flow end-to-end

### Upcoming (Next Phases)

- [ ] Research DENR audit logging requirements (Phase 5)
- [ ] Design invitation acceptance UX (Phase 4)
- [ ] Define comprehensive permission matrix (Phase 5)

### Research Needed

- [ ] Contact legal/compliance for DENR audit requirements (Phase 5)
- [ ] Test Better Auth crossDomain plugin with actual 3-app setup (Phase 6)

---

## Blockers

| Blocker | Impact | Mitigation | Owner | Status |
|---------|--------|------------|-------|--------|
| Pre-existing TS errors in communications module | Low - doesn't affect auth routes | Fix types in communications/email/index.ts | Dev | Known Issue |
| Resend API key not configured | High - email verification won't work | User must add RESEND_API_KEY env var | User | Pending |

---

## Session Continuity

### Last Session Summary

**Date:** 2026-01-21
**Activity:** Executed Phase 3 Plan 02 (Generator Dashboard UI)
**Outcome:** Created useActiveTreater hook and refactored GeneratorsOverview to use real Convex data

**Commits:**
- `0ad73b8` - feat(03-02): create useActiveTreater hook
- `a54c263` - feat(03-02): refactor GeneratorsOverview to use real Convex data

**Files Created:**
- `apps/treater/src/hooks/use-active-treater.ts` - Hook to resolve treaterId from Better Auth active org

**Files Modified:**
- `apps/treater/src/components/dashboard/generators-overview.tsx` - Refactored to fetch real data from Convex

**Key Outcomes:**
- useActiveTreater hook resolves Better Auth organization to Convex treaterId
- GeneratorsOverview fetches real generator data via api.generators.index.getByTreater
- Loading skeleton and error states implemented
- Generator cards render with real Convex data (name, address, contact, qrMode, capacity, status)
- Established pattern for organization-scoped dashboard components

**Deviations:**
- None - plan executed exactly as written

### Next Session Goals

1. Continue Phase 3: Organization Management
2. Execute 03-03-PLAN.md (Hauler Dashboard Overview)
3. Execute 03-04-PLAN.md (Organization Switcher)
4. Complete Phase 3 with all organization management features

### Context for Next Claude

**What you're building:** Multi-tenant auth infrastructure for hospital waste management platform. Treaters create and manage generators (hospitals) and haulers (trucking partners) with role-based access control.

**Where we are:** Phase 1 and 2 complete. Phase 3 has 2/4 plans complete (03-01, 03-02). Dashboard now shows generators with real Convex data.

**What's special:** Using Better Auth organization plugin with bridge table pattern (organizationLinks) to map Better Auth's generic orgs to domain entities. All queries require authentication and enforce tenant isolation. Dashboard components use useActiveTreater hook to get tenant context.

**Key files (Phase 3 so far):**
- `packages/convex/convex/generators/queries.ts` - Authenticated generator queries with treaterId verification
- `packages/convex/convex/haulers/queries.ts` - Authenticated hauler queries with partnership verification
- `apps/treater/src/hooks/use-active-treater.ts` - Resolves treaterId from Better Auth active organization
- `apps/treater/src/components/dashboard/generators-overview.tsx` - Generator list component with real Convex data

**Key constraints:**
- Better Auth 1.4.10 + Convex adapter 0.10.9
- Import Convex API from @hwm/convex root (barrel export)
- Access queries via api.generators.index.functionName notation
- Use useActiveTreater for tenant context in components
- Computed fields (storage utilization, pending/treated counts) stubbed until wasteBags queries available

---

**State initialized:** 2026-01-21 after roadmap creation
**Last update:** 2026-01-21 after Phase 3 Plan 02 completion
