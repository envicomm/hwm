---
name: convex
description: Develop Convex backend functions with proper patterns for schema design, queries, mutations, actions, and multi-tenant access control. Use this skill when writing or modifying Convex code.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Convex Development Skill

Build robust Convex backend code following established patterns for this project's multi-tenant architecture.

## Stack

- **Convex** - Serverless database + functions
- **Better Auth** - Authentication with organization/multi-tenant support
- **TanStack Query** - Client-side data fetching integration via `@convex-dev/react-query`

## Project Structure

```
packages/convex/convex/
├── _generated/           # Auto-generated types (don't edit)
├── schema/               # Table definitions
│   ├── index.ts          # Exports all tables
│   └── validators.ts     # Shared validator literals
├── [domain]/             # Domain-specific functions
│   ├── queries.ts        # Read operations
│   ├── mutations.ts      # Write operations
│   └── index.ts          # Re-exports
├── communications/       # Email/SMS actions
├── schema.ts             # Combines all schema tables
├── auth.ts               # Better Auth setup
└── http.ts               # HTTP endpoints
```

## Core Principles

### 1. Schema Design

**One table per file** in `schema/` directory:

```typescript
// schema/tableName.ts
import { defineTable } from "convex/server";
import { v } from "convex/values";

export const tableName = defineTable({
  // Required fields first
  name: v.string(),

  // Foreign keys use v.id()
  parentId: v.id("parentTable"),

  // Optional fields
  description: v.optional(v.string()),

  // Standard metadata (always include)
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_parent", ["parentId"])
  .index("by_name", ["name"]);
```

**Index naming**: Use `by_fieldName` convention. Create indexes for:
- Foreign key lookups (`by_treater`, `by_generator`)
- Status filtering (`by_status`, `by_treater_status`)
- Unique lookups (`by_qr_code`, `by_email`)

### 2. Shared Validators

Define reusable union types in `schema/validators.ts`:

```typescript
import { v } from "convex/values";

export const userRole = v.union(
  v.literal("generator"),
  v.literal("treater"),
  v.literal("hauler"),
  v.literal("driver"),
  v.literal("admin")
);
```

Import and use in schemas and function args for consistency.

### 3. Query Patterns

**Always use indexes** for filtered queries:

```typescript
import { query } from "../_generated/server";
import { v } from "convex/values";

export const getByParent = query({
  args: {
    parentId: v.id("parents"),
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("items")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .collect();

    if (args.includeInactive) return items;
    return items.filter((item) => item.isActive);
  },
});
```

**Simple lookups** use `ctx.db.get()`:

```typescript
export const getById = query({
  args: { id: v.id("items") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
```

### 4. Mutation Patterns

**Always validate arguments** with specific validators:

```typescript
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { userRole } from "../schema/validators";

export const create = mutation({
  args: {
    parentId: v.id("parents"),
    name: v.string(),
    role: userRole,  // Use shared validator
    settings: v.optional(v.object({
      enabled: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("items", {
      ...args,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});
```

**Updates use `patch`** with optional fields:

```typescript
export const update = mutation({
  args: {
    id: v.id("items"),
    name: v.optional(v.string()),
    settings: v.optional(v.object({
      enabled: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return id;
  },
});
```

**Soft deletes** over hard deletes:

```typescript
export const remove = mutation({
  args: { id: v.id("items") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});
```

### 5. Action Patterns

Use actions for **external API calls only**:

```typescript
import { action } from "../_generated/server";
import { v } from "convex/values";

export const sendEmail = action({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL ?? "noreply@example.com",
        to: args.to,
        subject: args.subject,
        html: args.html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send email: ${error}`);
    }

    return { success: true };
  },
});
```

**Actions can call queries/mutations** via `ctx.runQuery()` and `ctx.runMutation()`.

### 6. Multi-Tenant Access Control

This project uses a **treater-centric** multi-tenant model:

```
Treater (primary tenant)
├── Generators (hospitals) - invited by treater
├── Haulers (trucking partners) - linked via treaterHaulerPartners
└── Users - role-based access
```

**Always scope queries by tenant**:

```typescript
// Good - scoped to treater
.withIndex("by_treater", (q) => q.eq("treaterId", args.treaterId))

// Bad - fetches all records
.query("items").collect()
```

**Denormalize tenant IDs** for efficient queries:

```typescript
// wasteBags table includes both generatorId AND treaterId
// Even though generator belongs to treater, we store treaterId
// for direct index lookups without joins
treaterId: v.id("treaters"),
generatorId: v.id("generators"),
```

## Anti-Patterns to Avoid

### No Argument Validation
```typescript
// BAD - accepts any data
handler: async (ctx, { id, update }) => {
  await ctx.db.patch(id, update);
}

// GOOD - validates specific fields
args: {
  id: v.id("messages"),
  body: v.optional(v.string()),
},
```

### Missing Tenant Scoping
```typescript
// BAD - returns all records
const items = await ctx.db.query("items").collect();

// GOOD - scoped to tenant
const items = await ctx.db
  .query("items")
  .withIndex("by_treater", (q) => q.eq("treaterId", treaterId))
  .collect();
```

### Using Actions for Database Operations
```typescript
// BAD - use mutation instead
export const createItem = action({ ... });

// GOOD - mutations are transactional
export const createItem = mutation({ ... });
```

### Spoofable Arguments
```typescript
// BAD - userId from args can be spoofed
args: { userId: v.string() },

// GOOD - get user from auth context
const user = await ctx.auth.getUserIdentity();
```

## File Organization

When adding new functionality:

1. **New table**: Create `schema/tableName.ts`, export from `schema/index.ts`, add to `schema.ts`
2. **New domain**: Create `domainName/queries.ts`, `domainName/mutations.ts`, `domainName/index.ts`
3. **Shared validator**: Add to `schema/validators.ts`

## Quality Checks

Before finishing:
- [ ] All queries use indexes for filtered lookups
- [ ] All mutations validate arguments with specific types
- [ ] Timestamps (`createdAt`, `updatedAt`) are included
- [ ] Tenant scoping is applied where needed
- [ ] No hardcoded IDs or magic strings
- [ ] Error messages are descriptive

See [PATTERNS.md](PATTERNS.md) for complete code examples.
