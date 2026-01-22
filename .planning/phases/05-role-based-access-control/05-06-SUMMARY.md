---
phase: 05
plan: 06
title: Permission UI Integration
subsystem: frontend
tags: [react, permissions, rbac, ui, conditional-rendering]
dependency-graph:
  requires:
    - 05-01 (PERMISSIONS matrix)
    - 05-05 (protected mutations)
  provides:
    - usePermissions hook for all apps
    - PermissionGate component for all apps
    - Permission-aware UI components
  affects:
    - Future UI components with create/edit/delete actions
tech-stack:
  added: []
  patterns:
    - usePermissions hook pattern (client-side permission checking)
    - PermissionGate component pattern (conditional rendering)
key-files:
  created:
    - apps/treater/src/hooks/usePermissions.ts
    - apps/treater/src/components/ui/permission-gate.tsx
    - apps/generator/src/hooks/usePermissions.ts
    - apps/generator/src/components/ui/permission-gate.tsx
    - apps/trucking/src/hooks/usePermissions.ts
    - apps/trucking/src/components/ui/permission-gate.tsx
  modified:
    - apps/treater/src/components/team/member-actions.tsx
    - apps/treater/src/components/dashboard/generators-overview.tsx
    - apps/treater/src/components/dashboard/haulers-overview.tsx
decisions:
  - id: mirror-permissions-client-side
    title: Mirror server-side PERMISSIONS matrix in client hooks
    rationale: Ensures UI and backend have consistent permission rules
  - id: use-active-member-for-role
    title: Use authClient.useActiveMember for org role
    rationale: Better Auth provides accurate role from active organization
  - id: loading-state-returns-null
    title: PermissionGate returns null while loading permissions
    rationale: Prevents flash of forbidden content during initial load
metrics:
  duration: ~6 minutes
  completed: 2026-01-22
---

# Phase 05 Plan 06: Permission UI Integration Summary

**Client-side permission hooks and UI gates for role-based conditional rendering across all three apps.**

## One-liner

usePermissions hook and PermissionGate component added to treater, generator, and trucking apps with PERMISSIONS matrix mirroring server-side rules.

## What Was Built

### 1. usePermissions Hook (all apps)

Created `/hooks/usePermissions.ts` in each app with:

```typescript
export function usePermissions() {
  const { data: member, isPending } = authClient.useActiveMember();
  const orgRole = (member?.role as OrgRole) ?? "member";

  function can<R extends PermissionResource>(
    resource: R,
    action: PermissionAction<R>
  ): boolean {
    if (isPending) return false;
    return hasPermission(orgRole, resource, action);
  }

  return {
    orgRole,
    can,
    isOwner: orgRole === "owner",
    isAdmin: orgRole === "admin",
    isMember: orgRole === "member",
    isLoading: isPending,
  };
}
```

Features:
- Mirrors server-side PERMISSIONS matrix
- Type-safe resource/action checking via TypeScript generics
- Role convenience helpers (isOwner, isAdmin, isMember)
- Loading state handling

### 2. PermissionGate Component (all apps)

Created `/components/ui/permission-gate.tsx` in each app:

```typescript
export function PermissionGate<R extends PermissionResource>({
  resource,
  action,
  children,
  fallback = null,
}: PermissionGateProps<R>) {
  const { can, isLoading } = usePermissions();

  if (isLoading) return null;
  return can(resource, action) ? <>{children}</> : <>{fallback}</>;
}
```

Features:
- Declarative conditional rendering
- Optional fallback content
- Loading state protection (no flash of forbidden content)

### 3. UI Integrations (treater app)

**Team Member Actions (`member-actions.tsx`):**
- Added permission checks for `team.updateRole` and `team.remove`
- Hides entire action menu when user lacks both permissions
- Conditionally shows role change and remove actions separately

**Dashboard Create Buttons:**
- Wrapped "Add Generator" button with `PermissionGate resource="generator" action="create"`
- Added permission check for "Add Hauler" button using `can("hauler", "create")`

## Success Criteria Verification

| Criteria | Status |
|----------|--------|
| usePermissions hook in treater app | DONE |
| usePermissions hook in generator app | DONE |
| usePermissions hook in trucking app | DONE |
| PermissionGate in treater app | DONE |
| PermissionGate in generator app | DONE |
| PermissionGate in trucking app | DONE |
| Team member actions hidden from members | DONE |
| Delete actions only visible to owners | DONE (via matrix) |
| Edit actions only visible to owner/admin | DONE (via matrix) |
| Create actions only visible to owner/admin | DONE |
| Members see view-only UI | DONE |

## RBAC Requirements Addressed

| Requirement | Implementation |
|-------------|----------------|
| RBAC-01: Only owners can delete | PERMISSIONS matrix: `delete: ["owner"]` |
| RBAC-02: Owner/admin can edit | PERMISSIONS matrix: `update: ["owner", "admin"]` |
| RBAC-03: Members have read-only access | UI hides create/edit/delete actions from members |
| RBAC-04: Role-based UI filtering | PermissionGate component for conditional rendering |

## Commits

| Hash | Message |
|------|---------|
| d539712 | feat(05-06): add permission gate component and hook for treater app |
| db984b7 | feat(05-06): add permission gate component and hook for generator app |
| 9893885 | feat(05-06): add permission gate component and hook for trucking app |
| 21dd582 | feat(05-06): add permission gates to team member actions |
| 362fd6c | feat(05-06): add permission gates to dashboard create actions |

## Deviations from Plan

None - plan executed exactly as written.

## Files Changed

### Created (6 files)
- `apps/treater/src/hooks/usePermissions.ts` - Permission hook for treater
- `apps/treater/src/components/ui/permission-gate.tsx` - Gate component for treater
- `apps/generator/src/hooks/usePermissions.ts` - Permission hook for generator
- `apps/generator/src/components/ui/permission-gate.tsx` - Gate component for generator
- `apps/trucking/src/hooks/usePermissions.ts` - Permission hook for trucking
- `apps/trucking/src/components/ui/permission-gate.tsx` - Gate component for trucking

### Modified (3 files)
- `apps/treater/src/components/team/member-actions.tsx` - Added permission checks
- `apps/treater/src/components/dashboard/generators-overview.tsx` - Wrapped Add button
- `apps/treater/src/components/dashboard/haulers-overview.tsx` - Added permission check

## Usage Examples

### Check permission in component logic
```typescript
const { can, isOwner } = usePermissions();

// Check specific permission
if (can("generator", "delete")) {
  // Show delete button
}

// Use role helpers
if (isOwner) {
  // Show billing settings
}
```

### Wrap UI elements with PermissionGate
```tsx
<PermissionGate resource="generator" action="create">
  <Button>Add Generator</Button>
</PermissionGate>

<PermissionGate
  resource="organization"
  action="delete"
  fallback={<span>Contact owner to delete</span>}
>
  <Button variant="destructive">Delete Organization</Button>
</PermissionGate>
```

## Next Phase Readiness

Phase 5 (Role-Based Access Control) is now COMPLETE.

**Completed components:**
1. PERMISSIONS matrix (server-side) - 05-01
2. UserContext and custom functions - 05-02
3. Audit logging mutations - 05-03
4. Data scoping utilities - 05-04
5. Protected mutations with permission checks - 05-05
6. Permission UI integration - 05-06 (this plan)

**Ready for Phase 6:** Cross-App Authentication
- All permission infrastructure in place
- UI components can conditionally render based on roles
- Server-side mutations enforce permissions
- Audit trail captures sensitive operations
