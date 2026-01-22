# Phase 5: Role-Based Access Control - Research

**Researched:** 2026-01-22
**Domain:** Authorization, RBAC, Audit Logging, Convex + Better Auth integration
**Confidence:** HIGH

## Summary

This phase implements Role-Based Access Control (RBAC) for the HWM platform. The system has two orthogonal role dimensions:

1. **Organization Roles** (from Better Auth): owner, admin, member - controls what actions a user can perform within their organization
2. **Domain Roles** (from users table): generator, treater, hauler, driver, admin - controls what type of data and features a user can access

The architecture leverages Better Auth's organization plugin for org-level permissions while implementing custom Convex middleware for domain-level access control. Key patterns include:

- **Server-side permission checking** using Better Auth's `hasPermission` API called from Convex mutations
- **Custom function wrappers** using `convex-helpers` for consistent auth/permission injection
- **Explicit data scoping** rather than Row-Level Security (Convex recommendation)
- **Audit logging** via a dedicated table with immutable append-only writes

**Primary recommendation:** Use Better Auth's hasPermission API for org role checks (owner/admin/member) in Convex functions, combined with custom function wrappers that inject both the authenticated user and their domain context (treaterId, generatorId, etc.) for every protected operation.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| better-auth | ^1.4.10 | Organization roles & permissions | Already integrated; provides hasPermission API |
| @convex-dev/better-auth | ^0.10.9 | Better Auth <-> Convex bridge | Already in use; enables server-side auth checks |
| convex-helpers | ^0.1.x | Custom function wrappers | Official Convex helper for RBAC patterns |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | ^3.x | Validation schemas | Optional - for complex permission rule validation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom permission checking | Casbin/CASL | Overkill for simple owner/admin/member hierarchy |
| Custom audit logging | Convex _generation audit | Built-in doesn't capture business context; need custom |
| Row-Level Security | Explicit data scoping | RLS adds complexity; Convex team recommends explicit checks |

**Installation:**
```bash
pnpm --filter @hwm/convex add convex-helpers
```

## Architecture Patterns

### Recommended Project Structure
```
packages/convex/convex/
├── lib/
│   ├── auth.ts              # Existing auth helpers (extend)
│   ├── permissions.ts       # NEW: Permission definitions & checks
│   ├── customFunctions.ts   # NEW: Custom query/mutation wrappers
│   └── audit.ts             # NEW: Audit logging utility
├── schema/
│   └── auditLogs.ts         # NEW: Audit log table schema
└── [domain]/
    ├── mutations.ts         # REFACTOR: Add permission checks
    └── queries.ts           # REFACTOR: Add data scoping
```

### Pattern 1: Custom Function Wrappers with Role Injection
**What:** Create customQuery and customMutation that inject authenticated user, their org role, and domain context
**When to use:** Every protected query and mutation

```typescript
// Source: https://stack.convex.dev/custom-functions + Better Auth docs
import { customQuery, customMutation, customCtx } from "convex-helpers/server/customFunctions";
import { query, mutation } from "./_generated/server";
import { authComponent, createAuth } from "./auth";

// Types for injected context
type UserContext = {
  userId: string;           // Better Auth user ID
  orgId: string;            // Better Auth organization ID
  orgRole: "owner" | "admin" | "member";
  domainRole: "generator" | "treater" | "hauler" | "driver" | "admin";
  // Domain entity IDs based on org type
  treaterId?: Id<"treaters">;
  generatorId?: Id<"generators">;
  haulerId?: Id<"haulers">;
};

// Custom query with auth context
export const protectedQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const userContext = await resolveUserContext(ctx);
    if (!userContext) {
      throw new ConvexError("Authentication required");
    }
    return { user: userContext };
  })
);

// Custom mutation with auth context + audit logging
export const protectedMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const userContext = await resolveUserContext(ctx);
    if (!userContext) {
      throw new ConvexError("Authentication required");
    }
    return {
      user: userContext,
      audit: createAuditLogger(ctx, userContext),
    };
  })
);
```

### Pattern 2: Permission Checking Utility
**What:** Centralized permission checking that combines org role + domain role
**When to use:** Before any sensitive operation

```typescript
// Source: https://www.better-auth.com/docs/plugins/organization
// packages/convex/convex/lib/permissions.ts

// Resource-Action permission matrix
export const PERMISSIONS = {
  // Organization management
  organization: {
    update: ["owner", "admin"],
    delete: ["owner"],
    manageBilling: ["owner"],
  },
  // Team management
  team: {
    invite: ["owner", "admin"],
    remove: ["owner", "admin"],
    updateRole: ["owner", "admin"],
  },
  // Domain features (by org type)
  generator: {
    create: ["treater"],  // Only treaters create generators
    update: ["owner", "admin"],
    delete: ["owner"],
  },
  hauler: {
    create: ["treater"],
    update: ["owner", "admin"],
    delete: ["owner"],
  },
  wasteBag: {
    create: ["member", "admin", "owner"],  // Any member can create
    update: ["admin", "owner"],
    delete: ["owner"],
  },
} as const;

// Check if user has permission
export function hasPermission(
  userContext: UserContext,
  resource: keyof typeof PERMISSIONS,
  action: string
): boolean {
  const allowedRoles = PERMISSIONS[resource]?.[action];
  if (!allowedRoles) return false;
  return allowedRoles.includes(userContext.orgRole);
}

// Require permission or throw
export function requirePermission(
  userContext: UserContext,
  resource: keyof typeof PERMISSIONS,
  action: string
): void {
  if (!hasPermission(userContext, resource, action)) {
    throw new ConvexError({
      message: `Permission denied: ${resource}:${action}`,
      code: "FORBIDDEN",
    });
  }
}
```

### Pattern 3: Data Scoping Layer
**What:** Functions that filter data based on domain type and ownership
**When to use:** All cross-org queries

```typescript
// Source: https://stack.convex.dev/authorization
// packages/convex/convex/lib/dataScoping.ts

// Get visible generators for user
export async function getAccessibleGenerators(
  ctx: QueryCtx,
  user: UserContext
): Promise<Doc<"generators">[]> {
  switch (user.domainRole) {
    case "treater":
      // Treaters see all their linked generators
      return ctx.db
        .query("generators")
        .withIndex("by_treater", (q) => q.eq("treaterId", user.treaterId!))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

    case "generator":
      // Generators only see their own org
      const generator = await ctx.db.get(user.generatorId!);
      return generator ? [generator] : [];

    case "hauler":
      // Haulers don't see generators
      return [];

    default:
      return [];
  }
}

// Get visible waste bags for user
export async function getAccessibleWasteBags(
  ctx: QueryCtx,
  user: UserContext,
  filters?: { generatorId?: Id<"generators">; status?: string }
): Promise<Doc<"wasteBags">[]> {
  switch (user.domainRole) {
    case "treater":
      // Treaters see all bags from their generators
      const generators = await getAccessibleGenerators(ctx, user);
      const generatorIds = generators.map(g => g._id);

      let query = ctx.db.query("wasteBags");
      if (filters?.generatorId) {
        if (!generatorIds.includes(filters.generatorId)) {
          throw new ConvexError("Access denied to this generator");
        }
        query = query.withIndex("by_generator", (q) =>
          q.eq("generatorId", filters.generatorId)
        );
      }
      return query.collect().then(bags =>
        bags.filter(b => generatorIds.includes(b.generatorId))
      );

    case "generator":
      // Generators only see their own bags
      return ctx.db
        .query("wasteBags")
        .withIndex("by_generator", (q) =>
          q.eq("generatorId", user.generatorId!)
        )
        .collect();

    case "hauler":
      // Haulers see bags assigned to them for collection
      // (implementation depends on collection assignment model)
      return [];

    default:
      return [];
  }
}
```

### Pattern 4: Audit Logging
**What:** Immutable log of sensitive actions with actor, action, and context
**When to use:** All mutations that modify sensitive data

```typescript
// Source: https://dev.to/dangtony98/guide-to-building-audit-logs-for-application-software-49fh
// packages/convex/convex/lib/audit.ts

export type AuditEvent =
  | "team.member_invited"
  | "team.member_removed"
  | "team.role_changed"
  | "generator.created"
  | "generator.updated"
  | "generator.deleted"
  | "hauler.created"
  | "wasteBag.created"
  | "wasteBag.status_changed"
  | "treatment.completed"
  | "disposal.completed";

export interface AuditLogEntry {
  event: AuditEvent;
  actorId: string;           // Better Auth user ID
  actorEmail: string;
  actorName?: string;
  organizationId: string;    // Better Auth org ID
  organizationType: "treater" | "generator" | "hauler";
  resourceType: string;      // e.g., "generators", "wasteBags"
  resourceId?: string;       // ID of affected resource
  metadata?: Record<string, unknown>;  // Event-specific context
  ipAddress?: string;
  userAgent?: string;
  timestamp: number;
}

// Create audit logger bound to user context
export function createAuditLogger(ctx: MutationCtx, user: UserContext) {
  return async function log(
    event: AuditEvent,
    resourceType: string,
    resourceId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await ctx.db.insert("auditLogs", {
      event,
      actorId: user.userId,
      actorEmail: user.email,
      actorName: user.name,
      organizationId: user.orgId,
      organizationType: user.domainRole as any,
      resourceType,
      resourceId,
      metadata,
      timestamp: Date.now(),
    });
  };
}
```

### Anti-Patterns to Avoid
- **Client-side permission checks only:** Always validate permissions server-side in Convex functions. Client checks are for UX only.
- **Implicit tenant filtering:** Every query must explicitly scope to the user's accessible data. Never rely on "the client won't request other tenants' data."
- **Shared permission cache:** Permissions should be checked fresh on each request. Better Auth session contains the latest role.
- **Mutable audit logs:** Audit logs should be append-only. Never update or delete audit records.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Organization role checks | Custom role storage | Better Auth `hasPermission` API | Already integrated; handles edge cases |
| Custom function middleware | Manual ctx injection | `convex-helpers` customQuery/customMutation | Type-safe, composable, tested |
| Session/user resolution | Manual token parsing | Better Auth `getAuth` + `authComponent.getAuthUser` | Handles token validation, expiry |
| Permission definitions | Hardcoded if/else | Centralized PERMISSIONS object | Single source of truth, auditable |

**Key insight:** Better Auth already manages org roles (owner/admin/member). The work is bridging Better Auth's permission system to Convex function handlers and adding domain-specific data scoping.

## Common Pitfalls

### Pitfall 1: Not Checking Both Role Dimensions
**What goes wrong:** Checking org role (admin) but not domain type (treater can't access other treaters' generators)
**Why it happens:** Confusing "admin of my org" with "admin of the platform"
**How to avoid:** Always check: (1) user has org role for action, AND (2) resource belongs to user's org/domain
**Warning signs:** A generator admin being able to see treater-only pages

### Pitfall 2: Race Conditions in Role Updates
**What goes wrong:** User's role changes but cached permission allows old action
**Why it happens:** Client-side permission state not refreshed after server update
**How to avoid:** Always use server-side `hasPermission`; call `refetch()` on client after role changes
**Warning signs:** "I just got promoted but can't access admin features"

### Pitfall 3: Audit Log Gaps
**What goes wrong:** Some sensitive actions not logged; inconsistent audit trail
**Why it happens:** Audit logging added per-mutation instead of via wrapper
**How to avoid:** Use customMutation that includes audit logger; make logging declarative
**Warning signs:** Compliance review finds missing entries for certain action types

### Pitfall 4: Leaking Data in Error Messages
**What goes wrong:** Error message reveals "Generator XYZ does not exist" vs "Access denied"
**Why it happens:** Different error for "doesn't exist" vs "you can't see it"
**How to avoid:** Always return generic "Access denied" or "Not found" - never reveal existence
**Warning signs:** Attacker can enumerate resources by probing IDs

### Pitfall 5: Forgetting Server-Side Checks for UI-Hidden Features
**What goes wrong:** UI hides "Delete" button for non-admins, but API allows the call
**Why it happens:** Assuming UI hiding is security
**How to avoid:** Every mutation must independently verify permissions
**Warning signs:** Browser dev tools can invoke mutations that should be restricted

## Code Examples

Verified patterns from official sources:

### Better Auth hasPermission Server-Side
```typescript
// Source: https://www.better-auth.com/docs/plugins/organization
// In a Convex mutation, check permission via Better Auth API

import { authComponent, createAuth } from "../auth";

async function checkPermission(
  ctx: MutationCtx,
  permission: { [resource: string]: string[] }
): Promise<boolean> {
  const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

  const result = await auth.api.hasPermission({
    headers,
    body: { permissions: permission },
  });

  return result?.success ?? false;
}

// Usage in mutation
export const updateGenerator = mutation({
  args: { generatorId: v.id("generators"), name: v.string() },
  handler: async (ctx, args) => {
    const canUpdate = await checkPermission(ctx, {
      organization: ["update"]
    });

    if (!canUpdate) {
      throw new ConvexError("Permission denied");
    }

    // Proceed with update...
  },
});
```

### Custom Query with User Context
```typescript
// Source: https://stack.convex.dev/custom-functions
// Using convex-helpers for protected queries

import { customQuery, customCtx } from "convex-helpers/server/customFunctions";
import { query } from "./_generated/server";

export const protectedQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    // Resolve user from Better Auth
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new ConvexError("Authentication required");
    }

    // Get domain user for role info
    const domainUser = await ctx.db
      .query("users")
      .withIndex("by_better_auth_user", (q) =>
        q.eq("betterAuthUserId", authUser.userId)
      )
      .first();

    // Get active org link
    const orgLink = await ctx.db
      .query("organizationLinks")
      .withIndex("by_better_auth_org", (q) =>
        q.eq("betterAuthOrgId", authUser.session.activeOrganizationId)
      )
      .first();

    return {
      user: {
        id: authUser.userId,
        email: authUser.user.email,
        name: authUser.user.name,
        orgRole: "member", // Would need Better Auth API call for actual role
        domainRole: domainUser?.role,
        treaterId: orgLink?.treaterId,
        generatorId: orgLink?.generatorId,
        haulerId: orgLink?.haulerId,
      },
    };
  })
);

// Usage
export const getMyGenerators = protectedQuery({
  args: {},
  handler: async (ctx, args) => {
    const { user } = ctx;

    if (user.domainRole !== "treater") {
      throw new ConvexError("Only treaters can list generators");
    }

    return ctx.db
      .query("generators")
      .withIndex("by_treater", (q) => q.eq("treaterId", user.treaterId!))
      .collect();
  },
});
```

### Audit Log Schema
```typescript
// Source: https://dev.to/dangtony98/guide-to-building-audit-logs-for-application-software-49fh
// packages/convex/convex/schema/auditLogs.ts

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const auditLogs = defineTable({
  // What happened
  event: v.string(),  // e.g., "team.member_invited"

  // Who did it
  actorId: v.string(),
  actorEmail: v.string(),
  actorName: v.optional(v.string()),

  // Where (organization context)
  organizationId: v.string(),
  organizationType: v.union(
    v.literal("treater"),
    v.literal("generator"),
    v.literal("hauler")
  ),

  // What was affected
  resourceType: v.string(),  // Table name
  resourceId: v.optional(v.string()),

  // Additional context
  metadata: v.optional(v.any()),

  // Request info (if available)
  ipAddress: v.optional(v.string()),
  userAgent: v.optional(v.string()),

  // When
  timestamp: v.number(),
})
  .index("by_organization", ["organizationId", "timestamp"])
  .index("by_actor", ["actorId", "timestamp"])
  .index("by_resource", ["resourceType", "resourceId"])
  .index("by_event", ["event", "timestamp"]);
```

### Permission-Aware UI Component
```typescript
// Source: Better Auth docs + React patterns
// apps/treater/src/components/permission-gate.tsx

import { authClient } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

interface PermissionGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  requiredRoles?: ("owner" | "admin" | "member")[];
  permissions?: { [resource: string]: string[] };
}

export function PermissionGate({
  children,
  fallback = null,
  requiredRoles,
  permissions,
}: PermissionGateProps) {
  // Get current member's role
  const { data: activeMember, isPending } = useQuery({
    queryKey: ["active-member"],
    queryFn: async () => {
      const result = await authClient.organization.getActiveMember({});
      return result.data;
    },
  });

  if (isPending) {
    return null; // Or a loading state
  }

  // Check role-based access
  if (requiredRoles && activeMember) {
    if (!requiredRoles.includes(activeMember.role as any)) {
      return <>{fallback}</>;
    }
  }

  // Check permission-based access (client-side for UX only)
  if (permissions && activeMember) {
    const hasPermission = authClient.organization.checkRolePermission({
      permissions,
      role: activeMember.role,
    });
    if (!hasPermission) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

// Usage
<PermissionGate requiredRoles={["owner", "admin"]}>
  <Button onClick={handleDelete}>Delete Generator</Button>
</PermissionGate>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| RLS policies on DB | Explicit function-level checks | Convex recommendation | More explicit, less magic |
| Middleware chains | Custom function wrappers | convex-helpers pattern | Type-safe, composable |
| Boolean role checks | Permission-based access | RBAC best practice | More granular control |

**Deprecated/outdated:**
- `ctx.auth.getUserIdentity()` alone is insufficient - need Better Auth session for org context
- Manual JWT validation - Better Auth handles this
- Global RLS config - Convex favors explicit checks per function

## Open Questions

Things that couldn't be fully resolved:

1. **DENR Audit Log Requirements**
   - What we know: Generic audit log schema designed; captures who/what/when/where
   - What's unclear: Specific DENR retention periods, required export format, which events are mandatory
   - Recommendation: Implement flexible audit logging now; adjust retention/export based on compliance input

2. **Better Auth Role Caching in Convex**
   - What we know: Better Auth stores roles in its DB tables; `hasPermission` queries this
   - What's unclear: Performance impact of calling `hasPermission` API on every Convex mutation
   - Recommendation: Benchmark in Phase 5; consider caching role in Convex users table if needed

3. **IP Address and User Agent Capture**
   - What we know: Audit logs should include request metadata for forensics
   - What's unclear: How to access HTTP request headers in Convex mutations (may require passing from client)
   - Recommendation: Make ipAddress/userAgent optional; explore Convex HTTP action patterns

## Sources

### Primary (HIGH confidence)
- [Better Auth Organization Plugin](https://www.better-auth.com/docs/plugins/organization) - hasPermission API, roles, permissions
- [Convex Authorization Best Practices](https://stack.convex.dev/authorization) - RBAC patterns, data scoping
- [Convex Custom Functions](https://stack.convex.dev/custom-functions) - customQuery/customMutation patterns
- [convex-helpers GitHub](https://github.com/get-convex/convex-helpers) - Custom function implementation

### Secondary (MEDIUM confidence)
- [Better Auth DeepWiki - Access Control](https://deepwiki.com/better-auth/better-auth/5.4-access-control-and-dynamic-roles) - Role checking details
- [Convex Row-Level Security](https://stack.convex.dev/row-level-security) - RLS patterns (for reference, not recommended)
- [Audit Log Guide](https://dev.to/dangtony98/guide-to-building-audit-logs-for-application-software-49fh) - Schema design

### Tertiary (LOW confidence)
- WebSearch results on SaaS compliance audit logging - general patterns, needs validation for DENR specifics

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing Better Auth + Convex integration
- Architecture: HIGH - Follows official Convex patterns (custom functions, explicit checks)
- Permissions model: HIGH - Better Auth default roles well-documented
- Audit logging: MEDIUM - Generic pattern solid; DENR specifics unknown
- Data scoping: HIGH - Explicit query scoping per Convex best practices

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (30 days - stable patterns)
