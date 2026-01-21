# Phase 2: Organization Bridge - Research

**Researched:** 2026-01-21
**Domain:** Better Auth organization plugin + Convex bridge table pattern
**Confidence:** HIGH

## Summary

Phase 2 implements the organization bridge that links Better Auth's generic organizations to HWM's domain entities (treaters, generators, haulers). The standard approach uses Better Auth's organization plugin for organization lifecycle management while Convex maintains the `organizationLinks` bridge table that maps auth organizations to domain entities.

The key insight is that organization creation must happen atomically: domain entity + Better Auth organization + link record all succeed together or all fail. Convex mutations are transactional by design (all writes commit together or none do), but calling Better Auth's `auth.api.createOrganization` from a mutation introduces an external dependency that must be handled carefully.

**Primary recommendation:** Use the `authComponent.getAuth(createAuth, ctx)` pattern within Convex mutations to call `auth.api.createOrganization`. Store `organizationType` in Better Auth's organization metadata field to enable type-aware queries. Add `betterAuthUserId` to the users table as an optional field, then migrate existing users (if any) with the migrations component.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| better-auth | ^1.4.10 | Organization management | Organization plugin provides create, invite, member management out of the box |
| @convex-dev/better-auth | 0.10.9 | Convex adapter + auth component | `authComponent.getAuth()` pattern for calling auth.api from mutations |
| convex | 1.31+ | Database + transactional mutations | Automatic OCC retry, atomic writes, schema enforcement |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @convex-dev/migrations | latest | Schema migration component | Backfilling `betterAuthUserId` on existing users |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Bridge table pattern | Storing domain type directly in Better Auth tables | Bridge table keeps auth concerns separate from domain; Better Auth tables are managed by the adapter |
| Organization metadata | Custom Better Auth schema fields | Metadata is built-in JSON field; custom fields require schema migration |
| Convex mutation atomicity | Distributed transactions | Convex atomicity is automatic; no need for saga pattern within single mutation |

**Installation:**
```bash
# migrations component (if not already installed)
pnpm --filter @hwm/convex add @convex-dev/migrations
```

## Architecture Patterns

### Recommended Project Structure
```
packages/convex/convex/
├── schema/
│   ├── organizationLinks.ts   # Bridge table (exists, needs parentBetterAuthOrgId)
│   └── users.ts               # Add betterAuthUserId field
├── lib/
│   └── auth.ts                # Existing auth helpers (extend)
├── organizations/
│   ├── mutations.ts           # createTreaterWithOrganization, etc.
│   ├── queries.ts             # getOrganizationByEntity, etc.
│   └── helpers.ts             # Resolution utilities
└── migrations/
    └── users.ts               # betterAuthUserId migration
```

### Pattern 1: Organization Creation Mutation
**What:** Atomic creation of domain entity + Better Auth org + link record
**When to use:** Creating treater, generator, or hauler organizations
**Example:**
```typescript
// Source: @convex-dev/better-auth basic usage + Better Auth organization plugin
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { authComponent, createAuth } from "../auth";
import { ConvexError } from "convex/values";

export const createTreaterWithOrganization = mutation({
  args: {
    name: v.string(),
    address: v.string(),
    contactEmail: v.string(),
    contactPhone: v.string(),
    licenseNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Get auth context for calling Better Auth API
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

    // 2. Generate a URL-safe slug from name
    const slug = args.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // 3. Create Better Auth organization
    // Note: This is NOT transactional with Convex - if it succeeds but
    // Convex write fails, we have an orphaned Better Auth org.
    // Acceptable for MVP; production may need cleanup job.
    const orgResult = await auth.api.createOrganization({
      body: {
        name: args.name,
        slug,
        metadata: { organizationType: "treater" },
      },
      headers,
    });

    if (!orgResult) {
      throw new ConvexError("Failed to create organization");
    }

    // 4. Create domain entity (Convex)
    const now = Date.now();
    const treaterId = await ctx.db.insert("treaters", {
      name: args.name,
      address: args.address,
      contactEmail: args.contactEmail,
      contactPhone: args.contactPhone,
      licenseNumber: args.licenseNumber,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // 5. Create organization link (Convex)
    await ctx.db.insert("organizationLinks", {
      betterAuthOrgId: orgResult.id,
      organizationType: "treater",
      treaterId,
      // parentBetterAuthOrgId: undefined for treaters (they are top-level)
      createdAt: now,
    });

    return { treaterId, betterAuthOrgId: orgResult.id };
  },
});
```

### Pattern 2: Child Organization Creation (Generator/Hauler)
**What:** Creating organizations under a parent treater
**When to use:** Treater admin creates generator or hauler
**Example:**
```typescript
// Source: Better Auth organization plugin + HWM domain model
export const createGeneratorWithOrganization = mutation({
  args: {
    treaterId: v.id("treaters"),
    name: v.string(),
    address: v.string(),
    contactEmail: v.string(),
    contactPhone: v.string(),
    facilityCode: v.optional(v.string()),
    qrMode: qrMode,
  },
  handler: async (ctx, args) => {
    // 1. Verify caller has treater access (TODO: proper RBAC in later phase)
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

    // 2. Get parent treater's Better Auth org ID for hierarchy tracking
    const parentLink = await ctx.db
      .query("organizationLinks")
      .withIndex("by_treater", (q) => q.eq("treaterId", args.treaterId))
      .first();

    if (!parentLink) {
      throw new ConvexError("Treater organization link not found");
    }

    // 3. Create Better Auth organization with parent reference in metadata
    const slug = args.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const orgResult = await auth.api.createOrganization({
      body: {
        name: args.name,
        slug,
        metadata: {
          organizationType: "generator",
          parentTreaterId: args.treaterId, // Domain reference
        },
      },
      headers,
    });

    if (!orgResult) {
      throw new ConvexError("Failed to create organization");
    }

    // 4. Create domain entity
    const now = Date.now();
    const generatorId = await ctx.db.insert("generators", {
      treaterId: args.treaterId,
      name: args.name,
      address: args.address,
      contactEmail: args.contactEmail,
      contactPhone: args.contactPhone,
      facilityCode: args.facilityCode,
      qrMode: args.qrMode,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // 5. Create organization link with parent reference
    await ctx.db.insert("organizationLinks", {
      betterAuthOrgId: orgResult.id,
      organizationType: "generator",
      generatorId,
      parentBetterAuthOrgId: parentLink.betterAuthOrgId,
      createdAt: now,
    });

    return { generatorId, betterAuthOrgId: orgResult.id };
  },
});
```

### Pattern 3: Organization Resolution Helper
**What:** Bidirectional lookup between Better Auth org ID and domain entity
**When to use:** Every organization-scoped query/mutation
**Example:**
```typescript
// Source: HWM auth patterns + Convex query patterns
import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id, Doc } from "../_generated/dataModel";
import { ConvexError } from "convex/values";

type OrganizationLink = Doc<"organizationLinks">;

// From Better Auth org ID -> domain entity
export async function getDomainEntityFromOrg(
  ctx: QueryCtx | MutationCtx,
  betterAuthOrgId: string
): Promise<{
  link: OrganizationLink;
  entity: Doc<"treaters"> | Doc<"generators"> | Doc<"haulers">;
}> {
  const link = await ctx.db
    .query("organizationLinks")
    .withIndex("by_better_auth_org", (q) =>
      q.eq("betterAuthOrgId", betterAuthOrgId)
    )
    .first();

  if (!link) {
    throw new ConvexError("Organization link not found");
  }

  let entity;
  switch (link.organizationType) {
    case "treater":
      entity = await ctx.db.get(link.treaterId!);
      break;
    case "generator":
      entity = await ctx.db.get(link.generatorId!);
      break;
    case "hauler":
      entity = await ctx.db.get(link.haulerId!);
      break;
  }

  if (!entity) {
    throw new ConvexError(`${link.organizationType} entity not found`);
  }

  return { link, entity };
}

// From domain entity -> Better Auth org ID
export async function getBetterAuthOrgFromEntity(
  ctx: QueryCtx | MutationCtx,
  entityType: "treater" | "generator" | "hauler",
  entityId: Id<"treaters"> | Id<"generators"> | Id<"haulers">
): Promise<OrganizationLink> {
  const indexName = `by_${entityType}` as const;
  const link = await ctx.db
    .query("organizationLinks")
    .withIndex(indexName, (q) => q.eq(`${entityType}Id` as any, entityId))
    .first();

  if (!link) {
    throw new ConvexError(`Organization link not found for ${entityType}`);
  }

  return link;
}
```

### Pattern 4: User-Organization Linking via betterAuthUserId
**What:** Map Convex users table to Better Auth users
**When to use:** Resolving domain user from authenticated session
**Example:**
```typescript
// Source: Convex schema pattern + Better Auth user ID
// In schema/users.ts - add betterAuthUserId field
export const users = defineTable({
  name: v.string(),
  email: v.string(),
  phone: v.optional(v.string()),
  role: userRole,

  // Better Auth user ID for linking
  betterAuthUserId: v.optional(v.string()),

  // Organization references
  treaterId: v.optional(v.id("treaters")),
  generatorId: v.optional(v.id("generators")),
  haulerId: v.optional(v.id("haulers")),

  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_email", ["email"])
  .index("by_better_auth_user", ["betterAuthUserId"]) // New index
  .index("by_treater", ["treaterId"])
  .index("by_generator", ["generatorId"])
  .index("by_hauler", ["haulerId"])
  .index("by_role", ["role"]);

// Helper to get domain user from Better Auth session
export async function getDomainUser(
  ctx: QueryCtx | MutationCtx,
  betterAuthUserId: string
): Promise<Doc<"users"> | null> {
  return await ctx.db
    .query("users")
    .withIndex("by_better_auth_user", (q) =>
      q.eq("betterAuthUserId", betterAuthUserId)
    )
    .first();
}
```

### Anti-Patterns to Avoid

- **Don't call auth.api from queries:** Better Auth API methods often perform background writes (session updates). Use mutations for all auth.api calls.
- **Don't assume Better Auth org creation is transactional with Convex:** The auth.api call happens over HTTP; if Convex mutation fails after, the Better Auth org exists. Handle with cleanup job or accept for MVP.
- **Don't store denormalized data in organizationLinks:** The link is a mapping only. Names, metadata live in domain entities or Better Auth.
- **Don't use metadata for critical business logic:** Organization metadata lacks type safety. Store domain-critical fields in Convex entities.
- **Don't query Better Auth tables directly:** Use authComponent methods. Better Auth table structure may change between versions.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Organization creation | Custom org table + members | Better Auth organization plugin | Handles slugs, metadata, member roles, invitations, active org switching |
| User-org membership | Custom membership table | Better Auth member table | Automatic role management, membership queries, invitation acceptance |
| Organization resolution | JOIN-heavy queries | organizationLinks + indices | Bridge table with indices enables O(1) lookups both directions |
| User ID mapping | Store user details in both places | betterAuthUserId reference | Single source of truth in Better Auth; Convex users link via ID |
| Slug generation | Manual string manipulation | Better Auth auto-generates | Handles uniqueness, URL-safe encoding, collision avoidance |

**Key insight:** Better Auth organization plugin handles the auth-side complexity (membership, roles, invitations). The bridge table pattern handles the domain-mapping complexity. Don't conflate these responsibilities.

## Common Pitfalls

### Pitfall 1: Non-Atomic Organization Creation
**What goes wrong:** Better Auth org created successfully, then Convex mutation fails. Orphaned Better Auth organization exists with no domain entity link.
**Why it happens:** auth.api.createOrganization is an HTTP call, not part of Convex transaction.
**How to avoid:**
- Accept for MVP: orphans are rare and can be cleaned manually
- Production: add a cleanup action that finds unlinked Better Auth orgs
- Alternative: create Convex entity first, then Better Auth, then link. If Better Auth fails, Convex automatically rolls back.
**Warning signs:** organizationLinks table has fewer records than Better Auth organization table.

### Pitfall 2: Missing parentBetterAuthOrgId
**What goes wrong:** Cannot query "all organizations under this treater" without joining through domain tables.
**Why it happens:** Initial schema lacked hierarchy tracking field.
**How to avoid:** Add `parentBetterAuthOrgId: v.optional(v.string())` to organizationLinks schema. Set when creating generator/hauler orgs.
**Warning signs:** Queries for child organizations require multiple round trips.

### Pitfall 3: Calling auth.api from Query Context
**What goes wrong:** "ctx is not a mutation ctx" error at runtime.
**Why it happens:** Some auth.api methods (like listOrganizations) do background session updates, which require mutation context.
**How to avoid:** Always use mutations for auth.api calls, even for "read" operations.
**Warning signs:** Cryptic errors about mutation context when calling seemingly read-only auth.api methods.

### Pitfall 4: Race Condition on User Creation
**What goes wrong:** User signs up, domain user record created, but betterAuthUserId not set yet.
**Why it happens:** Better Auth creates user during signup; domain user creation is separate flow.
**How to avoid:** Create domain user record only after Better Auth user exists. Use Better Auth hooks or explicit signup mutation that does both.
**Warning signs:** Queries by betterAuthUserId return null for newly signed-up users.

### Pitfall 5: Type Confusion in organizationLinks
**What goes wrong:** Generator ID stored in treaterId field, or vice versa.
**Why it happens:** All three ID fields are optional; no compile-time enforcement of which to set.
**How to avoid:** Create helper functions that enforce type-to-field mapping:
```typescript
function createOrgLink(
  type: "treater",
  id: Id<"treaters">,
  betterAuthOrgId: string
): Parameters<typeof ctx.db.insert>[1];
```
**Warning signs:** Resolution helpers return wrong entity type.

## Code Examples

Verified patterns from official sources:

### Schema Update for organizationLinks
```typescript
// Source: CONTEXT.md decision + Convex schema patterns
// packages/convex/convex/schema/organizationLinks.ts

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const organizationType = v.union(
  v.literal("treater"),
  v.literal("generator"),
  v.literal("hauler")
);

export const organizationLinks = defineTable({
  betterAuthOrgId: v.string(),
  organizationType: organizationType,

  // Entity references (one will be set based on type)
  treaterId: v.optional(v.id("treaters")),
  generatorId: v.optional(v.id("generators")),
  haulerId: v.optional(v.id("haulers")),

  // Hierarchy tracking - enables "all orgs under treater" queries
  parentBetterAuthOrgId: v.optional(v.string()),

  createdAt: v.number(),
})
  .index("by_better_auth_org", ["betterAuthOrgId"])
  .index("by_treater", ["treaterId"])
  .index("by_generator", ["generatorId"])
  .index("by_hauler", ["haulerId"])
  .index("by_parent_org", ["parentBetterAuthOrgId"]);
```

### Migration for Existing Users
```typescript
// Source: @convex-dev/migrations patterns
// packages/convex/convex/migrations/users.ts

import { migrations } from "@convex-dev/migrations";
import { components } from "../_generated/api";

const migration = migrations(components.migrations);

// Migration to add betterAuthUserId to existing users
// Run this after deploying schema with optional betterAuthUserId field
export const addBetterAuthUserId = migration.define({
  table: "users",
  migrateOne: async (ctx, user) => {
    // Skip if already has betterAuthUserId
    if (user.betterAuthUserId !== undefined) {
      return;
    }

    // For existing users, we need to look up their Better Auth user
    // by email (assuming email is unique and matches)
    // This query goes to Better Auth's user table via the component
    const betterAuthUser = await ctx.db
      .query("user") // Better Auth user table
      .withIndex("email", (q) => q.eq("email", user.email))
      .first();

    if (betterAuthUser) {
      await ctx.db.patch(user._id, {
        betterAuthUserId: betterAuthUser.id,
      });
    }
    // If no matching Better Auth user, leave undefined
    // (user hasn't signed up via Better Auth yet)
  },
});
```

### Organization Type Validation Helper
```typescript
// Source: TypeScript best practices + Convex patterns
// packages/convex/convex/organizations/helpers.ts

import type { Id } from "../_generated/dataModel";

type OrgTypeConfig = {
  treater: { idField: "treaterId"; idType: Id<"treaters"> };
  generator: { idField: "generatorId"; idType: Id<"generators"> };
  hauler: { idField: "haulerId"; idType: Id<"haulers"> };
};

// Type-safe org link creation helper
export function makeOrgLinkData<T extends keyof OrgTypeConfig>(
  type: T,
  entityId: OrgTypeConfig[T]["idType"],
  betterAuthOrgId: string,
  parentBetterAuthOrgId?: string
) {
  const base = {
    betterAuthOrgId,
    organizationType: type,
    createdAt: Date.now(),
    parentBetterAuthOrgId,
  };

  // Type-safe field assignment
  const idField = `${type}Id` as const;
  return {
    ...base,
    [idField]: entityId,
  };
}

// Usage:
// const linkData = makeOrgLinkData("treater", treaterId, orgResult.id);
// await ctx.db.insert("organizationLinks", linkData);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom org tables | Better Auth organization plugin | Better Auth 1.2+ | Built-in member management, invitations, role system |
| Direct Better Auth DB queries | authComponent methods | @convex-dev/better-auth 0.10+ | Stable API, version-independent queries |
| RLS for multi-tenancy | Explicit org scoping in queries | Convex architecture | Server-only functions make RLS unnecessary; explicit is clearer |
| Storing user details in Convex | Reference by betterAuthUserId | HWM Phase 2 | Single source of truth; no sync issues |

**Deprecated/outdated:**
- **Custom membership tracking:** Better Auth organization plugin handles this
- **Querying Better Auth tables directly:** Use authComponent.getAuthUser, getAuthSession

## Open Questions

Things that couldn't be fully resolved:

1. **Better Auth org cleanup for failed mutations**
   - What we know: If Convex mutation fails after auth.api.createOrganization succeeds, orphan org exists
   - What's unclear: Best cleanup strategy - scheduled action? Manual? Accept for MVP?
   - Recommendation: Accept for MVP. Add TODO comment. Implement cleanup action if orphans become an issue.

2. **Exact auth.api.createOrganization return type**
   - What we know: Returns organization object with id, name, slug, metadata
   - What's unclear: Exact TypeScript type from Better Auth; whether it can return null vs throw
   - Recommendation: Check at runtime with null check, throw ConvexError if falsy. Type will be inferred.

3. **Migration timing for existing users**
   - What we know: Need to add betterAuthUserId to users table, migrate existing records
   - What's unclear: Are there existing users in production? What's the email matching accuracy?
   - Recommendation: Deploy schema first (field optional), run migration, then update code to require betterAuthUserId for new users.

4. **Better Auth organization metadata type safety**
   - What we know: Metadata is Record<string, any>, stored as JSON string, lacks type inference
   - What's unclear: Whether to use additionalFields schema option instead
   - Recommendation: Use metadata for non-critical fields (organizationType for filtering). Store critical business data in Convex domain entities.

## Sources

### Primary (HIGH confidence)
- [Better Auth Organization Plugin](https://www.better-auth.com/docs/plugins/organization) - create, invite, member management APIs
- [Convex + Better Auth Basic Usage](https://labs.convex.dev/better-auth/basic-usage) - authComponent.getAuth pattern
- [Convex OCC and Atomicity](https://docs.convex.dev/database/advanced/occ) - transaction behavior
- [Better Auth Admin Plugin](https://www.better-auth.com/docs/plugins/admin) - impersonation for treater admin access

### Secondary (MEDIUM confidence)
- [Better Auth Convex Integration](https://www.better-auth.com/docs/integrations/convex) - adapter setup, API calling patterns
- [Convex Migrations](https://stack.convex.dev/intro-to-migrations) - schema evolution patterns
- [GitHub Issue: Organization creation timing](https://github.com/better-auth/better-auth/issues/2010) - hooks vs explicit mutation

### Tertiary (LOW confidence)
- [GitHub Issue: auth.api in hooks with allowUserToCreateOrganization: false](https://github.com/better-auth/better-auth/issues/6791) - potential workaround needed
- [GitHub Issue: ctx is not mutation ctx](https://github.com/get-convex/better-auth/issues/100) - query vs mutation context

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official docs, existing project setup confirms versions
- Architecture patterns: HIGH - Based on existing organizationLinks schema and Better Auth plugin docs
- Pitfalls: MEDIUM - Some inferred from GitHub issues, some from direct documentation
- Code examples: MEDIUM - Patterns synthesized from multiple sources, not copy-paste from single source

**Research date:** 2026-01-21
**Valid until:** ~2026-02-21 (30 days - Better Auth stable, Convex stable)
**Notes:** The `parentBetterAuthOrgId` field needs to be added to organizationLinks schema. The `betterAuthUserId` field needs to be added to users table. Both are breaking schema changes requiring migration strategy.
