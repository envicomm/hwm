# Multi-Tenant Auth & Organization Management Pitfalls

**Domain:** Hospital Waste Management - Multi-tenant SaaS
**Focus:** Better Auth + Convex with hierarchical organization model
**Researched:** 2026-01-21
**Overall Confidence:** HIGH (verified with Better Auth docs, Convex authorization patterns, and recent multi-tenancy research)

## Executive Summary

This document catalogs critical mistakes when implementing multi-tenant authentication and organization management, specifically for brownfield projects adding auth to existing systems. Pitfalls are prioritized by severity and grouped by failure mode: security vulnerabilities, tenant isolation failures, role/permission issues, session management problems, and organizational workflow mistakes.

**Your specific risk profile:**
- Brownfield project (auth retrofit to existing data model)
- Three React apps sharing Convex backend
- Hierarchical tenancy: Treater owns Generators and Haulers
- Better Auth with organization plugin
- Users table already exists without auth fields

---

## Critical Pitfalls (Rewrites or Major Security Issues)

### 1. Tenant Context Leakage in Database Queries

**What goes wrong:**
Database queries missing tenant filtering allow cross-tenant data access. In Convex, every query/mutation MUST explicitly filter by the correct organization ID. Without this, users can access other organizations' waste bags, certificates, or sensitive data.

**Why it happens:**
- Relying on UI-level filtering instead of database-level isolation
- Assuming authentication automatically provides authorization
- Connection pooling reuses connections with stale tenant context
- Missing tenant ID in function parameters

**Concrete example in your system:**
```typescript
// BAD - No tenant filtering
export const getWasteBags = query(async (ctx) => {
  return await ctx.db.query("wasteBags").collect();
  // Returns ALL waste bags across ALL generators!
});

// GOOD - Explicit tenant filtering
export const getWasteBags = query({
  args: { generatorId: v.id("generators") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    // Verify user has access to this generator
    await verifyUserAccess(ctx, identity, args.generatorId);
    return await ctx.db
      .query("wasteBags")
      .withIndex("by_generator", (q) =>
        q.eq("generatorId", args.generatorId)
      )
      .collect();
  },
});
```

**Why it's critical:**
OWASP Top 10 2021 lists broken access control as #1 security risk. One misrouted query exposes PHI (Protected Health Information) and violates compliance.

**Consequences:**
- Data breach exposing hospital waste records
- DENR compliance violations
- Loss of customer trust
- Legal liability

**Prevention:**
1. **Pass tenant context explicitly:** Never rely on global state. Always pass `treaterId`, `generatorId`, or `haulerId` as function arguments.
2. **Validate at function entry:** First line of every query/mutation should verify the authenticated user has access to the requested tenant.
3. **Use typed custom functions:** Wrap Convex queries with custom functions that inject verified tenant context via TypeScript.
4. **Database indexes on tenant fields:** Create indexes on `treaterId`, `generatorId`, `haulerId` for efficient filtering.
5. **Never trust client data:** Even if client sends tenant ID, verify it against authenticated user's permissions.

**Detection (warning signs):**
- Query results contain data from multiple organizations in dev tools
- Test user can access other organization's routes/data
- Database queries without `.withIndex()` or `.filter()` on tenant fields
- Missing authorization checks in mutations

**Phase to address:** Phase 1 - Core Auth Foundation (establish pattern immediately)

**Sources:**
- [Tenant Isolation in Multi-Tenant Systems](https://securityboulevard.com/2025/12/tenant-isolation-in-multi-tenant-systems-architecture-identity-and-security/)
- [Why Tenant Context Must Be Scoped Per Transaction](https://dev.to/m_zinger_2fc60eb3f3897908/why-tenant-context-must-be-scoped-per-transaction-3aop)
- [Convex Authorization Best Practices](https://stack.convex.dev/authorization)

---

### 2. Role Explosion and Permission Cascade Complexity

**What goes wrong:**
Starting with simple roles (owner, admin, member), then discovering you need organization-specific permissions leads to creating dozens of specialized roles. Examples: "generator_waste_logger", "generator_certificate_viewer", "treater_admin_east_region", "hauler_driver_night_shift". The permission system becomes unmaintainable.

**Why it happens:**
- Not anticipating feature-specific permissions early
- Using RBAC when you need ABAC (attribute-based) or ReBAC (relationship-based)
- Hierarchical organizations require permission inheritance
- Different apps need different capabilities for same role

**Concrete example in your system:**
```typescript
// Role explosion scenario:
// - "treater_admin" needs to manage generators
// - "generator_owner" needs to invite generator staff
// - "generator_admin" can manage team but not billing
// - "generator_waste_logger" can create waste bags only
// - "generator_certificate_viewer" read-only access
// - "hauler_dispatcher" can assign drivers
// - "hauler_driver" mobile-only scanning
//
// Soon you have 20+ roles and no one can reason about permissions
```

**Better approach:**
```typescript
// Role + resource pattern
type Permission = {
  role: "owner" | "admin" | "member";
  organizationId: string;
  organizationType: "treater" | "generator" | "hauler";
  capabilities: string[]; // ["waste.create", "team.invite", "certs.view"]
};
```

**Consequences:**
- Maintenance nightmare (every feature adds new roles)
- Confusion about who can do what
- Permission bugs in edge cases
- Difficulty onboarding new team members

**Prevention:**
1. **Start with capabilities, not roles:** Define what actions exist (`waste.create`, `team.invite`), then group into roles.
2. **Use hierarchical roles with explicit inheritance:** Owner inherits Admin capabilities; Admin inherits Member capabilities.
3. **Separate role from organization type:** A "member" at a treater has different capabilities than a "member" at a generator.
4. **Plan for ReBAC if scaling:** If you'll need "user can manage generators they created," start with relationship-based model.
5. **Document the permission matrix:** Create a table: Role × Organization Type × Capability.

**Detection:**
- New features require creating new roles
- Roles like "admin_with_special_access_v2"
- Developers ask "what's the difference between X and Y role?"
- Permission checks scattered throughout codebase

**Phase to address:** Phase 1 - Core Auth Foundation (design role model correctly from start)

**Sources:**
- [Authorization 101: Multi-tenant RBAC](https://www.aserto.com/blog/authorization-101-multi-tenant-rbac)
- [Building Dynamic RBAC with Custom Roles](https://www.aserto.com/blog/building-dynamic-multitenant-rbac-custom-roles)
- [Best Practices for Multi-Tenant Authorization](https://www.permit.io/blog/best-practices-for-multi-tenant-authorization)

---

### 3. Brownfield Schema Mismatch (Auth Fields Missing)

**What goes wrong:**
Your existing `users` table doesn't have auth-related fields Better Auth expects (`emailVerified`, `image`, `createdAt` as Date, password hash storage). When you add Better Auth, you face a choice: migrate existing users or maintain two user tables. Both choices have pitfalls.

**Why it happens:**
- Auth added after data model designed
- Existing `users` table optimized for application logic, not auth
- Better Auth's Convex adapter expects specific schema

**Your specific situation:**
```typescript
// Current users table
export const users = defineTable({
  name: v.string(),
  email: v.string(),
  phone: v.optional(v.string()),
  role: userRole,
  treaterId: v.optional(v.id("treaters")),
  generatorId: v.optional(v.id("generators")),
  haulerId: v.optional(v.id("haulers")),
  isActive: v.boolean(),
  createdAt: v.number(), // timestamp
  updatedAt: v.number(),
});

// Better Auth expects (via @convex-dev/better-auth)
{
  name: string,
  email: string,
  emailVerified: boolean,
  image?: string,
  createdAt: Date,  // Different type!
  updatedAt: Date,
  // Plus password/OAuth fields
}
```

**Two bad approaches:**

**Approach A: Add auth fields to existing table**
- Risk: Schema conflicts (e.g., `createdAt` type mismatch)
- Risk: Mixing auth concerns with application logic
- Risk: Better Auth updates break your application fields

**Approach B: Separate auth table, link via email/ID**
- Risk: Sync problems between tables
- Risk: Two sources of truth for user identity
- Risk: Complex join logic everywhere

**Consequences:**
- Migration failures
- Data inconsistency
- User lookup performance issues
- Auth flows breaking application logic

**Prevention:**
1. **Use Better Auth's organization members table:** Store application-specific user data in your `users` table, auth data in Better Auth's tables, link via `userId` foreign key.
2. **Migrate schema carefully:** Add new auth fields as optional initially, backfill data, then make required.
3. **Version your schema:** Use Convex migrations to transform existing data.
4. **Keep separation of concerns:** Auth tables for identity, your tables for application logic.

**Detection:**
- TypeScript errors about field types during Better Auth setup
- Users can't log in after auth integration
- Duplicate user records appearing
- Queries joining multiple user tables

**Phase to address:** Phase 1 - Core Auth Foundation (resolve before writing any auth code)

**Sources:**
- [Better Auth Convex Integration](https://www.better-auth.com/docs/integrations/convex)
- [Multi-Tenant userbases issue #1248](https://github.com/better-auth/better-auth/issues/1248)

---

### 4. Session Context Lost on Organization Switching

**What goes wrong:**
Users belonging to multiple organizations (e.g., a consultant who is admin at both a Treater and a Generator) switch between organizations. The session doesn't properly track "active organization," causing operations to execute against the wrong tenant.

**Why it happens:**
- Better Auth's organization plugin has a bug where `set-active` endpoint missing session context
- Client stores organization ID but server doesn't validate it
- JWT doesn't include current organization context
- No server-side active organization tracking

**Concrete example in your system:**
```typescript
// User is admin at both Treater A and Generator B
// Switches to Generator B in UI
// Clicks "Create Waste Bag"
// Server still sees Treater A context
// Waste bag created under wrong organization!
```

**Consequences:**
- Data created in wrong organization
- Silent failures (no error, just wrong tenant)
- User confusion ("I created that bag, where did it go?")
- Audit trail inaccuracies

**Prevention:**
1. **Explicit organization parameter:** Every mutation takes `organizationId` argument, validated against user's memberships.
2. **Server-side active org tracking:** Store `activeOrganizationId` in session or separate table.
3. **UI indicators:** Always show current organization in header, require explicit switch action.
4. **Validate on every request:** Don't trust client's organization context; verify user has access before executing.
5. **Avoid relying on Better Auth's set-active:** Implement your own organization context management if the plugin is unreliable.

**Detection:**
- Users report "data appearing in wrong organization"
- Test user with multi-org access creates data in unexpected places
- Session doesn't persist organization choice across page reloads
- Console errors about missing session context

**Phase to address:** Phase 2 - Organization Management (when multi-org membership becomes possible)

**Sources:**
- [Organization set-active endpoint missing session context](https://github.com/better-auth/better-auth/issues/4708)
- [Multi-tenant cross domain situation #4878](https://github.com/better-auth/better-auth/issues/4878)

---

### 5. Invitation Workflow Security Holes

**What goes wrong:**
Organization owners invite new members via email. Attacker intercepts invitation link, uses it to join the organization, gains access to sensitive data. Or: invitation tokens don't expire, are reusable, or lack proper validation.

**Why it happens:**
- Invitation tokens without expiration
- Tokens not single-use
- No verification that invitee email matches invited email
- Missing rate limiting on invitation acceptance
- Invitation links in URL parameters (logged in browser history, referrer headers)

**Concrete example in your system:**
```typescript
// BAD invitation flow
1. Treater admin invites "doctor@hospital.com"
2. System generates link: /accept-invite?token=abc123
3. Email sent to doctor@hospital.com
4. Attacker intercepts email or guesses token
5. Attacker opens link before doctor does
6. Attacker creates account with different email
7. Attacker now has access to hospital's waste data!
```

**Real-world attack vectors (2026):**
- Microsoft Entra invitations being weaponized for phishing attacks
- Calendar invitation phishing (invites bypass email filters)
- Teams guest invitations creating security gaps

**Consequences:**
- Unauthorized access to organization
- Data breach via social engineering
- Compliance violations
- Reputation damage

**Prevention:**
1. **Expire invitations:** 7-day expiration on invitation tokens.
2. **Single-use tokens:** Invalidate token after first use attempt.
3. **Email verification:** Require invitee to verify email matches invited email before accepting.
4. **Rate limiting:** Limit invitation acceptance attempts per IP/email.
5. **Audit trail:** Log all invitation sends, acceptances, and failures.
6. **Require email confirmation:** After accepting invite, send confirmation email with "was this you?" link.
7. **Organization context in token:** Encode organization ID in token, validate on acceptance.

**Detection:**
- User reports "I didn't join this organization"
- Invitation token works after multiple uses
- Different email addresses accepting same invitation
- Invitations working weeks after being sent

**Phase to address:** Phase 3 - Team Management (when invitation flow is implemented)

**Sources:**
- [Cybercriminals Use Microsoft Entra Invitations](https://cyberpress.org/microsoft-entra-toad/)
- [Calendar Invitation Phishing](https://hoxhunt.com/blog/calendar-invite-phishing)
- [Invite Workflow Using Auth0 Organizations](https://developer.auth0.com/resources/labs/saas/invite-workflow-using-the-auth0-organizations-invitation-feature)

---

## Moderate Pitfalls (Delays or Technical Debt)

### 6. JWT Token Validation Missing Tenant Context

**What goes wrong:**
JWT tokens issued by Better Auth don't include the user's organization memberships or current active organization. Every request requires additional database lookups to determine what organizations the user can access.

**Why it happens:**
- Standard JWT claims don't include custom tenant data
- Better Auth's default token structure is minimal
- Developers forget to add custom claims

**Concrete example:**
```typescript
// Every request does this:
1. Validate JWT → get userId
2. Query database: "what orgs does userId belong to?"
3. Query database: "what's user's role in this org?"
4. Query database: "does this org have access to requested resource?"
// 3 extra DB queries per request!
```

**Consequences:**
- Performance overhead (extra DB queries)
- Latency on every request
- Database load
- More complex authorization logic

**Prevention:**
1. **Custom JWT claims:** Extend Better Auth's JWT to include organization memberships and roles.
2. **Cache organization memberships:** Store in-memory or Redis cache to avoid repeated DB lookups.
3. **Accept the tradeoff:** Extra query is acceptable if auth logic stays simple; premature optimization is worse.

**Detection:**
- Slow request times for authenticated endpoints
- High database query volume for user/org lookups
- Performance profiling shows auth queries as bottleneck

**Phase to address:** Phase 4 - Performance Optimization (defer until you have performance data)

**Sources:**
- [ASP.NET Core Multi-Tenant JWTs](https://carlrippon.com/asp-net-core-web-api-multi-tenant-jwts/)
- [JWT Multi-Tenant Authentication](https://frontegg.com/guides/how-to-persist-jwt-tokens-for-your-saas-application)

---

### 7. Cross-App Session Inconsistency

**What goes wrong:**
Three React apps (generator, treater, trucking) sharing Convex backend but with inconsistent session handling. User logs into Generator app, then opens Treater app in another tab—not logged in. Or: session expires in one app but not others.

**Why it happens:**
- Apps using different auth configuration
- Session cookies scoped to specific subdomains
- No shared session storage
- Different `SITE_URL` configurations per app

**Concrete example:**
```typescript
// Generator app: http://localhost:3001
// Treater app: http://localhost:3002
// Trucking app: http://localhost:3003

// Session cookie set on localhost:3001
// Other apps can't read it!
```

**Consequences:**
- User confusion (logged in vs logged out state varies)
- Repeat login prompts
- Lost productivity
- Support tickets

**Prevention:**
1. **Shared session domain:** In development, use shared cookie domain. In production, use same root domain (e.g., `app.hwm.com` with subdomains).
2. **Centralized auth service:** All apps redirect to single auth subdomain for login, then redirect back.
3. **Consistent Better Auth config:** All three apps use identical `SITE_URL` and session configuration.
4. **Convex handles auth:** Since Convex is shared backend, leverage Convex Auth instead of per-app Better Auth if possible.

**Detection:**
- User logs in to one app, switches tabs, sees login screen again
- Session cookies with mismatched domains in DevTools
- Inconsistent authentication state across apps

**Phase to address:** Phase 1 - Core Auth Foundation (establish shared session strategy early)

**Sources:**
- [Cross-Origin Web Sessions](https://goteleport.com/blog/web-session-sharing-transfer/)
- [Troubleshoot CORS Issues](https://learn.microsoft.com/en-us/troubleshoot/entra/entra-id/app-integration/troubleshoot-cross-origin-resource-sharing-issues)

---

### 8. Privilege Creep Without Audit

**What goes wrong:**
Users accumulate permissions over time without cleanup. Generator admin gets promoted to owner, but old admin role remains. Or: user changes organizations but retains access to old organization.

**Why it happens:**
- No automated role cleanup
- No periodic access reviews
- Missing offboarding process
- Role changes additive instead of replacing

**Concrete example:**
```typescript
// User timeline:
// Day 1: Hired as "generator_member"
// Day 30: Promoted to "generator_admin"
// Day 60: Moved to different generator, made "admin" there too
// Day 90: Now has admin access to TWO generators!
// Day 120: Old generator realizes ex-employee still has access
```

**Consequences:**
- Unauthorized access by ex-employees
- Compliance violations (access not matching job function)
- Security audit failures
- Insider threat risk

**Prevention:**
1. **Role replacement, not addition:** When changing roles, remove old role assignments.
2. **Regular access reviews:** Quarterly audit of who has access to what.
3. **Automated deactivation:** When user leaves organization, trigger deactivation workflow.
4. **Permission expiration:** High-privilege roles auto-expire after 90 days without renewal.
5. **Audit logging:** Track all permission changes with actor, timestamp, reason.

**Detection:**
- Users with multiple role assignments in same organization
- Users with access to organizations they don't actively work for
- No deactivation workflow in codebase
- Missing audit logs for permission changes

**Phase to address:** Phase 3 - Team Management (when role changes become common)

**Sources:**
- [Role-Based Access Control Best Practices](https://www.cerbos.dev/blog/role-based-access-control-best-practices)
- [Common RBAC Implementation Challenges](https://www.censinet.com/perspectives/common-challenges-role-based-access-control-implementation)

---

### 9. Organization Hierarchy Permission Inheritance Confusion

**What goes wrong:**
Treater owns Generators and Haulers. Question arises: Does a Treater admin automatically have admin access to all Generators they manage? Or must they be explicitly added to each Generator's team? Inconsistent implementation leads to access control bugs.

**Why it happens:**
- No clear hierarchy permission model documented
- Implicit vs. explicit permission inheritance
- Different developers implement different patterns

**Two models with tradeoffs:**

**Model A: Implicit inheritance (Treater admins can access all child orgs)**
- Pro: Simple for treaters (one team manages everything)
- Con: Generator admins can't control who from Treater sees their data
- Con: Violates principle of least privilege

**Model B: Explicit membership (Treater admin must be invited to Generator)**
- Pro: Clear permission boundaries
- Pro: Generators control their access
- Con: More complex (Treater admin needs to be added to every Generator)

**Your specific decision needed:**
```
Treater Admin creates Generator A.
Can Treater Admin automatically:
- View Generator A's waste bags? (oversight use case says YES)
- Create waste bags on Generator A's behalf? (probably NO)
- Invite team members to Generator A? (probably NO, Generator owner does this)

Document this explicitly!
```

**Consequences:**
- Inconsistent behavior across features
- Security bugs where access is granted/denied incorrectly
- User confusion about permissions
- Difficult to audit access

**Prevention:**
1. **Document the hierarchy model:** Write explicit rules for parent-child organization permissions.
2. **Implement read vs. write distinction:** Treaters can read child org data (oversight) but not write (autonomy).
3. **Use scoped API functions:** Create separate Convex functions for "treater viewing generator data" vs. "generator managing own data."
4. **Test edge cases:** User in multiple organizations, user switching roles, etc.

**Detection:**
- Developers asking "should X have access to Y?"
- Inconsistent permission checks in similar features
- Users reporting "I can see data but not edit it" confusion
- No documentation of hierarchy permissions

**Phase to address:** Phase 1 - Core Auth Foundation (decide model before building features)

**Sources:**
- [Resource and Role Hierarchy Based Access Control](https://ieeexplore.ieee.org/document/8377908/)
- [Best Practices for Multi-Tenant Authorization](https://www.permit.io/blog/best-practices-for-multi-tenant-authorization)

---

## Minor Pitfalls (Annoyances but Fixable)

### 10. Better Auth + Convex Version Mismatch

**What goes wrong:**
Better Auth's Convex adapter requires Convex version 1.25.0 or later. Using older Convex version causes cryptic runtime errors.

**Why it happens:**
- Brownfield project has older Convex version
- Dependencies not updated before adding auth
- Lockfile not regenerated

**Consequences:**
- Auth setup fails with unclear errors
- Time wasted debugging
- Delayed implementation

**Prevention:**
1. **Check versions first:** Before adding Better Auth, verify Convex version.
2. **Update dependencies:** Run `pnpm update @convex-dev/better-auth convex`.
3. **Read integration docs:** Better Auth's Convex integration page lists version requirements.

**Detection:**
- Runtime errors like "undefined method on adapter"
- TypeScript errors in Better Auth setup
- Auth functions not found in Convex dashboard

**Phase to address:** Phase 1 - Core Auth Foundation (pre-flight check)

**Sources:**
- [Better Auth Convex Integration](https://www.better-auth.com/docs/integrations/convex)

---

### 11. Missing Email Verification Flow

**What goes wrong:**
Users sign up with fake email addresses, can't receive important notifications (collection requests, certificates), waste bag tracking breaks because generator contact is unreachable.

**Why it happens:**
- Email verification seen as "nice to have" initially
- Better Auth supports it but requires explicit configuration
- Resend integration not configured for verification emails

**Consequences:**
- Users locked out (typo in email, can't reset password)
- Communication failures (certificates not delivered)
- Spam signups
- Support burden

**Prevention:**
1. **Enable email verification:** Better Auth's email provider supports verification out of box.
2. **Block unverified users:** Don't allow unverified users to perform critical actions.
3. **Resend verification email:** Provide UI for users to request new verification email.
4. **Test email flow:** Ensure Resend configuration works in all environments.

**Detection:**
- Users reporting "I didn't receive the email"
- High bounce rate on notification emails
- Database shows users with unverified emails performing actions

**Phase to address:** Phase 1 - Core Auth Foundation (enable during initial setup)

**Sources:**
- [Better Auth Convex Integration](https://www.better-auth.com/docs/integrations/convex)

---

### 12. Password Reset Without Rate Limiting

**What goes wrong:**
Attacker automates password reset requests for known user emails, flooding inboxes and potentially discovering valid user accounts via timing attacks.

**Why it happens:**
- Better Auth provides reset flow but not rate limiting
- No IP-based request throttling
- No CAPTCHA on reset form

**Consequences:**
- DoS via email flooding
- User enumeration (discovering valid emails)
- Support tickets from confused users
- Resend quota exhaustion

**Prevention:**
1. **Rate limit reset requests:** 3 requests per email per hour maximum.
2. **Rate limit per IP:** 10 requests per IP per hour.
3. **Add CAPTCHA:** Use hCaptcha or similar on password reset form.
4. **Consistent response times:** Don't reveal whether email exists via response timing.

**Detection:**
- Spike in password reset emails sent
- Users reporting unsolicited reset emails
- Resend quota warnings
- IP addresses making dozens of reset requests

**Phase to address:** Phase 2 - Security Hardening (after basic auth works)

**Sources:**
- [Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

---

## Phase-Specific Warnings

| Phase | Likely Pitfall | Mitigation |
|-------|---------------|------------|
| Phase 1: Core Auth | Tenant context leakage (#1) | Establish explicit tenant filtering pattern immediately |
| Phase 1: Core Auth | Brownfield schema mismatch (#3) | Plan Better Auth integration with existing `users` table carefully |
| Phase 1: Core Auth | Cross-app session inconsistency (#7) | Configure shared session domain for all three apps |
| Phase 2: Organization Management | Organization switching context loss (#4) | Implement server-side active organization tracking |
| Phase 2: Organization Management | Hierarchy permission confusion (#9) | Document parent-child org permission model explicitly |
| Phase 3: Team Management | Role explosion (#2) | Design capability-based permission model upfront |
| Phase 3: Team Management | Invitation security holes (#5) | Single-use, expiring tokens with email verification |
| Phase 3: Team Management | Privilege creep (#8) | Build audit trail and role cleanup workflows |
| Phase 4: Production Readiness | JWT missing tenant context (#6) | Profile performance before optimizing token claims |
| Phase 4: Production Readiness | Password reset rate limiting (#12) | Add rate limiting and CAPTCHA before public launch |

---

## Testing Checklist

Before marking auth complete, verify these scenarios work correctly:

**Tenant Isolation:**
- [ ] User at Generator A cannot query Generator B's waste bags
- [ ] User at Hauler A cannot see Hauler B's collection requests
- [ ] Treater admin can see their own generators, not other treaters' generators
- [ ] Database queries always filter by appropriate tenant ID

**Role-Based Access:**
- [ ] Generator "member" cannot invite new team members
- [ ] Generator "admin" can invite members but not change organization settings
- [ ] Generator "owner" can delete the organization
- [ ] Treater "admin" can create generators but not access generator's internal team management

**Multi-Organization:**
- [ ] User belonging to both Treater and Generator can switch between them
- [ ] Active organization persists across page reloads
- [ ] Creating waste bag goes to correct organization based on active context

**Invitation Security:**
- [ ] Invitation expires after 7 days
- [ ] Invitation is single-use
- [ ] Invitee's email must match invited email
- [ ] Accepting invitation creates proper organization membership

**Session Management:**
- [ ] Logging into Generator app makes Treater app also authenticated
- [ ] Logging out of one app logs out of all apps
- [ ] Session persists across browser restarts
- [ ] Session expires after configured timeout

**Edge Cases:**
- [ ] User removed from organization can no longer access it
- [ ] User's role downgraded from admin to member loses admin capabilities immediately
- [ ] Organization deleted removes all members' access
- [ ] User with no organization memberships sees appropriate "no access" state

---

## Quick Reference: Red Flags

During code review or development, stop if you see:

1. **Database query without tenant filter** — Every query must filter by `treaterId`, `generatorId`, or `haulerId`.
2. **Global variable holding organization context** — Pass tenant ID explicitly as function parameters.
3. **Client sends tenant ID without server validation** — Always verify user has access before trusting client data.
4. **New role created for specific feature** — Redesign permission model instead of adding role.
5. **Invitation token in URL without expiration check** — Tokens must expire and be single-use.
6. **User can switch organizations without server round-trip** — Server must validate and persist active organization.
7. **Authorization check only in UI** — Must also check in every Convex function.
8. **Same JWT used across all organizations** — Token should include current organization context.

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Tenant isolation security | HIGH | Verified with Convex authorization docs and OWASP guidelines |
| Better Auth + Convex integration | HIGH | Official Better Auth Convex integration documentation |
| Role-based access patterns | MEDIUM | Based on general RBAC research; your specific hierarchy may have unique needs |
| Invitation workflow security | HIGH | Recent 2026 attack vectors documented in security advisories |
| Session management | MEDIUM | WebSearch findings verified with Better Auth docs |
| Organization hierarchy permissions | MEDIUM | Pattern based on multi-tenant research; requires your design decisions |

---

## Additional Resources

**Official Documentation:**
- [Better Auth Convex Integration](https://www.better-auth.com/docs/integrations/convex)
- [Convex Authorization Best Practices](https://stack.convex.dev/authorization)
- [Better Auth Organization Plugin](https://better-auth-ui.com/advanced/organizations)

**Security References:**
- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [Multi-Tenant Security Best Practices](https://qrvey.com/blog/multi-tenant-security/)

**Research Articles:**
- [Tenant Isolation in Multi-Tenant Systems (2025)](https://securityboulevard.com/2025/12/tenant-isolation-in-multi-tenant-systems-architecture-identity-and-security/)
- [Multi-Tenant Authorization Best Practices](https://www.permit.io/blog/best-practices-for-multi-tenant-authorization)
- [Authorization Challenges in Multitenant Systems](https://thenewstack.io/authorization-challenges-in-a-multitenant-system/)

---

**Last Updated:** 2026-01-21

**Next Review:** After Phase 1 implementation (validate assumptions with real code)
