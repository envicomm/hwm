# Convex Code Patterns

Complete code examples for common Convex patterns in this project.

## Schema Definitions

### Basic Table with Indexes

```typescript
// schema/items.ts
import { defineTable } from "convex/server";
import { v } from "convex/values";

export const items = defineTable({
  // Foreign keys
  treaterId: v.id("treaters"),
  generatorId: v.id("generators"),

  // Required fields
  name: v.string(),
  code: v.string(),

  // Optional fields
  description: v.optional(v.string()),
  weightKg: v.optional(v.number()),

  // Status using union literal
  status: v.union(
    v.literal("pending"),
    v.literal("active"),
    v.literal("completed")
  ),

  // Nested object
  location: v.optional(
    v.object({
      lat: v.number(),
      lng: v.number(),
    })
  ),

  // Soft delete flag
  isActive: v.boolean(),

  // Standard metadata
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  // Single field indexes
  .index("by_code", ["code"])
  .index("by_treater", ["treaterId"])
  .index("by_generator", ["generatorId"])
  .index("by_status", ["status"])
  // Compound indexes for filtered queries
  .index("by_treater_status", ["treaterId", "status"])
  .index("by_generator_status", ["generatorId", "status"]);
```

### Shared Validators

```typescript
// schema/validators.ts
import { v } from "convex/values";

// Status literals - define once, use everywhere
export const itemStatus = v.union(
  v.literal("pending"),
  v.literal("active"),
  v.literal("completed")
);

// Role literals
export const userRole = v.union(
  v.literal("generator"),
  v.literal("treater"),
  v.literal("hauler"),
  v.literal("driver"),
  v.literal("admin")
);

// Reusable object shapes
export const locationValidator = v.object({
  lat: v.number(),
  lng: v.number(),
});

export const addressValidator = v.object({
  street: v.string(),
  city: v.string(),
  state: v.string(),
  postalCode: v.string(),
  country: v.optional(v.string()),
});
```

### Schema Index File

```typescript
// schema/index.ts
export { items } from "./items";
export { users } from "./users";
export { treaters } from "./treaters";
// ... export all tables
```

### Main Schema

```typescript
// schema.ts
import { defineSchema } from "convex/server";
import { items, users, treaters } from "./schema/index";

export default defineSchema({
  items,
  users,
  treaters,
});
```

---

## Query Patterns

### Get by ID

```typescript
// domain/queries.ts
import { query } from "../_generated/server";
import { v } from "convex/values";

export const getById = query({
  args: {
    id: v.id("items"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
```

### Get by Foreign Key with Index

```typescript
export const getByTreater = query({
  args: {
    treaterId: v.id("treaters"),
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("items")
      .withIndex("by_treater", (q) => q.eq("treaterId", args.treaterId))
      .collect();

    if (args.includeInactive) {
      return items;
    }

    return items.filter((item) => item.isActive);
  },
});
```

### Get with Compound Index

```typescript
export const getByTreaterAndStatus = query({
  args: {
    treaterId: v.id("treaters"),
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("completed")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("items")
      .withIndex("by_treater_status", (q) =>
        q.eq("treaterId", args.treaterId).eq("status", args.status)
      )
      .collect();
  },
});
```

### Get First Match

```typescript
export const getByCode = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("items")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
  },
});
```

### Get with Related Data (Manual Join)

```typescript
export const getWithRelations = query({
  args: {
    id: v.id("items"),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) return null;

    // Fetch related data
    const [treater, generator, createdByUser] = await Promise.all([
      ctx.db.get(item.treaterId),
      ctx.db.get(item.generatorId),
      ctx.db.get(item.createdBy),
    ]);

    return {
      ...item,
      treater,
      generator,
      createdByUser,
    };
  },
});
```

### Paginated Query

```typescript
export const listPaginated = query({
  args: {
    treaterId: v.id("treaters"),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const results = await ctx.db
      .query("items")
      .withIndex("by_treater", (q) => q.eq("treaterId", args.treaterId))
      .paginate({ cursor: args.cursor ?? null, numItems: limit });

    return {
      items: results.page,
      nextCursor: results.continueCursor,
      isDone: results.isDone,
    };
  },
});
```

---

## Mutation Patterns

### Create with Timestamps

```typescript
// domain/mutations.ts
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { itemStatus } from "../schema/validators";

export const create = mutation({
  args: {
    treaterId: v.id("treaters"),
    generatorId: v.id("generators"),
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    status: itemStatus,
    location: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
      })
    ),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const id = await ctx.db.insert("items", {
      ...args,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});
```

### Update with Partial Fields

```typescript
export const update = mutation({
  args: {
    id: v.id("items"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(itemStatus),
    location: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(id, {
      ...cleanUpdates,
      updatedAt: Date.now(),
    });

    return id;
  },
});
```

### Soft Delete

```typescript
export const remove = mutation({
  args: {
    id: v.id("items"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});
```

### Hard Delete (Use Sparingly)

```typescript
export const hardDelete = mutation({
  args: {
    id: v.id("items"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
```

### Status Transition with History

```typescript
export const updateStatus = mutation({
  args: {
    id: v.id("items"),
    newStatus: itemStatus,
    updatedBy: v.id("users"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Item not found");

    const now = Date.now();

    // Update the item
    await ctx.db.patch(args.id, {
      status: args.newStatus,
      updatedAt: now,
    });

    // Record history
    await ctx.db.insert("itemStatusHistory", {
      itemId: args.id,
      previousStatus: item.status,
      newStatus: args.newStatus,
      changedBy: args.updatedBy,
      notes: args.notes,
      changedAt: now,
    });

    return args.id;
  },
});
```

### Bulk Operations

```typescript
export const bulkUpdateStatus = mutation({
  args: {
    ids: v.array(v.id("items")),
    newStatus: itemStatus,
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await Promise.all(
      args.ids.map((id) =>
        ctx.db.patch(id, {
          status: args.newStatus,
          updatedAt: now,
        })
      )
    );

    return args.ids.length;
  },
});
```

---

## Action Patterns

### External API Call (Email)

```typescript
// communications/email.ts
import { action } from "../_generated/server";
import { v } from "convex/values";

export const sendEmail = action({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
    text: v.optional(v.string()),
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
        text: args.text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send email: ${error}`);
    }

    const result = (await response.json()) as { id: string };
    return { success: true, id: result.id };
  },
});
```

### Action Calling Query + External API

```typescript
import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

export const sendNotificationToUser = action({
  args: {
    userId: v.id("users"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // Call a query to get user data
    const user = await ctx.runQuery(api.users.getById, { id: args.userId });

    if (!user || !user.email) {
      throw new Error("User not found or has no email");
    }

    // Send external notification
    const response = await fetch("https://api.example.com/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        message: args.message,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send notification");
    }

    return { success: true };
  },
});
```

### Action Calling Mutation

```typescript
export const processAndSave = action({
  args: {
    data: v.string(),
    treaterId: v.id("treaters"),
  },
  handler: async (ctx, args) => {
    // Call external API for processing
    const response = await fetch("https://api.example.com/process", {
      method: "POST",
      body: args.data,
    });

    const result = await response.json();

    // Save result via mutation
    await ctx.runMutation(api.items.create, {
      treaterId: args.treaterId,
      name: result.name,
      // ... other fields
    });

    return { success: true };
  },
});
```

---

## Domain Index Pattern

```typescript
// domain/index.ts
export * from "./queries";
export * from "./mutations";
```

---

## Client-Side Usage (React)

### Query with TanStack Query

```typescript
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@hwm/convex/api";

function ItemsList({ treaterId }: { treaterId: Id<"treaters"> }) {
  const { data: items, isLoading } = useQuery(
    convexQuery(api.items.getByTreater, { treaterId })
  );

  if (isLoading) return <div>Loading...</div>;

  return (
    <ul>
      {items?.map((item) => (
        <li key={item._id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

### Mutation with TanStack Query

```typescript
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "@hwm/convex/api";

function CreateItemButton() {
  const createItem = useMutation({
    mutationFn: useConvexMutation(api.items.create),
  });

  const handleCreate = () => {
    createItem.mutate({
      name: "New Item",
      treaterId: "...",
      // ... other args
    });
  };

  return (
    <button onClick={handleCreate} disabled={createItem.isPending}>
      {createItem.isPending ? "Creating..." : "Create Item"}
    </button>
  );
}
```

---

## Error Handling

### Throwing Descriptive Errors

```typescript
export const getOrThrow = query({
  args: { id: v.id("items") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) {
      throw new Error(`Item with ID ${args.id} not found`);
    }
    return item;
  },
});
```

### Validation in Mutations

```typescript
export const create = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    treaterId: v.id("treaters"),
  },
  handler: async (ctx, args) => {
    // Validate treater exists
    const treater = await ctx.db.get(args.treaterId);
    if (!treater) {
      throw new Error("Invalid treater ID");
    }

    // Check for duplicate code
    const existing = await ctx.db
      .query("items")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (existing) {
      throw new Error(`Item with code "${args.code}" already exists`);
    }

    // Proceed with creation
    return await ctx.db.insert("items", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
```
