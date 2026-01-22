# Architecture

**Analysis Date:** 2026-01-21

## Pattern Overview

**Overall:** Multi-tenant SaaS platform using a monorepo architecture with separate frontend applications (React/TanStack) connecting to a centralized Convex backend for real-time data management and multi-tenant support.

**Key Characteristics:**
- **Multi-tenant:** Three primary organizations (Treaters, Generators, Haulers) with role-based access control
- **Distributed frontends:** Three independent React applications (generator, treater, trucking) each optimized for their respective stakeholders
- **Real-time backend:** Convex serverless database with queries, mutations, and actions handling all business logic
- **Authentication as layer:** Better Auth (via Convex integration) providing cross-app authentication, organization management, and invitations
- **Schema-driven:** Single source of truth for data model defined in `packages/convex/convex/schema/`

## Layers

**Presentation Layer (Frontend Applications):**
- Purpose: User-facing interfaces for three different stakeholder types (hospitals, treatment facilities, haulers/drivers)
- Location: `apps/generator/`, `apps/treater/`, `apps/trucking/`, `apps/mobile/`
- Contains: React components, TanStack Router routes, UI component library (shadcn/ui)
- Depends on: Convex backend, auth service (`@hwm/auth`), TanStack Query
- Used by: End users (hospitals, treatment facilities, drivers)

**API/Query Layer (Convex Functions):**
- Purpose: All data operations and business logic - queries, mutations, and actions
- Location: `packages/convex/convex/`
- Contains: Query files (`*/queries.ts`), mutation files (`*/mutations.ts`), actions, HTTP endpoints
- Depends on: Database schema, auth library
- Used by: All frontend applications via `@hwm/convex/api`

**Data Layer (Convex Database):**
- Purpose: Persistent storage with real-time sync, type-safe queries, and transaction support
- Location: `packages/convex/convex/schema/`
- Contains: Schema definitions for all tables (treaters, generators, haulers, users, wasteBags, etc.)
- Depends on: Nothing
- Used by: API layer (queries/mutations) and frontend via Convex React hooks

**Authentication Layer:**
- Purpose: Cross-app auth, organization management, session handling, and Better Auth integration
- Location: `packages/auth/src/`, `packages/convex/convex/auth.ts`, `packages/convex/convex/auth.config.ts`
- Contains: Auth client factory, routing helpers, Better Auth configuration, email/SMS communications
- Depends on: Convex database for organization links, Resend (email), Twilio (SMS)
- Used by: All frontends via `@hwm/auth`

**Shared Utilities Layer:**
- Purpose: Type definitions, configuration, validation rules shared across all apps
- Location: `packages/types/`, `packages/convex/convex/lib/auth.ts`
- Contains: TypeScript types, auth validation functions, helper utilities
- Depends on: Nothing internal
- Used by: API layer and all frontend applications

## Data Flow

**User Authentication & Session:**

1. User navigates to frontend app (generator/treater/trucking)
2. Frontend checks session via `authClient.getSession()` (from `@hwm/auth`)
3. If not authenticated, redirects to login or auth.$authView route
4. User submits credentials
5. Auth request goes to Convex HTTP endpoint (via Better Auth)
6. Convex creates user/session records and returns session token
7. Frontend stores session token and user context (via `useAuth()` hook in `@/contexts/auth-context`)
8. Subsequent requests include auth token from context

**Data Read Flow (Query Example - Getting Generators):**

1. Frontend component calls `useSuspenseQuery()` or similar TanStack Query hook
2. Query hooks Convex query function: `api.generators.getByTreater({ treaterId })`
3. Query executes in Convex: `packages/convex/convex/generators/queries.ts`
4. Query validates auth via `requireTreaterAccess()` (from `packages/convex/convex/lib/auth.ts`)
5. Query reads from database: `ctx.db.query("generators").withIndex("by_treater", ...)`
6. Result returned to frontend and cached by TanStack Query
7. Real-time sync: If data changes, Convex pushes update to frontend automatically

**Data Write Flow (Mutation Example - Creating Generator):**

1. Frontend form submission triggers mutation function
2. Frontend calls `useMutation()` from Convex React integration
3. Mutation invokes: `api.generators.create({ treaterId, name, address, ... })`
4. Mutation executes in Convex: `packages/convex/convex/generators/mutations.ts`
5. Auth check: `requireTreaterAccess(ctx, treaterId)` verifies user has access
6. Mutation writes to database: `ctx.db.insert("generators", { ... })`
7. Returns generated ID or status to frontend
8. TanStack Query invalidates related queries
9. UI updates with new data or optimistic update

**Waste Management Lifecycle:**

```
Generator logs waste:
  → Generator app calls api.wasteBags.create()
  → Convex validates generator access, creates wasteBag with status "initialized"

Status transitions:
  → initialized → to_be_collected (collection requested)
  → to_be_collected → collected (hauler picks up)
  → collected → treated (treater processes waste)
  → treated → aggregated (combined with other treated waste)
  → aggregated → disposal_requested (treater requests disposal)
  → disposal_requested → disposed (final disposal complete)

Each transition:
  → Updates wasteBags table via mutation
  → Creates entry in wasteStatusHistory (audit trail)
  → May trigger auto-generation of certificates (COT, PTT)
  → Real-time updates pushed to all connected frontends
```

**State Management:**

- **Backend state:** Convex database (source of truth)
- **Frontend query cache:** TanStack Query manages caching and invalidation
- **Frontend UI state:** React component state via `useState`, context providers via `@/contexts/auth-context`
- **Real-time sync:** Convex React hooks automatically subscribe to database changes
- **Optimistic updates:** Not explicitly implemented; relies on TanStack Query cache invalidation

## Key Abstractions

**Organization Model:**
- Purpose: Represents tenant entities (Treater, Generator, Hauler)
- Examples: `packages/convex/convex/schema/treaters.ts`, `generators.ts`, `haulers.ts`
- Pattern: Each organization type has own table, linked users, and access control logic
- Multi-tenant: All queries filtered by organization ID via indexes

**User-Organization Link:**
- Purpose: Connect Better Auth users to HWM organization entities
- Examples: `packages/convex/convex/schema/organizationLinks.ts`, `organizationLinks/queries.ts`
- Pattern: `organizationLinks` table bridges Better Auth `organizations` with Treater/Generator/Hauler records
- Access Control: Used in auth functions like `requireTreaterAccess()`, `requireGeneratorAccess()`

**Waste Bag Lifecycle:**
- Purpose: Track individual waste containers from generation through disposal
- Examples: `packages/convex/convex/schema/wasteBags.ts`, `wasteStatusHistory.ts`
- Pattern: Status machine with audit trail; each status change logged in `wasteStatusHistory`
- Certificates: Triggers auto-generation of COT (Certificate of Treatment) and PTT (Permit to Transport)

**Collection Request:**
- Purpose: Treater requests waste collection from Generator; links to Hauler
- Examples: `packages/convex/convex/schema/collectionRequests.ts`
- Pattern: Created by Treater, assigned to Hauler, updates bag status

**Auth Access Control:**
- Purpose: Verify user belongs to organization before allowing operation
- Examples: `packages/convex/convex/lib/auth.ts` functions like `requireTreaterAccess()`, `requireGeneratorAccess()`
- Pattern: Called at start of mutation/query; throws `ConvexError` if unauthorized

## Entry Points

**Generator App (Hospital Portal):**
- Location: `apps/generator/src/routes/__root.tsx` (root layout)
- Triggers: Direct URL navigation to `https://generator.hwm.app` or `http://localhost:3001`
- Responsibilities:
  - Render root HTML, inject Convex provider, auth context provider
  - Setup TanStack Router with file-based routing
  - Route to login or dashboard based on auth state
  - Main child route: `apps/generator/src/routes/index.tsx` (landing/login)
  - Dashboard route: `apps/generator/src/routes/_dashboard/dashboard.tsx`
  - Certificate routes: `apps/generator/src/routes/certificates/`

**Treater App (Treatment Facility Portal):**
- Location: `apps/treater/src/routes/__root.tsx`
- Triggers: Direct URL navigation to `https://treater.hwm.app` or `http://localhost:3002`
- Responsibilities:
  - Same provider setup as generator app (Convex, auth, router)
  - Routes: dashboard, organization management, account settings
  - Main routes: `index.tsx` (landing), `dashboard.tsx`, `organization.$organizationView.tsx`

**Trucking App (Hauler/Driver Portal):**
- Location: `apps/trucking/src/routes/__root.tsx`
- Triggers: Direct URL navigation to `https://trucking.hwm.app` or `http://localhost:3003`
- Responsibilities:
  - Same provider setup
  - Routes: dashboard for collection requests and waste transport
  - Main routes: `index.tsx` (landing), `_dashboard/dashboard.tsx`

**Convex Backend:**
- Location: `packages/convex/convex/` (functions and schema)
- Triggers:
  - Frontend calls via `api.*` (auto-generated from functions)
  - HTTP endpoint: `packages/convex/convex/http.ts` for webhooks and external integrations
  - Auth HTTP handler: Better Auth routes (sign-up, sign-in, callbacks)
- Responsibilities:
  - Execute queries and mutations on database
  - Validate auth and organization access
  - Send emails (Resend) and SMS (Twilio) via actions
  - Generate certificates (COT, PTT) based on waste status

**Auth Service:**
- Location: `packages/auth/src/` (client factory)
- Triggers: Called by each frontend app during initialization
- Responsibilities:
  - Create auth client configured for specific app (generator/treater/trucking)
  - Provide routing helpers to determine which app to redirect to based on user's organizations
  - Expose hooks and methods: `signIn()`, `signUp()`, `signOut()`, `useSession()`

## Error Handling

**Strategy:** Layered error handling with user-friendly messages

**Patterns:**

1. **Backend (Convex) Errors:**
   - Auth errors: Throw `ConvexError("Unauthorized: ...")` from `lib/auth.ts`
   - Validation errors: Input validation via `v.object()`, `v.string()` in function args
   - Logic errors: Throw `ConvexError("Custom message")` in mutations
   - All errors propagate to frontend as rejected promises

2. **Frontend Error Handling:**
   - TanStack Query catches promise rejections from Convex calls
   - Query error state available via `error` property
   - Components check `isError` flag and render error messages
   - Auth errors redirect to login via `useAuth()` hook in `auth-context`

3. **HTTP Errors (Better Auth):**
   - Resend/Twilio failures caught in `packages/convex/convex/auth.ts` email handlers
   - Logged to console; user still receives confirmation (email sent async)
   - Webhook errors: Caught in `http.ts` handlers

## Cross-Cutting Concerns

**Logging:**
- Approach: Console logging for development; Convex logs available in dashboard
- Patterns: Log important mutations (user creation, waste status changes), errors, auth attempts
- No centralized logging service integrated yet

**Validation:**
- Approach: Convex validators at function boundary + frontend form validation
- Patterns:
  - Backend: `v.id("treaters")`, `v.string()`, `v.number()` in function args
  - Frontend: HTML5 validation, optional client-side libraries
  - Shared: Validator literals in `packages/convex/convex/schema/validators.ts`
- Validators applied to: All mutation arguments, required query parameters

**Authentication:**
- Approach: Better Auth integration via Convex component
- Patterns:
  - Session token stored in browser cookie
  - Each query/mutation checks identity via `ctx.auth.getUserIdentity()`
  - Organization membership verified via `organizationLinks` lookup
- Rate limiting: Enabled in `auth.config.ts` (5 login attempts per minute, 3 signups per 5 minutes)

**Multi-tenancy:**
- Approach: Organization-based isolation
- Patterns:
  - Every table has `treaterId` or `generatorId` or `haulerId` field
  - Indexes on org IDs: `withIndex("by_treater", q => q.eq("treaterId", treaterId))`
  - Queries always filter by org ID; mutation access checks verify user's org
  - No cross-organization data visibility

**Real-time Sync:**
- Approach: Automatic via Convex React hooks
- Patterns:
  - `useSuspenseQuery()` from Convex React subscribes to query results
  - When underlying data changes, hook receives update automatically
  - No manual polling or WebSocket management
  - TanStack Query layer provides caching and deduplication

---

*Architecture analysis: 2026-01-21*
