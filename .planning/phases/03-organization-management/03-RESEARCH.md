# Phase 3: Organization Management - Research

**Researched:** 2026-01-21
**Domain:** Organization-scoped queries + Treater management UI
**Confidence:** HIGH

## Summary

Phase 3 implements organization-scoped queries and management UI that allows treaters to view and manage their generators and haulers. The codebase already has the foundation: organization creation mutations (Phase 2), query helpers, and existing UI patterns in the treater app. The key work is refactoring existing queries to enforce tenant isolation via treaterId scoping, adding authorization checks, and replacing mock data with real Convex queries.

The standard approach uses Convex queries with explicit organization scoping. Each query must: (1) verify authentication, (2) resolve the user's active organization to a treater entity, and (3) scope all data access by treaterId. The UI already has component patterns (GlassCard grid for generators, DashboardLayout) that can be extended.

**Primary recommendation:** Create organization-scoped queries (`listGeneratorsForTreater`, `listHaulersForTreater`, `getGeneratorDetails`, `getHaulerDetails`) that enforce tenant isolation via treaterId. Use existing auth helpers (`requireAuth`, `getOrganizationLink`) and resolution helpers (`getDomainEntityFromOrg`). Replace mock data in GeneratorsOverview component with real queries using `@convex-dev/react-query` patterns.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| convex | 1.31.3 | Database + queries | Existing queries use .withIndex() for O(1) lookups; established patterns |
| @convex-dev/react-query | (bundled) | React Query integration | Already configured in router.tsx with ConvexQueryClient |
| @tanstack/react-router | latest | File-based routing | Existing routes pattern established in treater app |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| better-auth | 1.4.10 | Active org context | authClient.organization.getActive() for current org |
| lucide-react | latest | Icons | Already used in GeneratorsOverview, sidebar |
| shadcn/ui components | - | UI primitives | Table, Button, Badge, Card already available |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Explicit treaterId scoping | RLS policies | Convex is server-only; explicit scoping is clearer and easier to audit |
| ConvexQueryClient | useConvexQuery | ConvexQueryClient already set up; provides SSR support |
| File-based routes | Programmatic routes | File-based already established; maintains consistency |

**Installation:**
```bash
# No new dependencies - all required packages already installed
```

## Architecture Patterns

### Recommended Project Structure
```
packages/convex/convex/
├── generators/
│   ├── queries.ts           # Existing - needs refactoring for auth
│   └── index.ts             # Barrel export
├── haulers/
│   ├── queries.ts           # Existing - needs refactoring for auth
│   └── index.ts             # Barrel export
├── lib/
│   └── auth.ts              # Existing auth helpers

apps/treater/src/
├── routes/
│   ├── dashboard.tsx                    # Existing dashboard
│   ├── dashboard/
│   │   ├── generators/
│   │   │   ├── index.tsx               # Generator list page
│   │   │   └── $generatorId.tsx        # Generator detail page
│   │   └── haulers/
│   │       ├── index.tsx               # Hauler list page
│   │       └── $haulerId.tsx           # Hauler detail page
├── components/
│   ├── dashboard/
│   │   ├── generators-overview.tsx     # Existing - refactor to use real data
│   │   └── hauler-overview.tsx         # New - similar pattern
│   └── organizations/
│       ├── generator-detail-card.tsx   # Detail view component
│       └── hauler-detail-card.tsx      # Detail view component
```

### Pattern 1: Organization-Scoped Query
**What:** Query that enforces tenant isolation via treaterId
**When to use:** All queries that return organization-specific data
**Example:**
```typescript
// Source: Existing query patterns + Phase 2 auth helpers
import { query } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { requireAuth, getOrganizationLink } from "../lib/auth";

export const listGeneratorsForTreater = query({
  args: {
    treaterId: v.id("treaters"),
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // 1. Verify authentication
    await requireAuth(ctx);

    // 2. Verify treater exists and caller has access
    const treater = await ctx.db.get(args.treaterId);
    if (!treater) {
      throw new ConvexError("Treater not found");
    }

    // 3. Query with treaterId scoping (uses by_treater index)
    const generators = await ctx.db
      .query("generators")
      .withIndex("by_treater", (q) => q.eq("treaterId", args.treaterId))
      .collect();

    // 4. Filter by active status if needed
    if (args.includeInactive) {
      return generators;
    }

    return generators.filter((g) => g.isActive);
  },
});
```

### Pattern 2: Detail Query with Authorization
**What:** Single-record query with ownership verification
**When to use:** Getting details of generator/hauler with auth check
**Example:**
```typescript
// Source: Existing getById patterns + auth helpers
export const getGeneratorDetails = query({
  args: {
    generatorId: v.id("generators"),
    treaterId: v.id("treaters"), // Required for auth check
  },
  handler: async (ctx, args) => {
    // 1. Verify authentication
    await requireAuth(ctx);

    // 2. Get generator
    const generator = await ctx.db.get(args.generatorId);
    if (!generator) {
      throw new ConvexError("Generator not found");
    }

    // 3. Authorization: verify generator belongs to treater
    if (generator.treaterId !== args.treaterId) {
      throw new ConvexError("Access denied: Generator does not belong to this treater");
    }

    // 4. Get organization link for additional metadata
    const orgLink = await ctx.db
      .query("organizationLinks")
      .withIndex("by_generator", (q) => q.eq("generatorId", args.generatorId))
      .first();

    return {
      ...generator,
      organizationLink: orgLink,
    };
  },
});
```

### Pattern 3: Hauler Query via Partnership Table
**What:** Query haulers through treaterHaulerPartners junction table
**When to use:** Getting haulers for a treater (no direct treaterId on haulers)
**Example:**
```typescript
// Source: Existing haulers/queries.ts getByTreater
export const listHaulersForTreater = query({
  args: {
    treaterId: v.id("treaters"),
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // 1. Verify authentication
    await requireAuth(ctx);

    // 2. Get partnerships (uses by_treater index)
    const partnerships = await ctx.db
      .query("treaterHaulerPartners")
      .withIndex("by_treater", (q) => q.eq("treaterId", args.treaterId))
      .collect();

    // 3. Filter by active partnership if needed
    const activePartnerships = args.includeInactive
      ? partnerships
      : partnerships.filter((p) => p.isActive);

    // 4. Resolve hauler details
    const haulers = await Promise.all(
      activePartnerships.map(async (p) => {
        const hauler = await ctx.db.get(p.haulerId);
        if (!hauler) return null;

        // Include partnership metadata
        return {
          ...hauler,
          partnership: {
            isActive: p.isActive,
            createdAt: p.createdAt,
          },
        };
      })
    );

    return haulers.filter((h) => h !== null);
  },
});
```

### Pattern 4: Convex Query in React Component
**What:** Using @convex-dev/react-query for data fetching
**When to use:** All components that need Convex data
**Example:**
```typescript
// Source: Existing ConvexQueryClient setup in router.tsx
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@hwm/convex/api";

function GeneratorsList({ treaterId }: { treaterId: Id<"treaters"> }) {
  const { data: generators, isLoading, error } = useQuery(
    convexQuery(api.generators.listGeneratorsForTreater, { treaterId })
  );

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {generators?.map((generator) => (
        <GeneratorCard key={generator._id} generator={generator} />
      ))}
    </div>
  );
}
```

### Pattern 5: Getting Active Organization from Better Auth
**What:** Client-side active organization resolution
**When to use:** Determining which treater the user is acting as
**Example:**
```typescript
// Source: Better Auth organization plugin client API
import { authClient } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@hwm/convex/api";

function useActiveTreater() {
  // Get active organization from Better Auth
  const { data: activeOrg, isLoading: orgLoading } = authClient.useActiveOrganization();

  // Resolve to domain entity via organization link
  const { data: orgLink, isLoading: linkLoading } = useQuery(
    convexQuery(api.organizationLinks.getByBetterAuthOrgId, {
      betterAuthOrgId: activeOrg?.id ?? "",
    }),
    { enabled: !!activeOrg?.id }
  );

  return {
    treaterId: orgLink?.treaterId,
    isLoading: orgLoading || linkLoading,
  };
}
```

### Anti-Patterns to Avoid

- **Don't skip treaterId verification:** Every query must verify the caller has access to the treater
- **Don't query without indexes:** Always use .withIndex() for treaterId, haulerId lookups
- **Don't fetch all records then filter:** Use index queries to scope data at database level
- **Don't store treaterId in component state:** Get it from auth context or props
- **Don't mix mock and real data:** Replace mock imports completely when switching to real queries

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Query caching | Manual cache management | @convex-dev/react-query | Already configured, handles invalidation |
| Loading states | Custom loading logic | useQuery isLoading | Standard pattern, suspense-ready |
| Auth verification | Inline auth checks | requireAuth helper | Consistent error messages, centralized logic |
| Organization resolution | Manual link lookups | getDomainEntityFromOrg | Type-safe, handles all org types |
| Grid layouts | Custom grid CSS | Existing GlassCard pattern | Already has animation, responsive grid |

**Key insight:** The treater app already has working UI patterns (GeneratorsOverview with GlassCard grid, search/filter, etc.). The work is replacing mock data with real queries, not redesigning UI.

## Common Pitfalls

### Pitfall 1: Missing treaterId in Query Args
**What goes wrong:** Query fetches all generators regardless of treater ownership
**Why it happens:** Developer forgets to add treaterId parameter or doesn't pass it from component
**How to avoid:**
- Make treaterId a required arg (not optional)
- TypeScript will enforce at call sites
- Add runtime check in handler
**Warning signs:** Query returns data from other treaters

### Pitfall 2: N+1 Queries for Haulers
**What goes wrong:** Getting hauler list makes N additional queries (one per partnership)
**Why it happens:** The hauler-treater relationship goes through partnership table
**How to avoid:**
- Use Promise.all for parallel fetches (already in existing query)
- Consider denormalizing if performance issues arise
- Add pagination for large lists
**Warning signs:** Slow hauler list loads with many partnerships

### Pitfall 3: Not Using Indexes
**What goes wrong:** Full table scans on generators/treaterHaulerPartners tables
**Why it happens:** Using .filter() instead of .withIndex()
**How to avoid:**
- Always check schema for available indexes
- generators has `by_treater` index
- treaterHaulerPartners has `by_treater` and `by_treater_active` indexes
**Warning signs:** Slow queries as data grows

### Pitfall 4: Stale Organization Context
**What goes wrong:** UI shows data for previous organization after user switches orgs
**Why it happens:** Component doesn't re-render when active org changes
**How to avoid:**
- Use activeOrg?.id as key for query enabling
- Invalidate queries when org changes
- Use enabled: !!treaterId pattern
**Warning signs:** Wrong generators shown after switching organizations

### Pitfall 5: Inconsistent Authorization Patterns
**What goes wrong:** Some queries check auth, others don't; inconsistent error handling
**Why it happens:** Ad-hoc auth checks without shared pattern
**How to avoid:**
- Always call requireAuth(ctx) first
- Use consistent ConvexError messages
- Consider creating a withTreaterAccess wrapper
**Warning signs:** Some routes work unauthenticated, others don't

## Code Examples

Verified patterns from existing codebase:

### Existing Index Definitions (Schema)
```typescript
// Source: packages/convex/convex/schema/generators.ts
export const generators = defineTable({
  treaterId: v.id("treaters"),
  // ... other fields
})
  .index("by_treater", ["treaterId"])
  .index("by_treater_active", ["treaterId", "isActive"]);

// Source: packages/convex/convex/schema/treaterHaulerPartners.ts
export const treaterHaulerPartners = defineTable({
  treaterId: v.id("treaters"),
  haulerId: v.id("haulers"),
  isActive: v.boolean(),
  createdAt: v.number(),
})
  .index("by_treater", ["treaterId"])
  .index("by_hauler", ["haulerId"])
  .index("by_treater_active", ["treaterId", "isActive"]);
```

### Existing Auth Helper
```typescript
// Source: packages/convex/convex/lib/auth.ts
export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("Unauthorized: Please log in to continue");
  }
  return identity;
}
```

### Existing UI Pattern (GeneratorCard)
```typescript
// Source: apps/treater/src/components/dashboard/generators-overview.tsx
function GeneratorCard({ generator, delay, onViewDetails }: GeneratorCardProps) {
  return (
    <GlassCard
      animate
      animationDelay={delay}
      interactive
      className="p-5 space-y-4"
      onClick={() => onViewDetails(generator)}
    >
      {/* Header with icon, name, status badge */}
      {/* Contact info row */}
      {/* Storage capacity bar */}
      {/* Quick stats */}
      {/* Footer with activity time */}
    </GlassCard>
  );
}
```

### Existing File-Based Route Pattern
```typescript
// Source: apps/treater/src/routes/dashboard.tsx
export const Route = createFileRoute("/dashboard")({
  beforeLoad: async ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: "/auth/$authView", params: { authView: "sign-in" } });
    }
  },
  component: DashboardPage,
});
```

### Router Context Type (for data fetching)
```typescript
// Source: apps/treater/src/routes/__root.tsx
interface RouterContext {
  queryClient: QueryClient;
  convexQueryClient: ConvexQueryClient;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Mock data in components | Convex queries | Phase 3 | Real-time data, proper scoping |
| No auth checks in queries | requireAuth in every query | Phase 2+ | Security enforcement |
| Full table scans | Index-based queries | Schema design | O(1) vs O(n) lookups |
| Manual data fetching | @convex-dev/react-query | Router setup | SSR support, caching |

**Current in codebase that needs updating:**
- `generators/queries.ts`: getByTreater exists but lacks auth check
- `haulers/queries.ts`: getByTreater exists but lacks auth check
- `GeneratorsOverview`: Uses mockGenerators, needs real query

## Open Questions

Things that couldn't be fully resolved:

1. **How to get treaterId for current user?**
   - What we know: Better Auth has activeOrganization, organizationLinks maps to treaterId
   - What's unclear: Best UX for users with multiple organizations
   - Recommendation: Use authClient.useActiveOrganization() + organizationLinks lookup. Single-org users skip org selection.

2. **Pagination for large lists?**
   - What we know: Current queries use .collect() (loads all)
   - What's unclear: Expected data volumes per treater
   - Recommendation: Start without pagination. Add cursor-based pagination if generators/haulers exceed ~50 per treater.

3. **Organization members list from Better Auth?**
   - What we know: Better Auth has `listMembers` API, organization plugin stores members
   - What's unclear: Exact API for querying members from Convex context
   - Recommendation: Use authClient.organization.listMembers() on client side, or query Better Auth member table via authComponent if server-side needed.

4. **Real-time updates for organization changes?**
   - What we know: Convex queries are reactive by default
   - What's unclear: If Better Auth organization changes trigger Convex reactivity
   - Recommendation: Organization link changes will trigger Convex reactivity. Active org changes from Better Auth need query invalidation.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `packages/convex/convex/generators/queries.ts` - established query patterns
- Existing codebase: `packages/convex/convex/haulers/queries.ts` - partnership lookup pattern
- Existing codebase: `packages/convex/convex/lib/auth.ts` - requireAuth helper
- Existing codebase: `apps/treater/src/components/dashboard/generators-overview.tsx` - UI patterns
- Existing codebase: `apps/treater/src/router.tsx` - ConvexQueryClient setup

### Secondary (MEDIUM confidence)
- Phase 2 research: organization bridge patterns, resolution helpers
- Better Auth organization plugin docs: client-side active organization APIs

### Tertiary (LOW confidence)
- Better Auth member listing: need to verify exact API for member queries

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use, verified in codebase
- Architecture patterns: HIGH - Extending existing patterns, not creating new ones
- Pitfalls: HIGH - Based on actual schema and existing query patterns
- Code examples: HIGH - Pulled from existing codebase

**Research date:** 2026-01-21
**Valid until:** ~2026-02-21 (30 days - extending stable patterns)
**Notes:** Phase 3 is primarily refactoring existing code to add auth and replace mock data. The UI patterns and query structure already exist; the work is wiring them together properly.
