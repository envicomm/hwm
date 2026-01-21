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

**Phase:** Phase 1 - Core Authentication
**Plan:** Not started (awaiting `/gsd:plan-phase 1`)
**Status:** Pending
**Progress:** 0/29 requirements completed (0%)

```
Progress: [░░░░░░░░░░░░░░░░░░░░] 0%

Phase 1: Core Authentication        [░░░░░░░░░░] 0/5 requirements
Phase 2: Organization Bridge        [░░░░░░░░░░] 0/2 requirements
Phase 3: Organization Management    [░░░░░░░░░░] 0/4 requirements
Phase 4: Team Management            [░░░░░░░░░░] 0/7 requirements
Phase 5: Role-Based Access Control  [░░░░░░░░░░] 0/7 requirements
Phase 6: Cross-App Authentication   [░░░░░░░░░░] 0/4 requirements
```

---

## Performance Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Requirements Completed | 0/29 | 29/29 | Not Started |
| Phases Completed | 0/6 | 6/6 | Not Started |
| Plans Completed | 0/0 | TBD | Not Started |
| Coverage | 100% | 100% | On Track |
| Estimated Timeline | 6-8 weeks | 6-8 weeks | On Track |

---

## Accumulated Context

### Key Decisions Made

| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| 2026-01-21 | Use Better Auth organization plugin with bridge table pattern | Separates auth concerns from domain logic; Better Auth manages generic orgs, organizationLinks maps to domain entities | Architecture: organizationLinks table required; all queries need org scoping |
| 2026-01-21 | Treater is primary tenant, creates generators/haulers | Matches business model; simplifies access control | Organization model: invite-only provisioning, no self-registration |
| 2026-01-21 | Haulers exclusive to one treater | Simplifies data scoping; aligns with typical business relationships | Schema: haulers → treaterId (not many-to-many) |
| 2026-01-21 | Standard role hierarchy (owner/admin/member) | Common SaaS pattern; sufficient for initial needs | RBAC: 3 org roles + 5 domain roles (generator/treater/hauler/driver/admin) |
| 2026-01-21 | Organization-scoped queries over RLS | Convex is server-only; auth happens at function boundaries | Security: explicit tenant filtering in all queries |

### Architecture Patterns Established

**Organization Bridge Pattern:**
```
Better Auth organization (generic)
        ↓ (betterAuthOrgId)
organizationLinks (bridge table)
        ↓ (organizationType + entity ID)
Domain entity (treaters/generators/haulers)
```

**Authorization Layers (defense in depth):**
1. Authentication (Better Auth session validation)
2. Organization membership check
3. Organization type validation
4. Role-based permission check
5. Data scoping by domain entity ID

**Query Pattern (tenant isolation):**
```typescript
// Required pattern in every query/mutation:
1. Verify authentication → getAuthenticatedUser(ctx)
2. Get active organization → getActiveOrganization(ctx)
3. Resolve organization link → organizationLinks lookup
4. Validate organization type → requireOrgType(ctx, "treater")
5. Scope all queries → filter by treaterId/generatorId/haulerId
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

### Immediate (Phase 1 Prep)

- [ ] Run `/gsd:plan-phase 1` to decompose Core Authentication into plans
- [ ] Resolve brownfield schema questions (are there existing users to migrate?)
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
| None currently | — | — | — | — |

---

## Session Continuity

### Last Session Summary

**Date:** 2026-01-21
**Activity:** Roadmap creation via `/gsd:roadmap`
**Outcome:** Created 6-phase roadmap mapping all 29 v1.1 requirements

**Files Modified:**
- Created: .planning/ROADMAP.md
- Created: .planning/STATE.md
- Updated: .planning/REQUIREMENTS.md (traceability section)

### Next Session Goals

1. Run `/gsd:plan-phase 1` to create executable plans for Core Authentication
2. Verify Better Auth setup is complete
3. Create first plan for email/password signup implementation
4. Begin Phase 1 implementation

### Context for Next Claude

**What you're building:** Multi-tenant auth infrastructure for hospital waste management platform. Treaters create and manage generators (hospitals) and haulers (trucking partners) with role-based access control.

**Where we are:** Just finished roadmap. Phase 1 (Core Authentication) is next. 5 requirements: signup, email verification, login, session persistence, password reset.

**What's special:** Using Better Auth organization plugin with bridge table pattern (organizationLinks) to map Better Auth's generic orgs to domain entities (treaters/generators/haulers). All queries must be organization-scoped for tenant isolation.

**Key constraint:** Better Auth 1.4.10 + Convex adapter 0.10.9 already installed. Don't reinstall. Config exists in packages/convex/convex/auth.ts. Just need to implement queries/mutations and UI.

---

**State initialized:** 2026-01-21 after roadmap creation
**Next update:** After Phase 1 planning
