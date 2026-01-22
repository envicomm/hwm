# Hospital Waste Management (HWM)

## What This Is

A multi-tenant SaaS platform for tracking hospital waste from generation through treatment and disposal, built for DENR Philippines compliance. Treaters (treatment facilities) are the primary tenants who manage generators (hospitals) and haulers (trucking companies) within their ecosystem. Now with complete authentication and organization management infrastructure.

## Core Value

Treaters can manage their complete waste tracking ecosystem — creating and overseeing generators and haulers with role-based access control — ensuring regulatory compliance and operational visibility.

## Current State (v1.1 Shipped)

**Shipped:** 2026-01-22

**What's working:**
- Multi-tenant authentication with Better Auth + Convex across three apps
- Organization bridge pattern linking auth orgs to domain entities
- Team management with invitations, role assignment, member removal
- Role-based access control with permission matrix and audit logging
- Cross-app session sharing with organization-type routing
- Organization switcher for multi-org users

**Tech stack:**
- Frontend: React 19, TanStack Router (file-based), TanStack Query, Tailwind CSS 4, shadcn/ui
- Backend: Convex 1.31.3 (serverless database + functions)
- Auth: Better Auth 1.4.10 with @convex-dev/better-auth 0.10.9, convex-helpers 0.1.111
- Email: Resend (invitation notifications)

**Stats:** 234 TypeScript files, ~25,000 LOC, 6 phases, 26 plans

## Next Milestone: v1.2 Waste Tracking

**Goal:** Enable complete waste lifecycle tracking from hospital generation through disposal, with QR-based traceability across all three apps.

**Target features:**
- Waste logging with QR codes (both hospital-generated and pre-manufactured modes)
- Collection request workflow between generators, treaters, and haulers
- Treatment processing at facility
- Disposal batching and final disposal confirmation
- Real-time status tracking across all transitions

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Monorepo structure with three apps (generator, treater, trucking) — existing
- ✓ Convex backend with schema for treaters, generators, haulers, users, wasteBags — existing
- ✓ Better Auth integration foundations — existing
- ✓ TanStack Router file-based routing — existing
- ✓ Email (Resend) and SMS (Twilio) communication actions — existing
- ✓ Treater signup with email/password — v1.1
- ✓ Treater login with session persistence — v1.1
- ✓ Generator login (account created by treater) — v1.1
- ✓ Hauler login (account created by treater) — v1.1
- ✓ Treater creates generator organization with initial owner — v1.1
- ✓ Treater creates hauler organization with initial owner — v1.1
- ✓ Treater views and manages their generators — v1.1
- ✓ Treater views and manages their haulers — v1.1
- ✓ Org owner can invite team members — v1.1
- ✓ Org owner/admin can assign roles (owner, admin, member) — v1.1
- ✓ Org owner/admin can remove team members — v1.1
- ✓ Role-based UI showing appropriate features per role — v1.1
- ✓ Standard role hierarchy: Owner (full + billing), Admin (manage team + settings), Member (use features) — v1.1
- ✓ Scoped visibility: treaters see own data + linked orgs — v1.1
- ✓ Generators see only their own org data — v1.1
- ✓ Haulers see only their own org data — v1.1
- ✓ Session works across all three apps — v1.1
- ✓ User redirected to appropriate app based on org type — v1.1

### Active

<!-- Current scope. Building toward these. -->

**Waste Tracking (v1.2 target):**
- [ ] Hospital staff can log waste with QR code
- [ ] Collection request workflow
- [ ] Treatment processing
- [ ] Disposal batching
- [ ] Real-time status tracking

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- DENR compliance documents (COT, PTT, HazwasteID) — deferred to v1.3 (requires stable waste tracking first)
- Vision AI for waste classification — deferred (nice-to-have, not core)
- Driver location tracking — deferred (requires mobile app optimization)
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
| Treater as primary tenant | Treaters manage the waste chain; generators and haulers operate within treater ecosystem | ✓ Good |
| Treaters create generator/hauler accounts | Simplifies onboarding; no self-registration complexity | ✓ Good |
| Haulers exclusive to one treater | Simplifies access control; aligns with typical business relationships | ✓ Good |
| Standard role hierarchy (owner/admin/member) | Common pattern; sufficient for initial needs | ✓ Good |
| Scoped visibility (own + linked) | Treaters need oversight; sub-orgs need privacy from each other | ✓ Good |
| Organization bridge pattern (organizationLinks) | Separates auth concerns from domain logic; Better Auth manages generic orgs | ✓ Good |
| Better Auth crossDomain for session sharing | Single sign-on across three localhost ports | ✓ Good |
| Permission matrix with OrgRole mappings | Type-safe, extensible permission checking | ✓ Good |
| Audit logging for sensitive actions | DENR compliance preparation, security visibility | ✓ Good |
| Port-based app detection for SSR routing | window.location not available in server contexts | ✓ Good |

---
*Last updated: 2026-01-22 after v1.1 milestone completion*
