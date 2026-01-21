# Roadmap: HWM v1.1 Authentication + Organization Management

**Project:** Hospital Waste Management (HWM)
**Milestone:** v1.1 Authentication + Organization Management
**Created:** 2026-01-21
**Depth:** Standard (6 phases, 3-5 plans each)

## Overview

This roadmap implements multi-tenant authentication infrastructure for HWM, enabling treaters (treatment facilities) to provision and manage generators (hospitals) and haulers (trucking partners) with role-based access control. The implementation uses Better Auth 1.4.10 with Convex adapter, bridging Better Auth's generic organization model to HWM's domain entities through an organization link table pattern. All 29 v1.1 requirements are mapped across 6 phases that deliver progressive capabilities from basic authentication through cross-app session sharing.

## Phases

### Phase 1: Core Authentication

**Goal:** Users can securely authenticate with email/password, verify accounts, and maintain sessions.

**Dependencies:** None (foundation phase)

**Requirements:**
- AUTH-01: Treater can sign up with email and password
- AUTH-02: Treater receives email verification after signup
- AUTH-03: Treater can log in with email and password
- AUTH-04: User session persists across browser refresh
- AUTH-07: User can reset password via email link

**Success Criteria:**
1. New user can sign up on treater app with email/password
2. User receives verification email and can verify account
3. User can log in and session persists across page reloads
4. User can reset forgotten password via email link
5. Session data includes active organization context

**Key Deliverables:**
- Better Auth server configuration in packages/convex/convex/auth.ts
- Auth helper utilities (getAuthenticatedUser, getActiveOrganization)
- Sign-up/sign-in pages on treater app (port 3002)
- Email verification flow with Resend integration
- Password reset flow with secure token validation
- organizationLinks table indexes validation

**Plans:** 5 plans

Plans:
- [x] 01-01-PLAN.md — TanStack Start auth proxy and server helpers
- [x] 01-02-PLAN.md — SSR auth flow with ConvexBetterAuthProvider
- [x] 01-03-PLAN.md — Auth UI redirect logic and route protection
- [x] 01-04-PLAN.md — Wire AuthProvider and update Header (gap closure)
- [x] 01-05-PLAN.md — Clean up dead code and fix type exports (gap closure)

---

### Phase 2: Organization Bridge

**Goal:** Better Auth organizations are automatically linked to HWM domain entities (treaters, generators, haulers).

**Dependencies:** Phase 1 (requires working authentication)

**Requirements:**
- ORG-01: Treater creates generator organization with initial owner
- ORG-02: Treater creates hauler organization with initial owner

**Success Criteria:**
1. Creating treater automatically creates Better Auth organization and link
2. Treater can create generator organization with initial admin
3. Treater can create hauler organization with initial admin
4. organizationLinks table correctly maps Better Auth org to domain entity
5. Can resolve domain entity from organization ID and vice versa

**Key Deliverables:**
- Add betterAuthUserId field to users table with index
- Migration script for existing users (if any)
- Mutation: createTreaterWithOrganization
- Mutation: createGeneratorWithOrganization
- Mutation: createHaulerWithOrganization
- Organization type validation helpers
- Organization link resolution utilities

**Plans:** 3 plans

Plans:
- [x] 02-01-PLAN.md — Schema updates (parentBetterAuthOrgId, betterAuthUserId)
- [x] 02-02-PLAN.md — Organization resolution helpers
- [x] 02-03-PLAN.md — Atomic organization creation mutations

---

### Phase 3: Organization Management

**Goal:** Treaters can view and manage their generators and haulers with organization-scoped data.

**Dependencies:** Phase 2 (requires organization bridge)

**Requirements:**
- ORG-03: Treater views list of their generators
- ORG-04: Treater views list of their haulers
- ORG-05: Treater can view generator organization details
- ORG-06: Treater can view hauler organization details

**Success Criteria:**
1. Treater sees only their own generators (not other treaters' generators)
2. Treater sees only their linked haulers
3. Generator detail page shows organization info and members
4. Hauler detail page shows organization info and members
5. All queries enforce organization-scoped data access

**Key Deliverables:**
- Refactor existing queries with organization scoping pattern
- Query: listGenerators (scoped to treater)
- Query: listHaulers (scoped to treater)
- Query: getGeneratorDetails (with authorization check)
- Query: getHaulerDetails (with authorization check)
- Organization management UI on treater app
- Database indexes for tenant fields (treaterId, generatorId, haulerId)

**Plans:** 4 plans

Plans:
- [x] 03-01-PLAN.md — Add authentication to generator/hauler queries
- [x] 03-02-PLAN.md — Wire GeneratorsOverview to Convex data
- [x] 03-03-PLAN.md — Create HaulersOverview component
- [x] 03-04-PLAN.md — Generator and hauler detail pages

---

### Phase 4: Team Management

**Goal:** Organization owners/admins can invite team members, assign roles, and manage teams.

**Dependencies:** Phase 3 (requires organization management)

**Requirements:**
- AUTH-05: Generator user can log in (account created by treater)
- AUTH-06: Hauler user can log in (account created by treater)
- TEAM-01: Org owner can invite team members via email
- TEAM-02: Invited user receives email with signup/join link
- TEAM-03: Org owner/admin can assign roles (owner, admin, member)
- TEAM-04: Org owner/admin can remove team members
- TEAM-05: Team member list shows name, email, role, status

**Success Criteria:**
1. Treater can invite generator admin via email
2. Invited user receives email with accept link (7-day expiration)
3. Generator admin clicks link, creates account, and joins organization
4. Generator user can log in to generator app (port 3001)
5. Hauler user can log in to trucking app (port 3003)
6. Organization owner/admin can view member list with roles
7. Organization owner/admin can update member roles
8. Organization owner/admin can remove team members

**Key Deliverables:**
- Mutation: inviteGeneratorAdmin (treater invites generator staff)
- Mutation: inviteHaulerAdmin (treater invites hauler staff)
- Invitation acceptance pages with token validation
- Sign-up flow for new invitees (accept invite → create account → join org)
- Member management UI: list members, remove members, update roles
- Email sending for invitation notifications (Resend integration)
- Add auth client to generator app (port 3001)
- Add auth client to trucking app (port 3003)

---

### Phase 5: Role-Based Access Control

**Goal:** Permissions are enforced based on organization roles and domain roles, with scoped data visibility.

**Dependencies:** Phase 4 (requires team management)

**Requirements:**
- RBAC-01: Owner role has full access including billing
- RBAC-02: Admin role can manage team and settings
- RBAC-03: Member role can use features only
- RBAC-04: Role-based UI shows appropriate features per role
- RBAC-05: Treaters see own data + linked generators/haulers
- RBAC-06: Generators see only their own org data
- RBAC-07: Haulers see only their own org data

**Success Criteria:**
1. Members cannot perform admin actions (enforced at API level)
2. Generator users cannot access treater functions
3. Hauler users cannot access generator or treater functions
4. Treaters can view all their generators' waste data
5. Generators can only view their own waste data
6. UI hides actions user cannot perform based on role
7. Audit log captures sensitive actions (who, what, when, which org)

**Key Deliverables:**
- Access control definition file with resource/action matrix
- Permission checking utilities (requireRole, requireOrgType)
- Refactor sensitive mutations with permission checks
- Permission-aware UI components (conditional rendering)
- Audit log table and logging for sensitive actions
- Data scoping layer for all cross-org queries
- Authorization middleware for server-side enforcement

---

### Phase 6: Cross-App Authentication

**Goal:** Users can authenticate once and access all three apps seamlessly with organization-based routing.

**Dependencies:** Phase 5 (requires RBAC and data scoping)

**Requirements:**
- XAUTH-01: Session works across generator app (port 3001)
- XAUTH-02: Session works across treater app (port 3002)
- XAUTH-03: Session works across trucking app (port 3003)
- XAUTH-04: User redirected to appropriate app based on org type

**Success Criteria:**
1. Sign in on treater app → authenticated on generator and trucking apps
2. Sign in on generator app → authenticated on treater and trucking apps
3. User with generator org is auto-routed to generator app
4. User with hauler org is auto-routed to trucking app
5. Multi-org users can switch organizations without re-login
6. Session state consistent across all three apps

**Key Deliverables:**
- crossDomain plugin integration (already configured, needs client setup)
- Organization type routing middleware
- "Switch organization" UI for multi-org users
- Auto-redirect logic based on active organization type
- Sign-in pages on all three apps
- Session synchronization testing across apps
- Error handling for cross-app session inconsistencies

---

## Progress

| Phase | Status | Requirements | Completion |
|-------|--------|--------------|------------|
| Phase 1: Core Authentication | Complete | 5/29 | 100% |
| Phase 2: Organization Bridge | Complete | 2/29 | 100% |
| Phase 3: Organization Management | Complete | 4/29 | 100% |
| Phase 4: Team Management | Pending | 7/29 | 0% |
| Phase 5: Role-Based Access Control | Pending | 7/29 | 0% |
| Phase 6: Cross-App Authentication | Pending | 4/29 | 0% |
| **Total** | **In Progress** | **29/29** | **~38%** |

---

## Coverage Verification

| Category | Requirements | Mapped | Status |
|----------|--------------|--------|--------|
| Authentication | 7 | 7 | Complete |
| Organization Management | 6 | 6 | Complete |
| Team Management | 5 | 5 | Complete |
| Role-Based Access Control | 7 | 7 | Complete |
| Cross-App Authentication | 4 | 4 | Complete |
| **Total** | **29** | **29** | **100%** |

All 29 v1.1 requirements mapped. No orphaned requirements.

---

## Research Flags

Based on research/SUMMARY.md analysis:

| Phase | Research Needed | Priority | Status |
|-------|-----------------|----------|--------|
| Phase 2 | Organization hierarchy permission model (does Treater admin auto-view child org data?) | High | Complete |
| Phase 5 | DENR Philippines audit logging requirements (what must be logged, retention) | Medium | Pending |
| Phase 4 | Invitation workflow edge cases (email deliverability, phishing prevention) | Low | Pending |

Schedule `/gsd:research-phase` for Phase 2 (hierarchy permissions) during requirements definition.

---

## Timeline Estimate

Based on standard depth (3-5 plans per phase) and research recommendations:

- Phase 1: 1-2 weeks (foundation is critical)
- Phase 2: 1 week (straightforward bridge pattern)
- Phase 3: 1 week (query refactoring)
- Phase 4: 1-2 weeks (invitation flow complexity)
- Phase 5: 1 week (permission layer)
- Phase 6: 1 week (cross-domain testing)

**Total:** 6-8 weeks (subject to team capacity and external blockers)

---

**Last updated:** 2026-01-21
**Next step:** `/gsd:discuss-phase 4` to gather context for Team Management phase
