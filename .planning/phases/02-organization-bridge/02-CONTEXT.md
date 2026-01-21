# Phase 2: Organization Bridge - Context

**Gathered:** 2026-01-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Better Auth organizations are automatically linked to HWM domain entities (treaters, generators, haulers) when created. Includes adding betterAuthUserId to users table, creating mutations that atomically create domain entity + Better Auth org + link record, and providing resolution utilities. Team management, invitations, and RBAC are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Link creation timing
- Atomic operation: domain entity + Better Auth org + link created together in single transaction
- If any step fails, entire operation fails — no partial state, no orphaned entities
- No internal retries — user sees error and must retry
- Link record stores IDs only: betterAuthOrgId, organizationType, entityId (no denormalized names)
- Link includes parentBetterAuthOrgId for hierarchy tracking (enables "all orgs under this treater" queries)

### User-to-org mapping
- No owner assigned at creation — invited user becomes owner when they accept
- Treater has full access to generator/hauler org until owner accepts (can manage members, settings)
- When generator admin accepts invite, treater user is removed entirely from generator org
- Treater admin uses Better Auth admin plugin to impersonate if needed post-handoff
- Single org only: users belong to exactly one organization, separate accounts required for different orgs

### Claude's Discretion
- Exact mutation function signatures
- Index design for link table lookups
- Error message formatting for failures
- betterAuthUserId migration approach for existing users

</decisions>

<specifics>
## Specific Ideas

- "Treater admin can impersonate using better-auth admin plugin" — administrative access after ownership transfer happens through impersonation, not org membership
- Hierarchy tracking via parentBetterAuthOrgId supports querying child orgs without joining through domain tables

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-organization-bridge*
*Context gathered: 2026-01-21*
