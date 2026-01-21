# Hospital Waste Management (HWM)

## What This Is

A multi-tenant SaaS platform for tracking hospital waste from generation through treatment and disposal, built for DENR Philippines compliance. Treaters (treatment facilities) are the primary tenants who manage generators (hospitals) and haulers (trucking companies) within their ecosystem.

## Core Value

Treaters can manage their complete waste tracking ecosystem — creating and overseeing generators and haulers with role-based access control — ensuring regulatory compliance and operational visibility.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Monorepo structure with three apps (generator, treater, trucking) — existing
- ✓ Convex backend with schema for treaters, generators, haulers, users, wasteBags — existing
- ✓ Better Auth integration foundations — existing
- ✓ TanStack Router file-based routing — existing
- ✓ Email (Resend) and SMS (Twilio) communication actions — existing

### Active

<!-- Current scope. Building toward these. -->

**Authentication:**
- [ ] Treater signup with email/password
- [ ] Treater login with session persistence
- [ ] Generator login (account created by treater)
- [ ] Hauler login (account created by treater)

**Organization Management:**
- [ ] Treater creates generator organization with initial owner
- [ ] Treater creates hauler organization with initial owner
- [ ] Treater views and manages their generators
- [ ] Treater views and manages their haulers

**Team Management:**
- [ ] Org owner can invite team members
- [ ] Org owner/admin can assign roles (owner, admin, member)
- [ ] Org owner/admin can remove team members
- [ ] Role-based UI showing appropriate features per role

**Access Control:**
- [ ] Standard role hierarchy: Owner (full + billing), Admin (manage team + settings), Member (use features)
- [ ] Scoped visibility: treaters see own data + linked orgs
- [ ] Generators see only their own org data
- [ ] Haulers see only their own org data

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Waste bag tracking and lifecycle — deferred to next milestone (auth foundation first)
- Collection requests and scheduling — deferred (requires auth complete)
- Treatment processing and certificates — deferred (requires waste tracking)
- DENR compliance documents (COT, PTT, HazwasteID) — deferred (requires treatment flow)
- Hauler partnerships with multiple treaters — haulers are exclusive to one treater (simplifies access control)
- Self-registration for generators/haulers — treaters create these accounts directly

## Context

**Domain:**
- Hospital waste management in the Philippines
- DENR (Department of Environment and Natural Resources) regulatory compliance
- Waste lifecycle: initialized → to_be_collected → collected → treated → aggregated → disposal_requested → disposed

**Technical environment:**
- Existing monorepo with React 19, Convex, TanStack Router, Tailwind CSS 4, shadcn/ui
- Better Auth with Convex adapter for authentication
- Three frontend apps targeting different user types
- Codebase analysis available in `.planning/codebase/`

**Organization model:**
- Treater (primary tenant) → creates → Generators (hospitals)
- Treater (primary tenant) → creates → Haulers (trucking companies)
- Each organization has users with roles: owner, admin, member

## Constraints

- **Tech stack**: Must use existing stack (React 19, Convex, TanStack Router, Better Auth)
- **Multi-tenancy**: All data isolated by organization with treater as parent
- **Auth provider**: Better Auth with organization and admin plugins
- **Compliance**: Must support future DENR reporting requirements

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Treater as primary tenant | Treaters manage the waste chain; generators and haulers operate within treater ecosystem | — Pending |
| Treaters create generator/hauler accounts | Simplifies onboarding; no self-registration complexity | — Pending |
| Haulers exclusive to one treater | Simplifies access control; aligns with typical business relationships | — Pending |
| Standard role hierarchy (owner/admin/member) | Common pattern; sufficient for initial needs | — Pending |
| Scoped visibility (own + linked) | Treaters need oversight; sub-orgs need privacy from each other | — Pending |

---
*Last updated: 2026-01-21 after initialization*
