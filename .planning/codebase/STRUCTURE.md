# Codebase Structure

**Analysis Date:** 2026-01-21

## Directory Layout

```
hwm/                                    # Project root
├── apps/                               # Frontend applications (separate tenants)
│   ├── generator/                      # React app for hospitals (port 3001)
│   │   ├── src/
│   │   │   ├── routes/                 # TanStack Router file-based routes
│   │   │   ├── components/             # React components (ui, layout, dashboard)
│   │   │   ├── contexts/               # React context providers (auth)
│   │   │   ├── lib/                    # Utilities and helpers
│   │   │   ├── styles.css              # Global styles (Tailwind)
│   │   │   └── router.tsx              # Router setup with providers
│   │   ├── vite.config.ts              # Vite build config
│   │   └── package.json
│   │
│   ├── treater/                        # React app for treatment facilities (port 3002)
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── components/
│   │   │   ├── contexts/
│   │   │   ├── lib/
│   │   │   └── router.tsx
│   │   └── vite.config.ts
│   │
│   ├── trucking/                       # React app for haulers/drivers (port 3003)
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── components/
│   │   │   ├── contexts/
│   │   │   ├── lib/
│   │   │   └── router.tsx
│   │   └── vite.config.ts
│   │
│   └── mobile/                         # React Native app (future)
│       ├── src/
│       └── tsconfig.json
│
├── packages/                           # Shared libraries
│   ├── convex/                         # Backend logic (Convex serverless database)
│   │   ├── convex/                     # Convex functions and schema
│   │   │   ├── schema/                 # Database table definitions
│   │   │   │   ├── index.ts            # Schema root (combines all tables)
│   │   │   │   ├── treaters.ts         # Treater organization table
│   │   │   │   ├── generators.ts       # Generator (hospital) table
│   │   │   │   ├── haulers.ts          # Hauler organization table
│   │   │   │   ├── users.ts            # User management table
│   │   │   │   ├── wasteBags.ts        # Waste container tracking
│   │   │   │   ├── wasteStatusHistory.ts # Audit trail for waste status
│   │   │   │   ├── collectionRequests.ts # Waste collection requests
│   │   │   │   ├── treatments.ts       # Treatment records
│   │   │   │   ├── disposalBatches.ts  # Disposal batch aggregation
│   │   │   │   ├── treatmentCertificates.ts # COT storage
│   │   │   │   ├── disposalCertificates.ts  # Disposal proof storage
│   │   │   │   ├── bagInventory.ts     # Pre-manufactured bag stock
│   │   │   │   ├── bagDistributions.ts # Distribution history
│   │   │   │   ├── transportPermits.ts # PTT (Permit to Transport) records
│   │   │   │   ├── organizationLinks.ts # Bridge Better Auth orgs to HWM orgs
│   │   │   │   ├── treaterHaulerPartners.ts # Partnership relationships
│   │   │   │   └── validators.ts       # Shared validation literals
│   │   │   │
│   │   │   ├── generators/             # Generator-related functions
│   │   │   │   ├── queries.ts          # getByTreater, getById, getWithOrgLink
│   │   │   │   ├── mutations.ts        # create, update, remove
│   │   │   │   └── index.ts            # Barrel export
│   │   │   │
│   │   │   ├── haulers/                # Hauler-related functions
│   │   │   │   ├── queries.ts
│   │   │   │   ├── mutations.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── organizationLinks/      # Organization link functions
│   │   │   │   ├── queries.ts
│   │   │   │   ├── mutations.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── communications/         # Email and SMS actions
│   │   │   │   ├── email.ts            # Resend email sending
│   │   │   │   ├── sms.ts              # Twilio SMS sending
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── lib/                    # Backend utilities
│   │   │   │   └── auth.ts             # Auth validation functions (requireTreaterAccess, etc)
│   │   │   │
│   │   │   ├── auth.ts                 # Better Auth setup and configuration
│   │   │   ├── auth.config.ts          # Auth environment and secrets config
│   │   │   ├── http.ts                 # HTTP endpoint for webhooks
│   │   │   ├── schema.ts               # Schema entry point (imports all tables)
│   │   │   └── _generated/             # Auto-generated Convex types (git ignored)
│   │   │
│   │   ├── src/                        # TypeScript source (for type exports)
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── auth/                           # Auth client library
│   │   ├── src/
│   │   │   ├── client.ts               # createHwmAuthClient factory
│   │   │   ├── routing.ts              # App routing helpers (getAppUrlForOrgType)
│   │   │   └── index.ts                # Public API exports
│   │   └── package.json
│   │
│   ├── types/                          # Shared TypeScript types
│   │   ├── src/
│   │   └── tsconfig.json
│   │
│   ├── typescript-config/              # Shared tsconfig base
│   │   └── tsconfig.json
│   │
│   └── biome-config/                   # Shared Biome linting config
│       └── biome.json
│
├── .planning/                          # GSD planning documents
│   ├── codebase/                       # Codebase analysis docs
│   │   ├── ARCHITECTURE.md
│   │   ├── STRUCTURE.md
│   │   ├── CONVENTIONS.md
│   │   ├── TESTING.md
│   │   ├── STACK.md
│   │   ├── INTEGRATIONS.md
│   │   └── CONCERNS.md
│   └── intel/                          # Feature and planning intel
│
├── .claude/                            # Claude-specific skills and context
│   └── skills/                         # Example: convex, frontend-design
│
├── pnpm-workspace.yaml                 # pnpm monorepo configuration
├── package.json                        # Root workspace dependencies
├── pnpm-lock.yaml                      # Dependency lock file
├── CLAUDE.md                           # Project instructions for Claude
├── PRD.md                              # Product requirements document
├── tsconfig.json                       # Root TypeScript config
└── biome.json                          # Root Biome config
```

## Directory Purposes

**apps/generator/**
- Purpose: Hospital waste generation facility portal - hospitals log waste, view treatment status, download certificates
- Contains: React components, routes, auth context
- Key files: `src/routes/index.tsx` (login), `src/routes/_dashboard/dashboard.tsx` (main dashboard), `src/routes/certificates/` (certificate views)

**apps/treater/**
- Purpose: Treatment facility portal - manage generators, coordinate collections, process treatments, generate compliance docs
- Contains: React components, routes, organization management UI
- Key files: `src/routes/dashboard.tsx` (main dashboard), `src/routes/organization.$organizationView.tsx` (org settings)

**apps/trucking/**
- Purpose: Hauler/driver portal - view collection requests, update delivery status, mark waste as collected
- Contains: React components for collection and delivery management
- Key files: `src/routes/_dashboard/dashboard.tsx` (collection queue and delivery tracking)

**packages/convex/convex/**
- Purpose: All backend business logic - queries, mutations, schema, authentication
- Contains: Schema definitions, CRUD operations, auth validation, email/SMS actions
- Key files: `schema/index.ts` (schema entry point), `schema/wasteBags.ts` (core waste model), `auth.ts` (Better Auth setup), `generators/queries.ts`, `generators/mutations.ts`

**packages/auth/src/**
- Purpose: Centralized auth client factory and routing helpers - used by all three frontends
- Contains: Better Auth client configuration, URL routing logic for multi-app redirects
- Key files: `client.ts` (factory for creating app-specific auth clients), `routing.ts` (app URL determination)

**packages/types/src/**
- Purpose: Shared TypeScript type definitions used across backend and frontends
- Contains: Common type definitions, interfaces
- Currently minimal; can grow as types are extracted

## Key File Locations

**Entry Points:**

- `apps/generator/src/routes/__root.tsx`: Root layout for generator app; sets up Convex, auth providers
- `apps/treater/src/routes/__root.tsx`: Root layout for treater app
- `apps/trucking/src/routes/__root.tsx`: Root layout for trucking app
- `packages/convex/convex/schema.ts`: Backend schema definition; combined schema for all tables

**Configuration:**

- `packages/convex/convex/auth.ts`: Better Auth instance setup, rate limiting, email/password config
- `packages/convex/convex/auth.config.ts`: Auth environment variables and secrets
- `packages/auth/src/client.ts`: Auth client configuration per app
- `apps/*/vite.config.ts`: Vite build config (same for all apps; see `apps/generator/vite.config.ts`)
- Root `tsconfig.json`: TypeScript configuration for entire monorepo

**Core Logic:**

- `packages/convex/convex/schema/` (all `*.ts` files): Data model - wasteBags, generators, treaters, etc.
- `packages/convex/convex/generators/queries.ts`: Query operations for generators (getByTreater, getById)
- `packages/convex/convex/generators/mutations.ts`: Mutations for creating/updating generators
- `packages/convex/convex/lib/auth.ts`: Authorization helper functions (requireTreaterAccess, requireGeneratorAccess)
- `packages/convex/convex/communications/email.ts`: Email sending via Resend
- `packages/convex/convex/communications/sms.ts`: SMS sending via Twilio

**Shared Code:**

- `apps/*/src/contexts/auth-context.tsx`: React context for auth state (login/logout, user info)
- `apps/*/src/lib/auth.ts`: Frontend auth client initialization
- `apps/*/src/lib/utils.ts`: Utility functions (formatters, helpers)
- `packages/auth/src/routing.ts`: Multi-app routing helpers

**Testing:**

- No dedicated test directory structure yet (testing patterns to be established in TESTING.md)

## Naming Conventions

**Files:**

- **Route files:** TanStack Router file-based naming:
  - `index.tsx` → `/` route
  - `__root.tsx` → root layout
  - `dashboard.tsx` → `/dashboard` route
  - `auth.$authView.tsx` → `/auth/:authView` parameterized route
  - `_dashboard` → layout group (groups routes without affecting path)
  - `_dashboard/dashboard.tsx` → file inside layout group

- **Component files:** PascalCase (e.g., `DashboardCard.tsx`, `GeneratorForm.tsx`)
  - UI components: `apps/*/src/components/ui/` (shadcn components: `button.tsx`, `input.tsx`)
  - Feature components: `apps/*/src/components/dashboard/` (feature-specific: `WasteTable.tsx`)

- **Function files:** camelCase in Convex backend:
  - `queries.ts`: Read operations for an entity
  - `mutations.ts`: Write operations for an entity
  - `actions.ts`: Async side effects (not yet used; would contain email/SMS/external calls)

- **Schema files:** Snake case or camelCase in table names:
  - `wasteBags.ts` → table named `wasteBags`
  - `treaterHaulerPartners.ts` → table named `treaterHaulerPartners`

**Directories:**

- **Feature directories (Convex):** Plural noun + entity:
  - `generators/` → all generator queries/mutations
  - `haulers/` → all hauler queries/mutations
  - `organizationLinks/` → org link operations

- **Component directories:** Feature name (plural):
  - `components/dashboard/` → dashboard components
  - `components/layout/` → layout components
  - `components/ui/` → UI library components

- **Utilities:** Specific purpose:
  - `lib/` → general utilities
  - `contexts/` → React context providers

**Variables & Functions:**

- **Functions:** camelCase: `requireTreaterAccess()`, `getByTreater()`, `handleSubmit()`
- **Variables:** camelCase: `treaterId`, `isLoading`, `generatorList`
- **React hooks:** camelCase starting with `use`: `useAuth()`, `useQuery()`, `useMutation()`
- **Constants:** UPPER_SNAKE_CASE: `VITE_CONVEX_URL`, `MAX_FILE_SIZE`
- **Types/Interfaces:** PascalCase: `OrganizationType`, `UserRole`, `WasteBagStatus`

## Where to Add New Code

**New Feature (e.g., adding waste treatment tracking):**

1. **Backend schema:** Add table definition in `packages/convex/convex/schema/treatments.ts` (if not exists)
2. **Backend queries:** Add read operations in `packages/convex/convex/treatments/queries.ts`
3. **Backend mutations:** Add write operations in `packages/convex/convex/treatments/mutations.ts`
4. **Backend auth:** Update `packages/convex/convex/lib/auth.ts` if new org access is needed (e.g., `requireTreaterAccessForTreatment`)
5. **Frontend (treater app):**
   - Route: `apps/treater/src/routes/treatments.tsx` or nested under `_dashboard/`
   - Component: `apps/treater/src/components/dashboard/TreatmentTable.tsx`
   - Logic: Use Convex queries/mutations from `@hwm/convex/api`

**New Component/Module:**

- **Frontend component:** Place in `apps/{app}/src/components/{feature}/ComponentName.tsx`
  - UI component: `apps/{app}/src/components/ui/` (if reusable across apps)
  - Layout component: `apps/{app}/src/components/layout/`
  - Feature component: `apps/{app}/src/components/{feature}/`

- **Backend function module:**
  - Queries/mutations: `packages/convex/convex/{entity}/queries.ts` or `mutations.ts`
  - Schema table: `packages/convex/convex/schema/tableName.ts`
  - Barrel export: `packages/convex/convex/{entity}/index.ts` (exports queries and mutations)

**Utilities/Helpers:**

- **Frontend utilities:** `apps/{app}/src/lib/utils.ts` or `apps/{app}/src/lib/{feature}Utils.ts`
- **Shared utilities:** `packages/types/src/utils.ts` (if used by multiple apps)
- **Backend helpers:** `packages/convex/convex/lib/helpers.ts` or specific module

**Schemas & Validators:**

- **New table schema:** Create `packages/convex/convex/schema/tableName.ts`, export in `packages/convex/convex/schema/index.ts`
- **Validators:** Add to `packages/convex/convex/schema/validators.ts` if shared; use inline validators in function args otherwise

## Special Directories

**apps/*/src/routes:**
- Purpose: File-based routing using TanStack Router
- Generated: `routeTree.gen.ts` auto-generated from files in this directory (git ignored)
- Committed: Yes (route files committed; routeTree.gen.ts not committed)

**apps/*/src/components/ui:**
- Purpose: Reusable UI components from shadcn/ui library
- Generated: No (manual copies from shadcn/ui with customizations)
- Committed: Yes (all UI components committed)

**packages/convex/convex/_generated:**
- Purpose: Auto-generated Convex types (convex/server, API types, data model)
- Generated: Yes (by `convex dev` and `convex deploy`)
- Committed: No (git ignored; regenerated on `convex deploy`)

**.planning/codebase:**
- Purpose: GSD codebase analysis documents (this directory)
- Generated: No (manually created by GSD agents)
- Committed: Yes (documents committed to track analysis history)

**.claude/skills:**
- Purpose: Claude-specific context and skill definitions for the project
- Generated: No (manually curated)
- Committed: Yes (helps Claude understand project-specific patterns)

**node_modules, .tanstack/tmp:**
- Purpose: Dependencies and temporary build artifacts
- Generated: Yes
- Committed: No (git ignored)

---

*Structure analysis: 2026-01-21*
