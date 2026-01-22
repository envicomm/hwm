# Project State: HWM v1.1

**Last Updated:** 2026-01-22
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

**Phase:** Phase 5 - Role-Based Access Control (5 of 6)
**Plan:** 5/6 plans complete
**Status:** In progress
**Last activity:** 2026-01-22 - Completed 05-05-PLAN.md (Protected Mutations)

```
Progress: [█████████████████████░] ~85%

Phase 1: Core Authentication        [██████████] 5/5 plans complete
Phase 2: Organization Bridge        [██████████] 3/3 plans complete
Phase 3: Organization Management    [██████████] 4/4 plans complete
Phase 4: Team Management            [██████████] 4/4 plans complete
Phase 5: Role-Based Access Control  [█████████░] 5/6 plans complete
Phase 6: Cross-App Authentication   [░░░░░░░░░░] 0/? plans
```

---

## Performance Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Plans Completed | 21 total (5 Phase 1, 3 Phase 2, 4 Phase 3, 4 Phase 4, 5 Phase 5) | - | On Track |
| Phases Completed | 4/6 (Phase 5 in progress) | 6/6 | On Track |
| Requirements Complete | 13/29 | 29/29 | On Track |
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
| 2026-01-21 | Index routes redirect to dashboard | Generator and hauler lists are on main dashboard | Clean URL structure, no duplicate list pages |
| 2026-01-21 | Detail pages query organization links separately | Can use specific api.organizationLinks.index.getByGenerator/getByHauler | Shows Better Auth organization ID for debugging |
| 2026-01-21 | Display serviceArea instead of fleetSize for haulers | fleetSize doesn't exist in schema, serviceArea does | UI matches actual data model |
| 2026-01-21 | Conditional location cards in detail pages | Location data is optional in schema | UI degrades gracefully when location not provided |
| 2026-01-22 | Route invitation URLs based on organizationType metadata | Each org type routes to its respective app for invitation acceptance | Env vars: GENERATOR_APP_URL, TRUCKING_APP_URL for production |
| 2026-01-22 | Use auth.api.createInvitation for invitation mutations | Better Auth handles invitation creation, expiration, and email callback | Mutations verify entity exists before creating invitation |
| 2026-01-22 | Replicate treater SSR auth pattern to generator/trucking apps | Ensures consistent auth experience across all apps | All apps: auth-server.ts + api/auth/$.ts + ConvexBetterAuthProvider |
| 2026-01-22 | Move AuthProvider from router.Wrap to __root.tsx | AuthProvider needs Convex context for useConvexAuth hook | AuthProvider now inside ConvexBetterAuthProvider wrapper |
| 2026-01-22 | Store invitation token in sessionStorage for post-signup flow | Users may need to sign up first; token persists across signup redirect | All accept-invitation routes use this pattern |
| 2026-01-22 | Create domain user immediately after invitation acceptance | Links Better Auth user to domain users table with correct org reference | createDomainUserFromInvitation mutation handles this |
| 2026-01-22 | Use nullish coalescing for optional name fallback | Proper TypeScript narrowing for optional user.name field | Prevents type errors in domain user creation |
| 2026-01-22 | Use Better Auth client API for member operations | authClient.organization.listMembers/updateMemberRole/removeMember provides direct access | No custom Convex queries needed for basic member management |
| 2026-01-22 | Use query parameter structure for Better Auth client | Better Auth client methods use `{ query: { organizationId } }` wrapper for GET requests | Consistent pattern across listMembers, listInvitations |
| 2026-01-22 | Use organizationType validator from organizationLinks for audit logs | Ensures audit logs use same type validator as organization bridge | Schema consistency across audit and organization tables |
| 2026-01-22 | Permission matrix uses readonly arrays for type safety | TypeScript as const assertion prevents mutations, enables type inference | PERMISSIONS object is immutable at type level |
| 2026-01-22 | requirePermission throws ConvexError with FORBIDDEN code | Consistent with existing error handling in lib/auth.ts | Structured error responses for permission denials |
| 2026-01-22 | Use Better Auth API (getActiveMember, getSession) for org context | authComponent.getAuthUser returns only user doc, not session with activeOrganizationId | resolveUserContext uses API calls for org ID and role |
| 2026-01-22 | Fail-safe org role defaults to 'member' on API error | Prevents privilege escalation if Better Auth API is temporarily unavailable | System remains functional, users limited to member actions until verified |
| 2026-01-22 | AuditEvent uses domain.action format (e.g., generator.created) | Clear categorization of audit events by domain | All audit logging follows consistent naming |
| 2026-01-22 | Audit logger is async and awaitable | Ensures logging completes before mutation returns | All audit calls use await ctx.audit(...) |
| 2026-01-22 | treaterId inferred from UserContext in mutations | Simplifies API, enforces only authenticated treaters can create generators/haulers | BREAKING: treaterId removed from create args |
| 2026-01-22 | Partnership-specific audit events added | Audit completeness - partnership ops distinct from CRUD | New events: partnership_created/reactivated/removed |
| 2026-01-22 | Permission check ordering: access first, then permission | Ensures domain boundary checked before role check | All protected mutations follow this pattern |

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

**Invitation Pattern (04-02):**
```typescript
// Create invitation via Better Auth API:
1. Get auth context -> authComponent.getAuth(createAuth, ctx)
2. Verify entity exists -> ctx.db.get(entityId)
3. Get Better Auth org ID -> getBetterAuthOrgFromEntity(ctx, type, entityId)
4. Create invitation -> auth.api.createInvitation({ email, role, organizationId })
5. Return invitation metadata with entity name for UI confirmation

// sendInvitationEmail routes by org type:
- generator -> GENERATOR_APP_URL (localhost:3001)
- hauler -> TRUCKING_APP_URL (localhost:3003)
- treater -> siteUrl (localhost:3002)
```

**Invitation Acceptance Pattern (04-03):**
```typescript
// User clicks invitation link with ?token=xxx
// All apps use identical accept-invitation.tsx route

// Flow:
1. If not authenticated:
   - Store token in sessionStorage
   - Show signup form (AuthView)
   - Redirect back to /accept-invitation after signup
2. If authenticated (or after signup redirect):
   - Retrieve token from URL or sessionStorage
   - Call authClient.organization.acceptInvitation({ invitationId: token })
   - Call createDomainUserFromInvitation mutation with user details
   - Call authClient.organization.setActive({ organizationId: orgId })
   - Clear sessionStorage and redirect to /dashboard

// Domain user creation:
- Looks up organizationLinks by betterAuthOrgId
- Determines role from organizationType (generator/hauler/treater)
- Creates user with appropriate entity reference (generatorId/haulerId/treaterId)
```

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

### Phase 4 In Progress

- [x] Complete 04-01-PLAN.md (Multi-App SSR Auth)
- [x] Complete 04-02-PLAN.md (Invitation Mutations)
- [x] Complete 04-03-PLAN.md (Invitation Acceptance)
- [x] Complete 04-04-PLAN.md (Team Management UI) - parallel execution

### User Actions Required

- [ ] **USER ACTION:** Configure Resend API key for email verification
- [ ] **USER ACTION:** Verify full auth flow end-to-end
- [ ] **USER ACTION:** Set GENERATOR_APP_URL and TRUCKING_APP_URL for production

### Phase 5 In Progress

- [x] Complete 05-01-PLAN.md (RBAC Foundation)
- [x] Complete 05-02-PLAN.md (User Context and Custom Functions)
- [x] Complete 05-03-PLAN.md (Audit Log Mutations)
- [x] Complete 05-04-PLAN.md (Data Scoping Utilities)
- [x] Complete 05-05-PLAN.md (Protected Mutations)
- [ ] Complete 05-06-PLAN.md (Permission UI Integration)

### Upcoming (Next Phases)

- [ ] Research DENR audit logging requirements (Phase 5 - schema done, needs retention policy)
- [x] Define comprehensive permission matrix (Phase 5) - COMPLETE in 05-01

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

**Date:** 2026-01-22
**Activity:** Executed Phase 5 Plan 05 (Protected Mutations)
**Outcome:** Generator and hauler mutations refactored with protectedMutation, permission checks, and audit logging

**Commits:**
- `a848390` - feat(05-05): refactor generator mutations with permission checks
- `23ee62c` - feat(05-05): refactor hauler mutations with permission checks

**Files Modified:**
- `packages/convex/convex/generators/mutations.ts` - 3 mutations refactored with protectedMutation + permissions + audit
- `packages/convex/convex/haulers/mutations.ts` - 5 mutations refactored with protectedMutation + permissions + audit
- `packages/convex/convex/lib/audit.ts` - Added partnership audit events

**Key Outcomes:**
- All generator mutations (create, update, remove) now use protectedMutation
- All hauler mutations (create, update, remove, createPartnership, removePartnership) now use protectedMutation
- Permission checks: owner/admin for create/update, owner only for delete
- Domain access checks via requireGeneratorAccess/requireHaulerAccess
- Audit logging for all sensitive operations
- treaterId now inferred from user context (BREAKING: removed from create args)

**Deviations:**
- Fixed schema mismatch in plan code (serviceArea type, partnership fields)
- Added partnership-specific audit events (partnership_created/reactivated/removed)

### Next Session Goals

1. Execute 05-06-PLAN.md (Permission UI Integration)
2. Complete Phase 5 Role-Based Access Control
3. Begin Phase 6 Cross-App Authentication planning

### Context for Next Claude

**What you're building:** Multi-tenant auth infrastructure for hospital waste management platform. Treaters create and manage generators (hospitals) and haulers (trucking partners) with role-based access control.

**Where we are:** Phase 5 nearly complete. Plans 05-01 through 05-05 complete. Ready for 05-06 (Permission UI Integration).

**What's special:** Using Better Auth organization plugin with bridge table pattern (organizationLinks) to map Better Auth's generic orgs to domain entities. PERMISSIONS matrix defines resource/action/role mappings for authorization. All generator/hauler mutations now use protectedMutation with permission checks and audit logging.

**Key files (Phase 5 complete):**
- `packages/convex/convex/lib/permissions.ts` - PERMISSIONS matrix, hasPermission, requirePermission
- `packages/convex/convex/lib/userContext.ts` - UserContext type, resolveUserContext, requireUserContext
- `packages/convex/convex/lib/customFunctions.ts` - protectedQuery, protectedMutation wrappers with audit logging
- `packages/convex/convex/lib/audit.ts` - AuditEvent types (including partnership events) and createAuditLogger
- `packages/convex/convex/lib/dataScoping.ts` - getAccessibleGenerators, getAccessibleHaulers, canAccess*, require*Access
- `packages/convex/convex/generators/mutations.ts` - Permission-protected generator mutations
- `packages/convex/convex/haulers/mutations.ts` - Permission-protected hauler mutations

**Key patterns (05-05):**
- protectedMutation provides ctx.user (UserContext) and ctx.audit (AuditLogger)
- Permission check ordering: access check first, then permission check
- Org type guard at start of create mutations (treater-only)
- Audit logging at end of successful mutation

**Key constraints:**
- Better Auth 1.4.10 + Convex adapter 0.10.9
- Import Convex API from @hwm/convex root (barrel export)
- Use api.folder.index.functionName pattern
- convex-helpers 0.1.111 for customQuery/customMutation

---

**State initialized:** 2026-01-21 after roadmap creation
**Last update:** 2026-01-22 after Phase 5 Plan 05 completion
