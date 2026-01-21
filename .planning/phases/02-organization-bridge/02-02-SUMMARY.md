---
phase: 02-organization-bridge
plan: 02
subsystem: organization-bridge
tags: [convex, organization-resolution, type-safety, better-auth-bridge]
requires:
  - "01-04: Auth provider foundation"
  - "organizationLinks table schema"
  - "users table with betterAuthUserId field"
provides:
  - "Bidirectional org lookup (Better Auth ↔ Domain entities)"
  - "Type-safe organization link creation"
  - "User resolution from Better Auth ID"
affects:
  - "02-03: Organization creation mutations (will use these helpers)"
  - "Future org-scoped queries (all will use getDomainEntityFromOrg)"
  - "Future RBAC checks (will use getDomainUser)"
tech-stack:
  added: []
  patterns:
    - "Index-based O(1) lookups for org resolution"
    - "Type-safe helper pattern (prevents field confusion)"
    - "Switch-statement for type narrowing in TypeScript"
key-files:
  created:
    - path: "packages/convex/convex/organizations/helpers.ts"
      purpose: "Core resolution utilities for org bridge"
      exports: ["getDomainEntityFromOrg", "getBetterAuthOrgFromEntity", "makeOrgLinkData", "getDomainUser"]
    - path: "packages/convex/convex/organizations/index.ts"
      purpose: "Barrel export for organizations module"
  modified:
    - path: "packages/convex/convex/schema.ts"
      change: "Registered organizationLinks and transportPermits in main schema"
    - path: "packages/convex/convex/schema/index.ts"
      change: "Added organizationLinks export"
    - path: "packages/convex/convex/schema/organizationLinks.ts"
      change: "Added parentBetterAuthOrgId field and by_parent_org index"
    - path: "packages/convex/convex/schema/users.ts"
      change: "Added betterAuthUserId field and by_better_auth_user index"
decisions:
  - what: "Use switch statements for type-safe index queries"
    why: "TypeScript couldn't narrow types with computed index names"
    impact: "More verbose but fully type-safe, no runtime errors"
  - what: "Return null (not throw) from getDomainUser"
    why: "User may not exist during signup flow"
    impact: "Callers must handle null case"
  - what: "Fixed schema registration blocker immediately"
    why: "Rule 3: organizationLinks table wasn't registered, blocking all work"
    impact: "Can now query organizationLinks table from any module"
duration: "3m 44s"
completed: 2026-01-21
---

# Phase 2 Plan 2: Organization Resolution Helpers Summary

**One-liner:** Type-safe bidirectional lookup between Better Auth organizations and HWM domain entities (treaters, generators, haulers) using indexed queries.

## What Was Built

Created the organization resolution layer that bridges Better Auth's organization plugin to HWM's domain model:

1. **getDomainEntityFromOrg** - From Better Auth org ID → domain entity (treater/generator/hauler)
2. **getBetterAuthOrgFromEntity** - From domain entity → Better Auth org ID
3. **makeOrgLinkData** - Type-safe link creation helper (prevents storing generatorId in treaterId field)
4. **getDomainUser** - From Better Auth user ID → Convex user record

All helpers use proper Convex indexes for O(1) lookups. No table scans.

## How It Works

### Resolution Pattern

```typescript
// Get domain entity from auth context
const { link, entity, type } = await getDomainEntityFromOrg(ctx, betterAuthOrgId);

// Get Better Auth org from domain entity
const link = await getBetterAuthOrgFromEntity(ctx, "treater", treaterId);
```

### Type-Safe Link Creation

```typescript
// Correct: enforces treaterId for "treater" type
const linkData = makeOrgLinkData("treater", treaterId, betterAuthOrgId);

// Would fail at compile time: can't pass generatorId when type is "treater"
const bad = makeOrgLinkData("treater", generatorId, betterAuthOrgId); // TS error
```

This prevents the Pitfall 5 anti-pattern from RESEARCH.md where entity IDs get stored in wrong fields.

## Deviations from Plan

### Auto-fixed Issues (Rule 3: Blocking Issues)

**1. [Rule 3 - Blocking] Schema registration missing**

- **Found during:** Task 1 - trying to run typecheck
- **Issue:** organizationLinks table was defined (organizationLinks.ts exists) but not registered in main schema.ts, causing TypeScript errors for all queries using the table
- **Fix:**
  - Added organizationLinks to schema.ts imports and schema definition
  - Added organizationLinks export to schema/index.ts
  - Also found and fixed missing transportPermits table registration
- **Files modified:** schema.ts, schema/index.ts
- **Commit:** 73b0d72

**2. [Rule 3 - Blocking] Missing parentBetterAuthOrgId field**

- **Found during:** Task 1 - implementing getDomainEntityFromOrg
- **Issue:** organizationLinks schema lacked hierarchy tracking field mentioned in RESEARCH.md
- **Fix:** Added parentBetterAuthOrgId field and by_parent_org index to organizationLinks table
- **Files modified:** schema/organizationLinks.ts
- **Commit:** 73b0d72

**3. [Rule 3 - Blocking] Missing betterAuthUserId field and index**

- **Found during:** Task 1 - implementing getDomainUser
- **Issue:** users table lacked betterAuthUserId field required by getDomainUser helper
- **Fix:** Added betterAuthUserId optional field and by_better_auth_user index to users table
- **Files modified:** schema/users.ts
- **Commit:** 73b0d72

### Implementation Changes

**TypeScript narrowing approach**

- **Plan specified:** Generic index lookup with computed field names
- **Actually implemented:** Switch statement for explicit type narrowing
- **Reason:** TypeScript couldn't narrow union types with computed index names
- **Impact:** More verbose but fully type-safe, prevents runtime errors

All deviations were blocking issues that prevented task completion. No architectural changes required.

## Key Decisions Made

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Use switch statements for type narrowing | TypeScript couldn't infer types with computed index names | Generic approach with `as any` casts (less safe) |
| getDomainUser returns null | User may not exist during signup flow | Throw error (would break signup flow) |
| Auto-fix schema registration | Plan couldn't proceed without registered table | Return checkpoint asking user to fix (adds unnecessary round trip) |
| Add parentBetterAuthOrgId immediately | Required for correct schema, mentioned in RESEARCH.md | Defer to later plan (would require migration) |

## Testing & Verification

✅ TypeScript compilation passes for organizations module
✅ All 4 helper functions exported correctly
✅ Functions use proper indexes (by_better_auth_org, by_treater, by_generator, by_hauler)
✅ makeOrgLinkData enforces type-to-field mapping at compile time
✅ Barrel export configured following existing module patterns

Pre-existing errors in communications module (email.ts, sms.ts) are unrelated to this work.

## Next Phase Readiness

**Ready for 02-03 (Organization Creation Mutations):**
- ✅ Resolution helpers available
- ✅ Schema includes all required fields
- ✅ Indexes configured for efficient queries
- ✅ Type safety prevents common pitfalls

**Blockers:** None

**Concerns:** None - implementation is straightforward

## File Inventory

### Created
- `packages/convex/convex/organizations/helpers.ts` (262 lines) - Core resolution utilities
- `packages/convex/convex/organizations/index.ts` (2 lines) - Barrel export

### Modified
- `packages/convex/convex/schema.ts` - Registered organizationLinks and transportPermits
- `packages/convex/convex/schema/index.ts` - Added organizationLinks export
- `packages/convex/convex/schema/organizationLinks.ts` - Added parentBetterAuthOrgId field/index
- `packages/convex/convex/schema/users.ts` - Added betterAuthUserId field/index

## Commit History

1. **73b0d72** - `fix(02-02): register organizationLinks table in schema`
   - Fixed blocking issue: table not registered in main schema
   - Added parentBetterAuthOrgId and betterAuthUserId fields

2. **fcf85fe** - `feat(02-02): create organization resolution helpers`
   - getDomainEntityFromOrg, getBetterAuthOrgFromEntity
   - makeOrgLinkData, getDomainUser
   - All with proper index usage and type safety

3. **7d59571** - `feat(02-02): create organizations module barrel export`
   - index.ts following existing module patterns

## Documentation

### Usage Examples

```typescript
// Example 1: Get domain entity from auth session
const session = await getAuthSession(ctx);
const { entity, type } = await getDomainEntityFromOrg(ctx, session.activeOrganizationId);

if (type === "treater") {
  // entity is Doc<"treaters">
  console.log(entity.licenseNumber);
}

// Example 2: Get Better Auth org for domain entity
const link = await getBetterAuthOrgFromEntity(ctx, "generator", generatorId);
const betterAuthOrgId = link.betterAuthOrgId;

// Example 3: Create type-safe link
const linkData = makeOrgLinkData("treater", treaterId, betterAuthOrgId);
await ctx.db.insert("organizationLinks", linkData);

// Example 4: Get domain user from Better Auth user
const user = await getDomainUser(ctx, session.userId);
if (!user) {
  // User needs to complete onboarding
}
```

## Lessons Learned

1. **Schema registration is critical** - Table definitions must be registered in main schema.ts or TypeScript can't infer types
2. **Switch statements for type narrowing** - Computed property names break TypeScript's type narrowing
3. **Index queries are fast** - O(1) lookups via indexes, no table scans
4. **Type-safe helpers prevent bugs** - makeOrgLinkData prevents storing IDs in wrong fields at compile time

## Links

- **Research:** [02-RESEARCH.md](./02-RESEARCH.md) - Pattern 3 & Pattern 4
- **Context:** [02-CONTEXT.md](./02-CONTEXT.md) - Link creation timing decisions
- **Schema:** [organizationLinks.ts](../../packages/convex/convex/schema/organizationLinks.ts)
