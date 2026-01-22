---
phase: 05-role-based-access-control
plan: 02
subsystem: auth
tags: [rbac, convex, auth, user-context]
depends:
  requires: ["01-core-authentication", "02-organization-bridge"]
  provides: ["user-context-resolution", "protected-function-wrappers"]
  affects: ["05-03", "05-04", "05-05", "05-06"]
tech-stack:
  added: []
  patterns: ["custom-functions", "fail-safe-auth"]
files:
  key-files:
    created:
      - packages/convex/convex/lib/userContext.ts
      - packages/convex/convex/lib/customFunctions.ts
    modified: []
decisions:
  - id: "user-context-resolution-pattern"
    choice: "Use Better Auth API (getActiveMember, getSession) for org context"
    rationale: "authComponent.getAuthUser returns only user doc, not session with activeOrganizationId"
  - id: "fail-safe-org-role"
    choice: "Default to 'member' (most restrictive) when Better Auth API fails"
    rationale: "Prevents privilege escalation if API is temporarily unavailable"
  - id: "inline-orgrole-type"
    choice: "Define OrgRole inline with TODO to import from permissions.ts"
    rationale: "05-01 executing in parallel; will sync types after both complete"
metrics:
  duration: "~5 minutes"
  completed: "2026-01-22"
---

# Phase 5 Plan 02: User Context and Custom Functions Summary

**One-liner:** UserContext resolution from Better Auth with protectedQuery/protectedMutation wrappers using convex-helpers pattern

## What Was Built

### 1. User Context Resolution (`userContext.ts`)

Created a comprehensive user context type and resolution function:

**UserContext type includes:**
- `userId`: Better Auth user ID (string)
- `email`: User email
- `name`: Optional user name
- `orgId`: Better Auth organization ID
- `orgRole`: Organization role (`owner` | `admin` | `member`)
- `domainRole`: Domain role (`generator` | `treater` | `hauler` | `driver` | `admin`)
- `treaterId`, `generatorId`, `haulerId`: Entity IDs (one set based on org type)
- `orgType`: Organization type for convenience routing

**Key functions:**
- `resolveUserContext(ctx)`: Returns full user context or null
- `requireUserContext(ctx)`: Returns user context or throws UNAUTHORIZED

### 2. Protected Function Wrappers (`customFunctions.ts`)

Created convex-helpers based wrappers:

- `protectedQuery`: Injects `ctx.user` with UserContext, throws if unauthenticated
- `protectedMutation`: Same for mutations
- `optionalAuthQuery`: Injects `ctx.user` (nullable) for mixed auth endpoints
- `optionalAuthMutation`: Same for mutations

## Implementation Details

### Better Auth API Usage

The implementation discovered that `authComponent.getAuthUser()` returns only the user document without session info. The activeOrganizationId is obtained via:

1. **Primary**: `auth.api.getActiveMember({ headers })` - returns org ID and role
2. **Fallback**: `auth.api.getSession({ headers })` - session has activeOrganizationId

```typescript
// Get active member info (includes organizationId and role)
const memberResult = await auth.api.getActiveMember({ headers });
if (memberResult) {
  activeOrgId = memberResult.organizationId;
  orgRole = memberResult.role as OrgRole;
}
```

### Fail-Safe Pattern

If Better Auth API fails, orgRole defaults to "member" (most restrictive):

```typescript
let orgRole: OrgRole = "member"; // Default to most restrictive
try {
  const memberResult = await auth.api.getActiveMember({ headers });
  // ...
} catch (error) {
  console.warn("Failed to fetch active member, defaulting to member:", error);
  // orgRole remains "member"
}
```

This ensures:
- System remains functional during API issues
- Users can perform basic actions
- Admin/owner actions require successful role verification

### Domain Role Resolution

Domain role is determined from:
1. **Primary**: Domain users table `role` field
2. **Fallback**: Infer from organization type

```typescript
if (domainUser?.role) {
  domainRole = domainUser.role;
} else {
  domainRole = orgLink.organizationType as DomainRole;
}
```

## Usage Examples

### Protected Query
```typescript
export const getMyGenerators = protectedQuery({
  args: {},
  handler: async (ctx, args) => {
    // ctx.user is guaranteed to exist with full UserContext
    if (ctx.user.orgType !== "treater") {
      throw new ConvexError("Only treaters can list generators");
    }
    return ctx.db
      .query("generators")
      .withIndex("by_treater", (q) => q.eq("treaterId", ctx.user.treaterId!))
      .collect();
  },
});
```

### Protected Mutation
```typescript
export const updateGenerator = protectedMutation({
  args: { generatorId: v.id("generators"), name: v.string() },
  handler: async (ctx, args) => {
    // Check org role before proceeding
    if (ctx.user.orgRole === "member") {
      throw new ConvexError("Admin access required");
    }
    // Proceed with update...
  },
});
```

## Commits

| Hash | Message |
|------|---------|
| `575ae53` | feat(05-02): create user context resolution for RBAC |
| `320f4ea` | feat(05-02): create protected function wrappers for RBAC |

## Files Created

| File | Purpose |
|------|---------|
| `packages/convex/convex/lib/userContext.ts` | UserContext type and resolution functions |
| `packages/convex/convex/lib/customFunctions.ts` | protectedQuery/protectedMutation wrappers |

## Verification Results

- [x] TypeScript compiles without errors in lib folder
- [x] UserContext type includes all required fields
- [x] resolveUserContext returns null for unauthenticated users
- [x] requireUserContext throws ConvexError with UNAUTHORIZED code
- [x] protectedQuery/protectedMutation inject ctx.user
- [x] Fail-safe behavior: orgRole defaults to "member" on API error
- [x] Key link verified: customFunctions imports from userContext

## Deviations from Plan

### [Rule 1 - Bug] Better Auth API return type mismatch

**Found during:** Task 1
**Issue:** Plan assumed `authUser.session?.activeOrganizationId` would work, but `getAuthUser` returns only user document without session
**Fix:** Used `auth.api.getActiveMember` and `auth.api.getSession` to get organization context
**Files modified:** `userContext.ts`
**Commit:** `575ae53`

## Next Phase Readiness

**Ready for Plan 05-03 (Permission Checking Functions)**
- UserContext available with all required fields
- Protected wrappers ready for use in permission-checked queries
- Fail-safe pattern established for robust operation

**Integration note:** Once 05-01 completes, update userContext.ts to import OrgRole from permissions.ts instead of inline definition.
