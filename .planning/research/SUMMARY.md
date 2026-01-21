# Multi-Tenant Auth & Organization Research Summary

**Project:** Hospital Waste Management (HWM)
**Research Period:** 2026-01-21
**Research Focus:** Better Auth + Convex multi-tenant authentication infrastructure
**Status:** COMPLETE - Ready for roadmap phase planning

---

## Executive Summary

Hospital Waste Management requires a robust multi-tenant authentication system to support its hierarchical organizational model: treaters (primary tenants) provisioning generators (hospitals) and haulers (trucking partners). Research across four parallel domains confirms that **Better Auth 1.4.9 with Convex adapter 0.10.9 is production-ready for this use case**, providing battle-tested organization plugin capabilities, role-based access control, and cross-domain session sharing.

The architecture uses a bridge table pattern (`organizationLinks`) to map Better Auth's generic organizations to domain entities while maintaining explicit tenant filtering in all Convex queries. This approach aligns with 2026 SaaS security best practices around Zero Trust architecture and explicit tenant scoping. The invite-only provisioning model matches enterprise expectations and HWM's hierarchical business model.

**Key finding:** The technology stack is solid and existing in the brownfield setup. Roadmap success depends on disciplined implementation of three patterns: (1) explicit tenant context passing, (2) organization-scoped data queries, and (3) server-side authorization checks that never trust client-provided organization context.

---

## Key Findings by Research Domain

### Technology Stack (STACK.md)

**Verdict: HIGH confidence - Stack is already installed and partially configured**

**Core technologies (already in place):**
- Better Auth 1.4.9 with organization plugin (basic setup)
- @convex-dev/better-auth 0.10.9 (Convex adapter)
- Convex 1.31.3 serverless backend
- React 19, TanStack Router (file-based)
- Resend for email (invitation notifications)

**Required configuration changes (NOT new installs):**
1. **Access Control Definition** - Create `packages/convex/convex/lib/accessControl.ts` with role definitions (owner, admin, member)
2. **Organization Link Table** - Already exists in schema; just needs indexes verification
3. **Auth Helpers** - Create `packages/convex/convex/lib/orgAuth.ts` for membership/role checking patterns
4. **Client Configuration** - Update `packages/auth/src/client.ts` to add access control to organizationClient

**New QR/Waste Tracking features require:**
- `@yudiel/react-qr-scanner` 2.1.0 (mobile camera scanning)
- `qrcode.react` 4.2.0 (label generation)
- `react-signature-canvas` 1.1.0 (pickup confirmation)
- **No state machine library needed** - Use discriminated unions with TypeScript validators

**Confidence rationale:** Official Better Auth + Convex documentation verified. Component-mode integration is supported and documented. Version requirements already met. No external services beyond Resend (already configured).

---

### Feature Landscape (FEATURES.md)

**Verdict: HIGH confidence - Clear distinction between MVP priorities and post-MVP deferrals**

**Table Stakes (non-negotiable for competent SaaS):**
- Email/password authentication with verification
- Email-based password reset
- MFA (authenticator app) - enterprise requirement
- Session management with multi-app context
- Organization creation (treater onboarding)
- User invitation via email with role assignment
- User deactivation for offboarding security
- Tenant-scoped data isolation in all queries
- Role-based access control (RBAC)
- Audit logs for sensitive actions

**Differentiators (valuable but not MVP-blocking):**
- SSO (SAML/OAuth) - defer until $10K+ ARR customer
- Login history / device tracking
- Passwordless magic links (improves UX)
- Custom roles beyond admin/member (learn patterns first)
- Bulk user import CSV (post-MVP for large treaters)

**Anti-Features (explicitly do NOT build):**
- Public signup for generators - breaks business model
- Social login as primary auth - conflicts with invite-only
- Complexity theater: CAPTCHA on every login, complex password rules, forced 90-day rotation
- Domain verification for auto-provisioning - security risk if implemented wrong

**Feature dependency chain:**
1. Tenant isolation (foundation)
2. Authentication core
3. Organization creation
4. User invitation
5. Role-based access control
6. Audit logging

**Critical insight:** Invite-only model (treater admins provision generators/haulers) is table stakes, not a differentiator. It aligns with existing business model and enterprise security expectations.

---

### Architecture (ARCHITECTURE.md)

**Verdict: HIGH confidence - Clear integration pattern with brownfield compatibility**

**Core architectural decisions:**
- **Bridge pattern**: `organizationLinks` table maps Better Auth organizations (generic) to domain entities (treaters/generators/haulers)
- **Cross-domain auth**: `crossDomain` plugin enables session sharing across three apps on different ports
- **Organization-scoped queries**: All data access filtered by organization membership, NOT row-level security (RLS not needed in server-only context)
- **Active organization context**: Session tracks `activeOrganizationId` for multi-org users
- **App routing by org type**: Users auto-routed to correct app (generator/treater/trucking) based on organization type

**Authorization layers (defense in depth):**
1. Authentication (Better Auth session validation)
2. Organization membership check
3. Organization type validation
4. Role-based permission check
5. Data scoping by domain entity ID

**Build order confirmed across all research:**

| Phase | Focus | Deliverable | Success Criteria |
|-------|-------|-------------|------------------|
| 1 | Foundation | Basic auth, email verification, session management | User can sign up with verified email, session persists |
| 2 | Organization Bridge | organizationLinks, createTreaterWithOrganization | Treater/generator creation auto-creates Better Auth org |
| 3 | Data Scoping | Auth helpers, tenant-filtered queries | Cross-org data access prevented, error on unauthorized access |
| 4 | Cross-App Auth | Multi-app sign-in, organization type routing | Sign in once → authenticated across all three apps |
| 5 | Invitation Flow | inviteGeneratorAdmin, acceptance pages | Treater invites generator → generator admin gets email → accepts → joins |
| 6 | RBAC & Permissions | Permission checking utilities, UI guards | Members can't perform admin actions, UI reflects permissions |
| 7 | Testing & Hardening | Security audit, multi-org user testing | No cross-org leaks, all error cases handled |

**Key pattern: Organization-scoped queries**
```typescript
// Required pattern in every query/mutation:
1. Verify authentication
2. Get active organization from session
3. Resolve organization link to domain entity
4. Validate organization type matches endpoint
5. Scope all queries to organization's domain entity ID
```

**Critical anti-patterns to avoid:**
- Querying without tenant filter (data leak vulnerability)
- Client-side only authorization (server must re-verify)
- Storing sensitive domain data in organization metadata

---

### Pitfalls (PITFALLS.md)

**Verdict: HIGH confidence - 12 specific pitfalls documented with prevention strategies**

**Critical Pitfalls (rewrite-level severity):**

1. **Tenant Context Leakage** - Queries missing tenant filtering expose cross-org data
   - *Prevention:* Pass tenant context explicitly, validate at function entry, use typed custom functions
   - *Phase to address:* Phase 1 (establish pattern immediately)

2. **Role Explosion** - Start with 3 roles, discover you need 20+ specialized roles
   - *Prevention:* Define capabilities first, then group into roles; use ReBAC if scaling
   - *Phase to address:* Phase 1 (design correctly upfront)

3. **Brownfield Schema Mismatch** - Existing `users` table conflicts with Better Auth schema
   - *Prevention:* Add `betterAuthUserId` field to existing table, link via FK, plan migration path
   - *Phase to address:* Phase 1 (resolve before writing auth code)

4. **Session Context Lost on Org Switch** - Multi-org users switch orgs but operations execute against wrong tenant
   - *Prevention:* Explicit organization parameter on mutations, server-side active org tracking, validate on every request
   - *Phase to address:* Phase 2 (when multi-org membership possible)

5. **Invitation Security Holes** - Tokens expire, are reusable, or lack email verification
   - *Prevention:* 7-day expiration, single-use tokens, email verification, rate limiting, audit trail
   - *Phase to address:* Phase 3 (when invitation flow implemented)

**Moderate Pitfalls (technical debt or delays):**

6. **JWT Missing Tenant Context** - Extra DB lookups on every request for org membership
   - *Prevention:* Custom JWT claims or in-memory cache (defer until performance data available)

7. **Cross-App Session Inconsistency** - Session works in one app but not others
   - *Prevention:* Shared session domain, centralized auth service, consistent Better Auth config

8. **Privilege Creep Without Audit** - Users accumulate permissions over time, ex-employees retain access
   - *Prevention:* Role replacement (not addition), quarterly access reviews, audit logging

9. **Organization Hierarchy Permission Confusion** - Unclear if Treater admin automatically has Generator admin access
   - *Prevention:* Document hierarchy explicitly (read vs. write, implicit vs. explicit)

**Minor Pitfalls (annoying but fixable):**

10. **Version Mismatch** - Convex 1.25.0+ required for Better Auth adapter
11. **Missing Email Verification** - Users sign up with fake emails, can't receive notifications
12. **Password Reset Without Rate Limiting** - DoS via email flooding or user enumeration

**Testing checklist provided** with 20+ specific scenarios covering tenant isolation, RBAC, multi-org, invitations, sessions, and edge cases.

---

## Implications for Roadmap

### Recommended Phase Structure

Based on synthesized research, the project naturally breaks into **7 phases** with clear dependencies and deliverables:

**Phase 1: Core Auth Foundation (Weeks 1-2)**
- *Why first:* Everything depends on working authentication and tenant isolation
- *Rationale:* Establish tenant filtering pattern, auth helpers, and security foundation before building features
- *Pitfall prevention:* Tenant context leakage (#1), schema mismatch (#3), cross-app session (#7)
- *Deliverables:*
  - Email/password signup with verification
  - Password reset via secure email token
  - Session management with active organization context
  - Auth helper utilities (requireOrgMembership, getActiveOrganization)
  - organizationLinks table validation and indexes
- *Success criteria:*
  - New user can sign up with verified email
  - Session persists across page reloads
  - Multi-org user's active organization tracked correctly

**Phase 2: Organization Management & Bridging (Week 2-3)**
- *Why second:* Bridges Better Auth generic organizations to domain entities
- *Rationale:* Must complete before data scoping can work; enables treater/generator creation workflows
- *Pitfall prevention:* Session context loss (#4), hierarchy confusion (#9)
- *Deliverables:*
  - Add `betterAuthUserId` field to `users` table (migration for existing users)
  - Mutation: `createTreaterWithOrganization` (creates treater + Better Auth org + link)
  - Mutation: `createGeneratorWithOrganization` (treater creates generator + Better Auth org + link)
  - Organization type validation helpers
- *Success criteria:*
  - Creating treater automatically creates Better Auth org with metadata
  - organizationLinks correctly maps org to domain entity
  - Can resolve domain entity from org ID and vice versa

**Phase 3: Data Scoping & Query Refactoring (Week 3)**
- *Why third:* Converts brownfield queries to be organization-scoped
- *Rationale:* Implements core security pattern; must be complete before cross-app auth and permissions
- *Pitfall prevention:* Tenant context leakage (#1), client-side authorization (#7 anti-pattern)
- *Deliverables:*
  - Refactor existing queries: `listGenerators`, `listWasteBags`, `listCollectionRequests`, etc.
  - Add `treaterId`/`generatorId`/`haulerId` parameters to queries that lack them
  - Authorization layer: verify organization membership before returning data
  - Add database indexes for tenant fields if missing
- *Success criteria:*
  - Generator users only see their organization's waste bags
  - Treater users see all their generators' data
  - Attempting cross-org access throws error (not silent failure)

**Phase 4: Cross-App Authentication (Week 4)**
- *Why fourth:* Enables all three apps to work seamlessly with shared sessions
- *Rationale:* crossDomain plugin already configured; just needs client-side integration
- *Pitfall prevention:* Cross-app session inconsistency (#7)
- *Deliverables:*
  - Add auth client to generator app, treater app, trucking app
  - Sign-in/sign-up pages on each app
  - Organization type routing: detect org type, redirect to correct app if mismatch
  - "Switch organization" UI for multi-org users
- *Success criteria:*
  - Sign in on treater app → authenticated on generator and trucking apps
  - User auto-routed to correct app based on active organization type
  - Can switch between organizations without re-login

**Phase 5: Invitation Workflow (Week 4-5)**
- *Why fifth:* Enables team building and generator/hauler management by treaters
- *Rationale:* Depends on Phase 1-4 foundation; high business value
- *Pitfall prevention:* Invitation security holes (#5), role explosion (#2)
- *Deliverables:*
  - Mutation: `inviteGeneratorAdmin` (treater invites generator staff)
  - Mutation: `inviteHaulerAdmin` (treater invites hauler staff)
  - Invitation acceptance pages with token validation
  - Sign-up flow for new invitees (accept invite → create account → join org)
  - Member management UI: list members, remove members, update roles
  - Email sending for invitation notifications (Resend integration)
- *Success criteria:*
  - Treater can invite generator admin via email
  - Invitee receives email with accept link (7-day expiration)
  - Clicking link creates account + joins organization
  - Generator admin can access generator app after accepting

**Phase 6: Role-Based Access Control & Permissions (Week 5)**
- *Why sixth:* Implements fine-grained permissions after core structure is stable
- *Rationale:* Pattern clarity emerges from Phase 1-5; avoids premature role design
- *Pitfall prevention:* Role explosion (#2), privilege creep (#8)
- *Deliverables:*
  - Access control definition file with resource/action matrix
  - Fixed roles: owner, admin, member (from Better Auth org plugin)
  - Domain roles remain: treater, generator, hauler, driver (separate from org roles)
  - Permission checking utilities for sensitive mutations
  - Permission-aware UI: hide actions user can't perform
  - Audit log table and logging of sensitive actions
- *Success criteria:*
  - Members can't perform admin actions (enforced at API level)
  - Generator users can't access treater functions
  - UI reflects available permissions
  - Audit log captures who did what, when, in which organization

**Phase 7: Testing, Hardening & Documentation (Week 6)**
- *Why seventh:* Validates security and reliability after all features implemented
- *Rationale:* Prevents shipping with obvious security gaps
- *Pitfall prevention:* Version mismatch (#10), email verification (#11), rate limiting (#12)
- *Deliverables:*
  - Security audit: cross-org access prevention, permission bypass attempts, session expiration
  - Multi-org user testing: user belongs to 2+ orgs, data isolation maintained
  - Performance profiling: identify slow auth queries for later optimization
  - Comprehensive error handling and recovery flows
  - Documentation: hierarchy permissions, role definitions, authorization patterns
  - Rate limiting on password reset (CAPTCHA after 3 failures)
- *Success criteria:*
  - No cross-org data leakage
  - All error cases handled gracefully
  - Multi-org users work correctly
  - Performance acceptable (defer micro-optimization to Phase 8+)

### Roadmap Timeline

```
Week 1: Phase 1 (Core Auth) + Phase 2 starts (Org Bridge)
Week 2: Phase 2 (Org Bridge) + Phase 3 starts (Data Scoping)
Week 3: Phase 3 (Data Scoping) + Phase 4 starts (Cross-App Auth)
Week 4: Phase 4 (Cross-App Auth) + Phase 5 starts (Invitations)
Week 5: Phase 5 (Invitations) + Phase 6 starts (RBAC)
Week 6: Phase 6 (RBAC) + Phase 7 (Testing & Hardening)
```

**Total estimate: 6 weeks** for complete multi-tenant auth infrastructure (subject to team capacity and external blockers).

### Which Phases Need Deeper Research

**Phases with standard, well-documented patterns (no additional research needed):**
- Phase 1: Core auth patterns published in Better Auth + Convex official docs
- Phase 3: Data scoping pattern established in Convex authorization guides
- Phase 4: Cross-domain sessions documented in Better Auth crossDomain plugin docs
- Phase 6: RBAC patterns documented in authorization best practices across industry

**Phases potentially needing deeper research during planning:**
- Phase 2: **Organization hierarchy permission model** - Research needed to decide: Does Treater admin automatically view child org data? This is HWM-specific business logic, not a standard pattern.
- Phase 5: **Invitation workflow edge cases** - Specific to invite-only model; may need research on phishing prevention and email deliverability during implementation.
- Phase 7: **Audit logging compliance** - DENR Philippines regulatory requirements may dictate which actions must be logged and retention policies.

**Recommend:** Schedule `/gsd:research-phase` for Phases 2 (hierarchy permissions) and 7 (regulatory audit requirements) during the requirements definition stage.

---

## Confidence Assessment

| Area | Confidence | Basis | Gaps/Caveats |
|------|------------|-------|--------------|
| **Stack choices** | HIGH | Official Better Auth + Convex docs, npm package verification, version requirements met | QR/waste tracking libs could use live integration testing |
| **Feature prioritization** | HIGH | Industry best practices (SaaS auth, 2026 enterprise expectations), PRD alignment | HWM-specific role hierarchy needs clarification |
| **Architecture pattern** | HIGH | Convex authorization docs, Better Auth organization plugin docs, multi-tenant best practices | Brownfield schema mismatch requires careful migration planning |
| **Build order** | HIGH | Clear dependency chains, phase-by-phase success criteria | Teams with slower velocity may need to resequence phases |
| **Pitfall prevention** | HIGH | Security research (OWASP), specific Better Auth issues, multi-tenancy incident reports | Organization switching context loss (#4) needs testing with real Better Auth version |
| **Timeline estimate** | MEDIUM | 6 weeks for complete infrastructure assumes mid-sized team (2-3 eng). Actual velocity unknown. | No adjustment for team size, existing codebase friction, or external integration delays |

**Overall confidence: HIGH** — Stack is proven, patterns are documented, roadmap sequence is logical. Implementation success depends on discipline in applying security patterns (tenant filtering, server-side auth checks) rather than on technical unknowns.

---

## Gaps to Address During Requirements Definition

1. **Organization Hierarchy Permissions (Phase 2 blocker)**
   - *Question:* When Treater admin creates Generator, what permissions do they get?
   - *Options:*
     - Model A (Implicit): Treater admin can view/edit all child orgs (simple but less secure)
     - Model B (Explicit): Treater admin must be invited to each org (complex but stronger isolation)
   - *Resolution needed before Phase 2*

2. **Regulatory Audit Requirements (Phase 7 blocker)**
   - *Question:* What does DENR Philippines require for audit trail compliance?
   - *Specifics:* Which actions must be logged? Retention period? Export format?
   - *Resolution needed for audit logging design*

3. **QR Code Workflow Integration**
   - *Question:* How do QR codes link to waste bags during collection?
   - *Current research:* Stack identifies libraries; not yet integrated with waste lifecycle
   - *Resolution needed during Phase 3 (data scoping) to ensure queries support scanning workflow*

4. **Email Deliverability & Bounce Handling**
   - *Question:* Resend is configured, but what's error handling for bounced invitations?
   - *Edge cases:* Invalid email in invitation, domain blocks (e.g., hospital firewall)
   - *Resolution needed during Phase 5 (invitation workflow)*

5. **Performance Targets for Multi-Tenant Queries**
   - *Question:* What's acceptable latency for "list generators" when treater has 50+ generators?
   - *Current plan:* Indexes on tenant fields; may need optimization later
   - *Resolution needed if Phase 3 queries are slow*

---

## Sources Aggregated from Research

**Official Documentation (HIGH confidence):**
- [Better Auth Organization Plugin](https://www.better-auth.com/docs/plugins/organization)
- [Better Auth Convex Integration](https://www.better-auth.com/docs/integrations/convex)
- [Convex Authorization Best Practices](https://stack.convex.dev/authorization)
- [Convex Row-Level Security](https://stack.convex.dev/row-level-security)

**npm Package Verification (HIGH confidence):**
- @convex-dev/better-auth (v0.10.9) - Convex adapter
- @yudiel/react-qr-scanner (v2.1.0) - Mobile scanning
- qrcode.react (v4.2.0) - QR generation
- react-signature-canvas (v1.1.0) - Signature capture

**Industry Best Practices (HIGH confidence):**
- [SaaS Multi-Tenancy Components and Best Practices](https://frontegg.com/)
- [Multi-Tenant Authorization](https://www.permit.io/blog/best-practices-for-multi-tenant-authorization)
- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [NIST Password Guidelines 2024](https://www.nist.gov/)

**Research Articles & Incident Reports (MEDIUM-HIGH confidence):**
- Tenant isolation security patterns (2025)
- Better Auth GitHub issues (specific version bugs and workarounds)
- Multi-tenant SaaS architecture case studies

---

## Next Steps for Roadmapper

1. **Validate organization hierarchy model** with product/business team (Gap #1)
2. **Confirm regulatory audit requirements** with legal/compliance (Gap #2)
3. **Define audit logging scope** for DENR compliance (Gap #2)
4. **Confirm timeline & team capacity** for 6-week roadmap
5. **Schedule Phase 2 research** for organization switching edge cases
6. **Identify any brownfield blockers** during Phase 1 (auth helpers, schema migration)

---

**Summary prepared:** 2026-01-21
**Researcher:** 4 parallel agents synthesized by Opus
**Status:** Ready for roadmap phase planning
