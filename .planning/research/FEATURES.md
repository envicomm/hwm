# Feature Landscape: Multi-Tenant Authentication and Organization Management

**Domain:** Multi-tenant B2B SaaS authentication and organization management
**Researched:** 2026-01-21
**Confidence:** HIGH

## Executive Summary

Multi-tenant authentication and organization management for B2B SaaS in 2026 has a well-established set of table stakes features driven by enterprise compliance requirements (SOC 2, GDPR) and security best practices (Zero Trust). The key insight for HWM: **the invite-only provisioning model aligns with enterprise expectations** where treaters act as primary tenants provisioning generators and haulers.

The research reveals that 86% of organizations now prioritize SaaS security, with enterprises requiring SOC 2 or ISO 27001 at minimum. The shift toward Zero Trust architecture and continuous verification dominates 2026 security thinking.

## Table Stakes

Features users expect. Missing = product feels incomplete or insecure.

### Authentication Core

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Email/password authentication | Universal baseline for web apps | Low | NIST 2024 updates: focus on length over complexity |
| Email verification on signup | Prevents fraud, trial abuse, compliance audit trail | Low | Blocks throwaway emails, required for multi-tenant security |
| Password reset via email | Standard recovery mechanism | Low | Must use cryptographically secure tokens, invalidate after use |
| MFA (authenticator app, SMS) | Enterprise security requirement, reduces account takeover by 99.9% | Medium | Not optional for compliance - SOC 2, GDPR expect it |
| Session management | Maintain user context, secure logout | Medium | Zero Trust: continuous verification, not perimeter-based |
| Rate limiting on auth attempts | Prevent brute force, credential stuffing | Low | NIST recommends mandatory cooling-off periods |

### Organization Management

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Organization creation | Primary tenant onboarding | Low | For HWM: Treater creates their org first |
| User invitation via email | Standard B2B provisioning pattern | Medium | Include inviter name, customize message, set permissions before sending |
| Role assignment (admin/member) | Permission enforcement foundation | Medium | Roles live on organization memberships, not users |
| User deactivation/reactivation | Offboarding security - 31% of ex-employees retain access without this | Medium | Critical security gap - prevents orphaned accounts |
| Organization switching (for multi-org users) | Common for consultants, agencies, employees in multiple workspaces | Medium | JWT-based with tenant context in token claims |
| User list/directory | Admin visibility into team | Low | Filter by role, status |

### Permission Enforcement

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Tenant-scoped data isolation | Core security for multi-tenancy | High | Every query must filter by tenant - data leaks otherwise |
| Role-based access control (RBAC) | Authorization foundation for B2B SaaS | Medium | Permissions scoped per tenant - user can be admin in one org, viewer in another |
| Permission checks in API layer | Prevent unauthorized access | Medium | Every mutation verifies role + tenant context |
| Route/UI guards based on role | Hide inaccessible features | Low | Complement to API checks, not replacement |

### Audit & Compliance

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Audit log of sensitive actions | Enterprise requirement - "many prospects require this" | Medium | Log: user logins, role changes, invitation sent/accepted, user deactivated |
| Timestamp on all records | Compliance and debugging | Low | createdAt, updatedAt on all entities |
| User activity tracking | SOC 2, ISO 27001 compliance evidence | Medium | Who did what, when, in which org context |

## Differentiators

Features that set product apart. Not expected, but valued.

### Enhanced Security

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| SSO (SAML/OAuth) | Enterprise requirement for larger customers, reduces password fatigue | High | Not needed for MVP - typically $10K+ ARR customers |
| Directory Sync (SCIM) | Enterprise-grade user lifecycle management, auto-provisioning | High | For large treaters with 100+ users - post-MVP |
| Domain verification | Automatic org membership for verified domains, JIT provisioning | Medium | Security risk if implemented incorrectly - DNS takeover attacks |
| Passwordless login (magic links) | Improves UX without sacrificing security | Medium | Can improve activation rates |
| Social login (Google OAuth) | Faster signup, fewer passwords | Low | May conflict with invite-only model for HWM |
| Login history/device tracking | Security transparency for users | Medium | Shows "Logged in from Manila on Chrome" |

### Advanced Organization Features

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Custom roles (beyond admin/member) | Fine-grained permission control | High | Defer until clear role patterns emerge from usage |
| Granular permissions (resource-level) | Enterprise control requirements | High | Example: "Can only edit own generator's waste bags" |
| Organization hierarchy | Multi-location enterprises | High | Not needed for HWM - flat structure sufficient |
| Team/department segmentation | Large org structure | Medium | Defer - not clear need from PRD |
| Bulk user import (CSV) | Onboard 50+ users at once | Medium | Valuable for large treaters |
| API keys/service accounts | Programmatic access, integrations | Medium | Future for API ecosystem |

### User Experience Enhancements

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Profile management | Self-service for name, email, phone, password | Low | Reduces support burden |
| Notification preferences | Email/SMS control | Low | Integrates with existing Resend/Twilio |
| Timezone/locale settings | International deployments | Low | Important if expanding beyond Philippines |
| Profile photos/avatars | Personal touch, team recognition | Low | Nice but not critical |
| Pending invitations view | See who hasn't accepted yet, resend | Low | Useful for admins tracking onboarding |
| Invitation expiry (7-14 days) | Security best practice | Low | Auto-cleanup of unused invites |

### Billing Integration

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Seat/user limits by plan | Monetization strategy | Medium | 2026 trend: moving away from per-seat toward usage-based |
| Active user count display | Plan compliance transparency | Low | "5/10 users active" |
| Block new users at limit | Enforce plan boundaries | Low | Require upgrade or deactivate others first |
| Usage-based billing hooks | Modern pricing model | Medium | For HWM: consider billing by waste volume, not users |

## Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

### Self-Service Signup for Sub-Tenants

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Allow generators to self-register | Breaks HWM business model - treaters need control over which hospitals they service | Invite-only provisioning by treater admins |
| Public signup form for anyone | Opens door to spam, compliance issues, unqualified leads | Treater creates generator org explicitly |
| Social login as primary auth | Conflicts with invite-only model, harder to track org membership | Email invitations with password setup |

### Over-Complicated Permissions

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Custom roles on day 1 | Premature optimization - don't know usage patterns yet | Start with 3-5 fixed roles based on PRD (generator/treater/hauler/driver/admin) |
| Resource-level permissions (row-level) in MVP | Complex to implement correctly, easy to create security holes | Tenant-scoped queries + role checks |
| Permission inheritance/cascading | Confusing mental model, hard to debug | Flat permission structure |

### Security Theater

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Security questions for password reset | OWASP explicitly warns against this as sole mechanism | Email-based reset with secure tokens |
| Password complexity requirements (special chars) | NIST 2024 removed this - length matters more | Enforce 12+ character minimum, no complexity rules |
| Forced password rotation (90 days) | NIST 2024 removed this - causes weak passwords, reuse | Only force reset on breach detection |
| CAPTCHA on every login | Friction without benefit - use after failed attempts | Rate limiting + CAPTCHA after 3 failures |

### Enterprise Features Too Early

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| SSO (SAML) in MVP | High complexity, only needed for large enterprise customers | Defer until $10K+ ARR customer requests it |
| Directory Sync (SCIM) in MVP | Complex integration, needed for 100+ user orgs | Manual invitation sufficient for early customers |
| Domain claiming/verification | Security risk if implemented incorrectly (DNS takeover) | Defer until clear enterprise need |
| Advanced audit log export | Complex feature for compliance teams | Basic audit log sufficient for MVP |

### UI/UX Bloat

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| In-app chat/messaging | Scope creep - HWM is waste tracking, not collaboration platform | Email notifications + SMS for critical updates |
| User profiles as social network | Wrong mental model for B2B compliance software | Minimal profile: name, email, role, org |
| Gamification (badges, points) | Wrong tone for regulatory compliance domain | Focus on compliance metrics, not engagement tricks |

## Feature Dependencies

```
Organization Creation (Treater)
  ├─> User Invitation
  │     ├─> Email Verification
  │     ├─> Role Assignment
  │     └─> Password Setup
  ├─> Generator/Hauler Org Creation (by Treater)
  │     └─> Sub-tenant User Invitation
  └─> Permission Enforcement
        ├─> Tenant-scoped Queries
        ├─> Role Checks
        └─> Audit Logging
```

**Critical Path:**
1. Tenant isolation (data filtering) - must be foundation
2. Authentication (email/password) - basic access
3. Organization creation - primary tenant onboarding
4. User invitation - team building
5. Role-based access control - permission enforcement
6. Audit logging - compliance evidence

**Dependencies:**
- MFA depends on authentication core
- Organization switching depends on multiple org memberships
- Permission checks depend on role assignment
- Sub-tenant provisioning (generators by treaters) depends on org management core

## MVP Recommendation

For MVP, prioritize in this order:

### Phase 1: Foundation (Week 1-2)
1. **Tenant-scoped data filtering** - Every Convex query must filter by organizationId
2. **Email/password authentication** - Convex Auth or Clerk
3. **Email verification** - Prevent fraud/abuse
4. **Password reset** - Via secure email token
5. **Session management** - JWT with tenant context

### Phase 2: Organization Core (Week 2-3)
6. **Organization creation (Treater)** - Primary tenant onboarding
7. **User invitation workflow** - Email with acceptance flow
8. **Role assignment** - Fixed roles from PRD (generator/treater/hauler/driver/admin)
9. **Permission enforcement** - API layer checks on mutations
10. **User deactivation** - Offboarding security

### Phase 3: Compliance & Polish (Week 3-4)
11. **Audit logging** - Track sensitive actions (login, role change, invite, deactivation)
12. **MFA (authenticator app)** - Enterprise security requirement
13. **Profile management** - Self-service name/email/password
14. **Organization switching** - For users in multiple orgs
15. **User directory** - Admin view of team members

### Defer to Post-MVP

**Good features, wrong time:**
- SSO (SAML/OAuth) - Wait for $10K+ ARR customer
- Directory Sync (SCIM) - Wait for 100+ user org
- Domain verification - Security complexity + unclear need
- Custom roles - Learn usage patterns first
- Granular permissions - Start with role-based, add if needed
- Billing/seat limits - Pricing model TBD
- Passwordless/social login - Invite-only model is higher priority
- API keys - Wait for integration demand

**Complexity vs. Value:**
- API-level permission checks are HIGH value (security) for MEDIUM complexity - do in MVP
- SSO is LOW value (small customers don't need it) for HIGH complexity - defer
- Audit logging is HIGH value (compliance) for MEDIUM complexity - do in MVP
- Custom roles is UNKNOWN value (no usage data) for HIGH complexity - defer

## HWM-Specific Considerations

### Invite-Only Model Alignment

**Why this works for HWM:**
- Treaters control their network of generators (hospitals) and haulers
- No public signup = curated ecosystem, compliance control
- Matches existing business relationships (contracts before platform access)
- Enterprise expectation: "Admin-provisioning model gives customer more control" (Auth0 research)

### Role Mapping to PRD

| Role (PRD) | Org Type | Key Permissions |
|------------|----------|-----------------|
| `treater` | Treater | Manage generators/haulers, process waste, generate certificates |
| `generator` | Generator | Log waste, request collection, view certificates |
| `hauler` | Hauler | Dispatch management, fleet oversight |
| `driver` | Hauler | Mobile pickup/delivery, QR scanning |
| `admin` | Treater | Cross-organization visibility, system config |

**Implementation note:** The `admin` role is special - it's a treater user with elevated cross-org permissions. Should be implemented as a flag on treater role rather than separate role value.

### Multi-Tenant Architecture

**Existing schema supports multi-tenancy:**
- `users` table has `treaterId`, `generatorId`, `haulerId` (one will be set based on role)
- All data entities (wasteBags, collectionRequests, etc.) link back to generator/treater/hauler
- Tenant context is determinable from user record

**Required changes:**
- Add authentication layer (Convex Auth or Clerk)
- Add invitation mechanism (email with token)
- Add permission checks in Convex mutations
- Add audit logging table

### Tenant Hierarchy

```
Treater (Primary Tenant)
├── Treater Users (role: treater, admin)
├── Generator Orgs (created by treater)
│   └── Generator Users (role: generator)
└── Hauler Orgs (linked via treaterHaulerPartners)
    ├── Hauler Users (role: hauler)
    └── Driver Users (role: driver)
```

**Key insight:** This is NOT a flat multi-tenant model where all orgs are equal. Treaters are "super-tenants" who provision sub-tenants (generators, haulers). Permission model must reflect this hierarchy.

### Compliance Mapping

| Compliance Need (PRD) | Auth/Org Feature |
|-----------------------|------------------|
| Audit trail on status changes | Audit log with actor (userId), timestamp, tenant context |
| Role-based permissions | RBAC with tenant-scoped roles |
| User accountability | Email verification, immutable userId on all actions |
| Offboarding security | User deactivation with audit log entry |
| Certificate access control | Generator role can only view own org's certificates |

## Implementation Strategy

### Option 1: Convex Auth (Recommended)

**Pros:**
- Native Convex integration, same TypeScript/React patterns
- Tenant context easy to add to JWT claims
- Full control over invitation flow
- No additional vendor/cost

**Cons:**
- Build more ourselves (MFA, password reset UI)
- Less mature than Clerk (newer product)

**Complexity:** Medium

### Option 2: Clerk

**Pros:**
- Pre-built UI components (SignIn, UserProfile)
- Organizations feature built-in
- Mature MFA, SSO support
- Excellent DX

**Cons:**
- Additional vendor dependency
- Cost scales with users ($25/month for 1K MAU)
- Invite-only model requires some customization

**Complexity:** Low (for basic), High (for invite-only customization)

### Option 3: Roll Your Own

**Pros:**
- Complete control
- No vendor lock-in

**Cons:**
- Security risk if implemented incorrectly
- Reinventing wheel (password hashing, token generation, email sending)
- Time sink

**Complexity:** Very High

**Recommendation:** Start with Convex Auth, migrate to Clerk only if enterprise SSO becomes hard requirement.

## Sources

### Authentication & Multi-Tenancy
- [SaaS Multitenancy Components and Best Practices](https://frontegg.com/blog/saas-multitenancy)
- [The Developer's Guide to SaaS Multi-Tenant Architecture](https://workos.com/blog/developers-guide-saas-multi-tenant-architecture)
- [Multi-Tenant (B2B) Authentication](https://supertokens.com/features/multi-tenancy)
- [How to Choose the Right Authorization Model for Multi-Tenant SaaS](https://auth0.com/blog/how-to-choose-the-right-authorization-model-for-your-multi-tenant-saas-application/)

### Organization Management
- [Model Your B2B SaaS with Organizations](https://workos.com/blog/model-your-b2b-saas-with-organizations)
- [User Onboarding Strategies in B2B SaaS](https://auth0.com/blog/user-onboarding-strategies-b2b-saas/)

### Team Invitation Workflows
- [How to Onboard Invited Users to Your SaaS Product](https://userpilot.com/blog/onboard-invited-users-saas/)
- [Designing an Intuitive User Flow for Inviting Teammates](https://pageflows.com/blog/invite-teammates-user-flow/)
- [Simplify Your SaaS Growth with Easy Invitation Flows](https://blog.vortexsoftware.com/simplify-your-saas-growth-with-easy-invitation-flows/)

### Role-Based Access Control
- [Best Practices for Multi-Tenant Authorization](https://www.permit.io/blog/best-practices-for-multi-tenant-authorization)
- [Building Role-Based Access Control for Multi-Tenant SaaS](https://medium.com/@my_journey_to_be_an_architect/building-role-based-access-control-for-a-multi-tenant-saas-startup-26b89d603fdb)
- [Multi-tenant Role-based Access Control (RBAC)](https://www.aserto.com/use-cases/multi-tenant-saas-rbac)

### Security Best Practices
- [10 SaaS Security Best Practices for 2026](https://gainhq.com/blog/saas-security-best-practices/)
- [SaaS Security Best Practices Guide](https://www.bettercloud.com/monitor/saas-security-best-practices/)
- [NIST Password Guidelines: 2026 Updates & Best Practices](https://www.strongdm.com/blog/nist-password-guidelines)

### Session Management
- [SaaS Access Control Best Practices - 2026](https://www.zluri.com/blog/access-control-best-practices)
- [Common Considerations for Multitenant User Management](https://learn.microsoft.com/en-us/entra/architecture/multi-tenant-common-considerations)

### Audit Logging & Compliance
- [Audit Logs for SaaS Enterprise Customers](https://frontegg.com/blog/audit-logs-for-saas-enterprise-customers)
- [What is SaaS Compliance Audit Trail?](https://payproglobal.com/answers/what-is-saas-compliance-audit-trail/)
- [Enterprise Ready SaaS App Guide to Audit Logging](https://www.enterpriseready.io/features/audit-log/)
- [SaaS Compliance in 2026: The No-Nonsense Guide](https://makesaasbetter.com/saas-compliance/)

### User Offboarding
- [How to Create a SaaS Offboarding Process to Prevent Orphaned Accounts](https://www.josys.com/article/how-to-create-a-saas-offboarding-process-to-prevent-orphaned-accounts)
- [SaaS Offboarding That Eliminates Orphaned Access](https://www.reco.ai/use-cases/saas-offboarding)
- [Offboarding Employees from Your SaaS Stack in 7 Steps](https://www.crowdstrike.com/en-us/resources/guides/offboarding-employees-from-your-saas-stack-7-steps/)

### Domain Verification
- [From DNS Takeover to Org Admin: Secondary Attacks on Atlassian Cloud](https://www.obsidiansecurity.com/blog/from-dns-takeover-to-org-admin-secondary-attacks-on-atlassian-cloud)
- [Verify a Domain to Manage Accounts](https://support.atlassian.com/user-management/docs/verify-a-domain-to-manage-accounts/)

### Email Verification
- [Why Email Verification is Crucial for B2B Applications](https://stytch.com/blog/why-email-verification-is-crucial-for-b2b-apps/)
- [Why SaaS Signups Need Email Verification](https://unwrap.email/blogs/why-saas-signups-need-email-verification)

### Password Reset
- [Password Reset Best Practices: Avoid Common Pitfalls](https://www.authgear.com/post/authentication-security-password-reset-best-practices-and-more)
- [Forgot Password - OWASP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
- [Don't Underestimate the Value of a Secure Forgot Password Flow](https://clerk.com/blog/forgot-password-sspr)

### Profile & User Management
- [SaaS User Management: A Comprehensive Guide for 2026](https://www.zluri.com/blog/saas-user-management)
- [Top User Management Features for SaaS](https://workos.com/blog/user-management-features)
- [SaaS User Management Best Practices](https://www.apptension.com/blog-posts/saas-user-management)

### Billing & Seat Management
- [The Future of SaaS Pricing in 2026](https://medium.com/@aymane.bt/the-future-of-saas-pricing-in-2026-an-expert-guide-for-founders-and-leaders-a8d996892876)
- [Per-Seat Pricing: When to Leverage It](https://www.wingback.com/blog/when-to-leverage-per-seat-pricing)
- [The 2026 Guide to SaaS, AI, and Agentic Pricing Models](https://www.getmonetizely.com/blogs/the-2026-guide-to-saas-ai-and-agentic-pricing-models)
