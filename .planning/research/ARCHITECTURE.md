# Multi-Tenant Auth & Organization Architecture

**Project:** Hospital Waste Management (HWM)
**Context:** Brownfield integration - Adding Better Auth to existing Convex backend
**Researched:** 2026-01-21
**Confidence:** HIGH

## Executive Summary

This architecture integrates Better Auth's organization plugin with the existing HWM Convex schema to provide multi-tenant authentication across three separate React applications (generator, treater, trucking) sharing a single Convex backend. The design uses a bridge table pattern (`organizationLinks`) to map Better Auth organizations to domain entities (treaters, generators, haulers), enabling cross-domain session management while maintaining data isolation through organization-scoped queries.

**Key architectural decisions:**
1. **Bridge pattern**: `organizationLinks` table maps Better Auth organizations to domain entities
2. **Cross-domain auth**: `crossDomain` plugin enables session sharing across apps on different domains
3. **Organization-scoped data access**: All queries filter by organization membership, not RLS
4. **Active organization context**: Session tracks `activeOrganizationId` for multi-org users
5. **App routing by org type**: Users automatically routed to correct app based on organization type

---

## System Overview

### Existing Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Convex Backend                         │
│  (Shared serverless database + functions)                 │
│                                                            │
│  Schema:                                                   │
│  ├── treaters (treatment facilities)                      │
│  ├── generators (hospitals) → treaterId                   │
│  ├── haulers (trucking companies)                         │
│  ├── treaterHaulerPartners (many-to-many)                │
│  ├── users → treaterId | generatorId | haulerId          │
│  ├── wasteBags → generatorId                             │
│  └── ... (collections, treatments, etc.)                  │
└──────────────────────────────────────────────────────────┘
           ▲                    ▲                    ▲
           │                    │                    │
    ┌──────┴──────┐     ┌──────┴──────┐     ┌──────┴──────┐
    │  Generator  │     │   Treater   │     │  Trucking   │
    │ (port 3001) │     │ (port 3002) │     │ (port 3003) │
    │             │     │             │     │             │
    │ React App   │     │ React App   │     │ React App   │
    └─────────────┘     └─────────────┘     └─────────────┘
```

**Tenant hierarchy (existing business logic):**
```
Treater (primary tenant)
├── Generators (hospitals invited by treater)
├── Haulers (trucking partners linked via treaterHaulerPartners)
└── Users (role: generator | treater | hauler | driver | admin)
```

### Auth Integration Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                  Better Auth Component                          │
│                  (via @convex-dev/better-auth)                  │
│                                                                  │
│  Tables (managed by Better Auth):                               │
│  ├── user (email, name, emailVerified)                         │
│  ├── session (userId, activeOrganizationId)                    │
│  ├── organization (name, slug, metadata)                       │
│  ├── member (userId, organizationId, role)                     │
│  └── invitation (email, organizationId, role)                  │
└────────────────────────────────────────────────────────────────┘
                              ▲
                              │
                     ┌────────┴────────┐
                     │ organizationLinks│ ← Bridge table (NEW)
                     │                  │
                     │ Links:           │
                     │ betterAuthOrgId  │
                     │ → treaterId      │
                     │ → generatorId    │
                     │ → haulerId       │
                     └──────────────────┘
                              ▲
                              │
            ┌─────────────────┴─────────────────┐
            │    Existing Domain Schema          │
            │  (treaters, generators, haulers)   │
            └────────────────────────────────────┘
```

---

## Core Components

### 1. Organization-to-Entity Bridge

**File:** `packages/convex/convex/schema/organizationLinks.ts` (ALREADY EXISTS)

**Purpose:** Maps Better Auth's generic organization concept to HWM's domain entities (treaters, generators, haulers).

**Schema:**
```typescript
organizationLinks = {
  betterAuthOrgId: string,           // FK to Better Auth organization.id
  organizationType: "treater" | "generator" | "hauler",

  // One of these set based on organizationType:
  treaterId?: Id<"treaters">,
  generatorId?: Id<"generators">,
  haulerId?: Id<"haulers">,

  createdAt: number
}

Indexes:
  - by_better_auth_org (betterAuthOrgId)
  - by_treater (treaterId)
  - by_generator (generatorId)
  - by_hauler (haulerId)
```

**Why this pattern:**
- Better Auth organizations are generic (just name, slug, metadata)
- HWM domain entities have rich business logic (license numbers, locations, QR modes)
- Bridge table enables joining auth context to domain data
- Allows querying "what org does this domain entity belong to?" and vice versa
- Supports future expansion (e.g., regulatory bodies as observers)

### 2. Better Auth Server Configuration

**File:** `packages/convex/convex/auth.ts` (ALREADY EXISTS)

**Key plugins:**
```typescript
betterAuth({
  trustedOrigins: [
    "http://localhost:3001",  // generator
    "http://localhost:3002",  // treater
    "http://localhost:3003",  // trucking
  ],

  plugins: [
    crossDomain({ siteUrl }),        // Enable cross-domain sessions
    convex({ authConfig }),          // Convex compatibility
    organization({                   // Multi-tenant orgs
      allowUserToCreateOrganization: true,
      organizationLimit: 100,
      sendInvitationEmail: async (data) => { /* Resend */ }
    }),
    admin({                          // User management
      defaultRole: "user",
      adminRoles: ["admin"]
    })
  ]
})
```

**Cross-domain authentication:**
- Uses `crossDomain` plugin from `@convex-dev/better-auth/plugins`
- Enables session sharing across different domains/ports
- Each app domain must be in `trustedOrigins`
- Sessions stored server-side in Convex, cookie only holds session ID
- Client plugins (`crossDomainClient`) synchronize auth state across apps

**Organization plugin features:**
- Creates `organization`, `member`, `invitation` tables automatically
- Manages member roles (owner, admin, member)
- Handles invitation workflow with email notifications
- Tracks `activeOrganizationId` in session for multi-org users
- Supports custom metadata on organizations

### 3. Client Auth Package

**File:** `packages/auth/src/client.ts` (ALREADY EXISTS)

**Shared auth client factory:**
```typescript
createHwmAuthClient(convexSiteUrl) {
  return createAuthClient({
    baseURL: convexSiteUrl,
    plugins: [
      convexClient(),              // Convex integration
      crossDomainClient(),         // Cross-domain sessions
      organizationClient(),        // Organization management
      adminClient()                // Admin features
    ]
  });
}
```

**App-specific instantiation:**
```typescript
// apps/generator/src/lib/auth.ts
export const authClient = createHwmAuthClient(CONVEX_SITE_URL);
export const { signIn, signUp, signOut, useSession } = authClient;
```

**Routing helpers** (`packages/auth/src/routing.ts`):
- `getCurrentAppOrgType()`: Detects which app based on port/subdomain
- `shouldRedirectToApp()`: Checks if user needs to switch apps
- `getAppUrlForOrgType()`: Returns URL for org type's app
- `buildInvitationAcceptUrl()`: Routes invitations to correct app

### 4. Session Management

**Session schema (Better Auth managed):**
```typescript
session = {
  id: string,
  userId: string,
  activeOrganizationId: string?,    // Current working organization
  activeTeamId: string?,            // Future: teams within org
  expiresAt: timestamp,
  ...
}
```

**Multi-organization users:**
- Users can belong to multiple organizations (via `member` table)
- Session tracks which organization they're currently "acting as"
- Switching organizations updates `activeOrganizationId` without re-login
- Queries use active organization for data scoping

---

## Data Isolation Strategy

### Organization-Scoped Queries (Recommended Approach)

**Pattern:** All queries explicitly filter by organization membership at function entry point.

**Why not RLS (Row-Level Security)?**
- Convex functions are server-side only (not direct DB access)
- Authorization happens at function boundaries where user intent is clear
- RLS adds overhead for limited benefit in server-only context
- Better Auth + organization-scoped queries provide sufficient isolation

**Implementation pattern:**

```typescript
// Query example: Get generators for current user's treater
export const listGenerators = query({
  handler: async (ctx) => {
    // 1. Get authenticated user
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) throw new Error("Unauthenticated");

    // 2. Get active organization from session
    const activeOrgId = authUser.session.activeOrganizationId;
    if (!activeOrgId) throw new Error("No active organization");

    // 3. Get organization link to domain entity
    const orgLink = await ctx.db
      .query("organizationLinks")
      .withIndex("by_better_auth_org", q => q.eq("betterAuthOrgId", activeOrgId))
      .unique();

    if (orgLink?.organizationType !== "treater") {
      throw new Error("Must be treater organization");
    }

    // 4. Query scoped to organization's domain entity
    return ctx.db
      .query("generators")
      .withIndex("by_treater", q => q.eq("treaterId", orgLink.treaterId))
      .collect();
  }
});
```

**Key principles:**
1. **Verify authentication** first (authComponent.getAuthUser)
2. **Get active organization** from session
3. **Resolve organization link** to domain entity
4. **Validate organization type** matches endpoint requirements
5. **Scope all queries** to organization's domain entity ID

### Authorization Layers

```
┌─────────────────────────────────────────┐
│ 1. Authentication (Better Auth)         │  Is user who they claim?
│    → Validates session, returns user    │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│ 2. Organization Membership              │  Does user belong to org?
│    → Check member table                 │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│ 3. Organization Type Validation         │  Is org the right type?
│    → Check organizationLinks type       │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│ 4. Role-Based Permissions              │  Can user perform action?
│    → Check member.role (owner/admin)    │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│ 5. Data Scoping                         │  Filter by domain entity
│    → Query by treaterId/generatorId     │
└─────────────────────────────────────────┘
```

---

## Cross-App Authentication Flow

### Initial Sign-In

```
User visits generator.hwm.app
    │
    ▼
┌─────────────────────────────┐
│ 1. Click "Sign In"          │
│    → authClient.signIn()    │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ 2. Better Auth validates    │
│    credentials against      │
│    Convex user table        │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ 3. Session created with     │
│    activeOrganizationId     │
│    set to user's first org  │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ 4. Check organization type  │
│    via organizationLinks    │
└──────────────┬──────────────┘
               │
               ▼
         Is org type "generator"?

    YES ─────────────┘   └───── NO
     │                            │
     ▼                            ▼
┌─────────────────┐    ┌──────────────────────┐
│ Stay on app     │    │ Redirect to correct  │
│ Show dashboard  │    │ app (treater/hauler) │
└─────────────────┘    └──────────────────────┘
```

### Cross-Domain Session Sharing

**How crossDomain plugin works:**

1. **Session storage:** Session lives in Convex database, not browser cookie
2. **Cookie contents:** Only contains session ID, not session data
3. **Cross-domain sync:** `crossDomainClient` plugin fetches session from server
4. **Trusted origins:** Server validates requests from allowed domains

**Flow when navigating between apps:**

```
User on generator.hwm.app
Session: { activeOrganizationId: "org_abc_generator" }
    │
    │ User clicks link to treater.hwm.app
    │
    ▼
Browser requests treater.hwm.app
    │
    ▼
┌─────────────────────────────────────┐
│ treater app loads                   │
│ authClient.useSession() called      │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│ crossDomainClient fetches session   │
│ from Convex using session ID        │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│ Session retrieved with              │
│ activeOrganizationId: "org_abc"     │
└───────────────┬─────────────────────┘
                │
                ▼
         Check organization type

    Is "treater"? ────┐
                      │
         YES          │         NO
          │           │          │
          ▼           │          ▼
    Show treater      │    Redirect to
    dashboard         │    correct app
```

---

## Integration with Existing Schema

### Migration Path: Users Table

**Current state:**
```typescript
users = {
  name: string,
  email: string,
  role: "generator" | "treater" | "hauler" | "driver" | "admin",

  // Organization references (one set based on role)
  treaterId?: Id<"treaters">,
  generatorId?: Id<"generators">,
  haulerId?: Id<"haulers">,

  isActive: boolean,
  createdAt: number,
  updatedAt: number
}
```

**Recommended approach: Add betterAuthUserId field**
```typescript
users = {
  betterAuthUserId: string,    // Link to Better Auth user.id

  // Rest stays the same
  name: string,
  email: string,
  role: "generator" | "treater" | "hauler" | "driver" | "admin",
  treaterId?: Id<"treaters">,
  generatorId?: Id<"generators">,
  haulerId?: Id<"haulers">,
  isActive: boolean,
  ...
}

// New index
.index("by_better_auth_user", ["betterAuthUserId"])
```

**Query pattern:**
```typescript
export const getCurrentUserProfile = query({
  handler: async (ctx) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) return null;

    return ctx.db
      .query("users")
      .withIndex("by_better_auth_user", q =>
        q.eq("betterAuthUserId", authUser.id)
      )
      .unique();
  }
});
```

### Organization Creation Workflow

**Scenario: Treater creates new generator**

```typescript
// 1. Create generator domain entity
const generatorId = await ctx.db.insert("generators", {
  treaterId: currentTreater._id,
  name: "City Hospital",
  address: "123 Main St",
  contactEmail: "admin@cityhospital.com",
  qrMode: "both",
  isActive: true,
  createdAt: Date.now(),
  updatedAt: Date.now()
});

// 2. Create Better Auth organization
const organization = await authComponent.createOrganization({
  name: "City Hospital",
  slug: "city-hospital",
  metadata: {
    organizationType: "generator",
    linkedEntityId: generatorId
  }
});

// 3. Create organization link
await ctx.db.insert("organizationLinks", {
  betterAuthOrgId: organization.id,
  organizationType: "generator",
  generatorId: generatorId,
  createdAt: Date.now()
});

// 4. Invite initial admin user
await authComponent.inviteMember({
  organizationId: organization.id,
  email: "admin@cityhospital.com",
  role: "admin"
});
```

---

## Role-Based Access Control

### Better Auth Roles vs HWM Roles

**Better Auth organization roles:**
- `owner`: Full control, can delete organization
- `admin`: Manage members, update org settings
- `member`: Basic access, view org data

**HWM domain roles (existing):**
- `generator`: Hospital staff
- `treater`: Treatment facility staff
- `hauler`: Trucking company dispatcher
- `driver`: Field staff for collections
- `admin`: Platform super admin

**Integration strategy:**

1. **Better Auth roles** control organization-level permissions (invite members, manage org)
2. **HWM roles** control domain-specific permissions (log waste, schedule treatments)
3. **Both checked** for sensitive operations

---

## Suggested Build Order

### Phase 1: Foundation (Core Auth Integration)

**Goal:** Get Better Auth working with basic authentication

1. **Install Better Auth component** in Convex
   - Configure component in convex.json
   - Run `convex dev` to generate component schema

2. **Configure server auth** (auth.ts) ✅ ALREADY DONE
   - Plugins configured: convex, crossDomain, organization, admin
   - Email verification set up with Resend
   - trustedOrigins set for all three apps

3. **Create auth client package** (@hwm/auth) ✅ ALREADY DONE
   - Factory function exists
   - Routing helpers exist

4. **Add auth to one app** (treater recommended)
   - Install auth client
   - Add sign-in/sign-up pages
   - Test email verification flow
   - Add session hooks to root layout

**Success criteria:**
- User can sign up with email verification
- User can sign in and session persists
- Session visible in treater app

### Phase 2: Organization Bridge

**Goal:** Connect Better Auth organizations to domain entities

5. **organizationLinks table** ✅ ALREADY EXISTS
   - Schema defined with proper indexes

6. **Add betterAuthUserId to users table**
   - Migration script to backfill existing users
   - Add index by betterAuthUserId

7. **Implement organization creation**
   - Mutation: createTreaterWithOrganization
   - Mutation: createGeneratorWithOrganization
   - Hook up to existing treater/generator creation flows

8. **Test organization linking**
   - Create treater → verify org + link created
   - Create generator → verify org + link created
   - Query link → verify can resolve to domain entity

**Success criteria:**
- Creating treater/generator automatically creates Better Auth org
- organizationLinks correctly maps org to entity
- Can query domain entity from org ID and vice versa

### Phase 3: Data Scoping

**Goal:** Implement organization-scoped queries

9. **Create auth helper utilities**
   - `getAuthenticatedUser(ctx)` → throws if not authed
   - `getActiveOrganization(ctx)` → returns org link
   - `requireOrganizationType(ctx, type)` → validates org type

10. **Refactor existing queries**
    - Start with high-value queries (listGenerators, listWasteBags)
    - Add organization scoping to each
    - Update indexes if needed for performance

11. **Add authorization to mutations**
    - Check organization membership before writes
    - Validate organization type for operation
    - Check Better Auth role for sensitive ops

**Success criteria:**
- Generator users only see their organization's data
- Treater users see all their generators' data
- Attempting cross-org access throws error

### Phase 4: Cross-App Auth

**Goal:** Enable session sharing across three apps

12. **Add auth to remaining apps**
    - Generator app: auth client + sign-in page
    - Trucking app: auth client + sign-in page
    - Test sign-in works independently on each app

13. **Implement cross-domain session sharing** ✅ PLUGIN CONFIGURED
    - crossDomain plugin already configured
    - Test: Sign in on treater → visit generator → session present
    - Test: Sign in on generator → visit trucking → session present

14. **Add organization type routing**
    - Root layout checks user's active org type
    - Redirects to correct app if mismatch
    - Add "switch organization" UI for multi-org users

**Success criteria:**
- Sign in on one app → authenticated on all apps
- User auto-routed to correct app based on org type
- Can switch between organizations seamlessly

### Phase 5: Invitation Flow

**Goal:** Enable inviting users to organizations

15. **Implement invitation mutations**
    - inviteGeneratorAdmin (treater → generator)
    - inviteHaulerAdmin (treater → hauler)
    - Email sending already configured ✅

16. **Build invitation acceptance pages**
    - /accept-invitation route on each app
    - Token validation
    - Sign-up flow if user doesn't exist
    - Accept invitation → create HWM profile

17. **Add member management UI**
    - List organization members
    - Remove members
    - Update member roles

**Success criteria:**
- Treater can invite generator admin via email
- Generator admin receives email with accept link
- Clicking link creates account + joins organization
- Generator admin can access generator app

### Phase 6: RBAC & Permissions

**Goal:** Implement fine-grained permissions

18. **Define permission rules**
    - Document what each Better Auth role can do
    - Document what each HWM role can do
    - Create permission checking utilities

19. **Add permission checks to sensitive operations**
    - Delete organization (owner only)
    - Invite members (admin+)
    - Update org settings (admin+)
    - Log waste (generator role)
    - Schedule treatment (treater role)

20. **Add permission-aware UI**
    - Hide actions user can't perform
    - Show permission errors gracefully
    - Display user's role and org

**Success criteria:**
- Members can't perform admin actions
- Generator users can't access treater functions
- UI reflects available permissions

### Phase 7: Testing & Hardening

**Goal:** Ensure security and reliability

21. **Security audit**
    - Test cross-org access prevention
    - Test permission bypass attempts
    - Test session expiration
    - Test email verification requirement

22. **Multi-org user testing**
    - User belongs to 2+ orgs
    - Switch between orgs works correctly
    - Data isolation maintained

23. **Error handling**
    - Graceful auth errors
    - Clear error messages
    - Recovery flows (expired sessions)

**Success criteria:**
- No cross-org data leakage
- All error cases handled gracefully
- Multi-org users work correctly

---

## Anti-Patterns to Avoid

### 1. Querying Without Organization Scoping

**DON'T:**
```typescript
// Queries ALL waste bags across ALL organizations
export const listWasteBags = query({
  handler: async (ctx) => {
    return ctx.db.query("wasteBags").collect();
  }
});
```

**DO:**
```typescript
// Queries only user's organization's waste bags
export const listWasteBags = query({
  handler: async (ctx) => {
    const { orgLink } = await getOrgContext(ctx);

    return ctx.db
      .query("wasteBags")
      .withIndex("by_generator", q => q.eq("generatorId", orgLink.generatorId))
      .collect();
  }
});
```

### 2. Client-Side Only Authorization

**DON'T:**
```typescript
// Frontend
if (session.member.role === "admin") {
  await deleteGenerator(generatorId);  // Backend doesn't check!
}
```

**DO:**
```typescript
// Backend - actual security enforcement
export const deleteGenerator = mutation({
  args: { generatorId: v.id("generators") },
  handler: async (ctx, args) => {
    const { member } = await getOrgContext(ctx);

    if (!["owner", "admin"].includes(member.role)) {
      throw new Error("Insufficient permissions");
    }

    await ctx.db.delete(args.generatorId);
  }
});
```

### 3. Storing Sensitive Data in Organization Metadata

**DON'T:**
```typescript
// metadata is generic JSON, not validated
await authComponent.createOrganization({
  metadata: {
    licenseNumber: "LIC-12345",  // Not validated!
  }
});
```

**DO:**
```typescript
// Store in domain entity with proper validation
const generatorId = await ctx.db.insert("generators", {
  licenseNumber: "LIC-12345",  // Validated by schema
});
```

---

## Sources

**Official Documentation:**
- [Better Auth Organization Plugin](https://www.better-auth.com/docs/plugins/organization)
- [Better Auth Convex Integration](https://www.better-auth.com/docs/integrations/convex)
- [Convex Better Auth Guide](https://labs.convex.dev/better-auth)
- [Convex Row-Level Security](https://stack.convex.dev/row-level-security)
- [Convex Authorization Best Practices](https://stack.convex.dev/authorization)

**Community Resources:**
- [GitHub: Convex + Better Auth](https://github.com/get-convex/better-auth)
- [Better Auth Cross-Domain Discussion](https://github.com/better-auth/better-auth/discussions/3505)
- [Multi-Tenant SaaS Architecture Guide](https://workos.com/blog/developers-guide-saas-multi-tenant-architecture)
- [Azure Multi-Tenant Identity Architecture](https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations/identity)

**Implementation Examples:**
- [@convex-dev/better-auth npm package](https://www.npmjs.com/package/@convex-dev/better-auth)
- [Convex Auth with Role-Based Permissions](https://github.com/get-convex/convex-auth-with-role-based-permissions)
- [Better Auth Organization Structure & Permissions](https://www.premieroctet.com/blog/en/better-auth-structure-and-permissions-with-the-organization-plugin)
