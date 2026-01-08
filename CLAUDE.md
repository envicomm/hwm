# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hospital Waste Management (HWM) - A multi-tenant SaaS platform for tracking hospital waste from generation through treatment and disposal. See `PRD.md` for detailed requirements.

## Commands

```bash
# Development - run all apps + Convex backend concurrently
pnpm dev

# Run individual apps
pnpm --filter @hwm/generator dev    # Port 3001 - Hospital portal
pnpm --filter @hwm/treater dev      # Port 3002 - Treatment facility
pnpm --filter @hwm/trucking dev     # Port 3003 - Hauler/driver portal

# Convex backend
pnpm --filter @hwm/convex dev       # Runs convex dev (syncs schema/functions)
pnpm --filter @hwm/convex deploy    # Deploy to production

# Quality checks
pnpm build                          # Build all apps
pnpm typecheck                      # TypeScript checking
pnpm lint                           # Biome linting
pnpm format                         # Biome formatting (--write)
pnpm check                          # Biome check (lint + format)
```

## Architecture

### Monorepo Structure

```
apps/
├── generator/     # React app for hospitals to log waste
├── treater/       # React app for treatment facilities
├── trucking/      # React app for haulers and drivers
packages/
├── convex/        # Shared backend - schema, queries, mutations, actions
├── typescript-config/
├── biome-config/
```

### Tech Stack

- **Frontend**: React 19, TanStack Router (file-based), TanStack Query, Tailwind CSS 4, shadcn/ui
- **Backend**: Convex (serverless database + functions)
- **Tooling**: pnpm workspaces, Turborepo, Biome, Vite

### Multi-tenancy Model

```
Treater (primary tenant)
├── Generators (hospitals) - invited by treater
├── Haulers (trucking partners) - linked via treaterHaulerPartners
└── Users - role-based: generator | treater | hauler | driver | admin
```

### Waste Lifecycle (wasteBags.wasteStatus)

```
initialized → to_be_collected → collected → treated → aggregated → disposal_requested → disposed
```

### Database Schema (packages/convex/convex/schema/)

Core tables: `treaters`, `generators`, `haulers`, `users`, `wasteBags`, `collectionRequests`, `treatments`, `disposalBatches`

Supporting: `wasteStatusHistory` (audit trail), `bagInventory`, `bagDistributions`, `treatmentCertificates`, `disposalCertificates`

### Routing Convention

TanStack Router with file-based routing. Routes defined in `apps/*/src/routes/`. The router is configured in `apps/*/src/router.tsx`.

### Shared Package Import

Apps import Convex functions via `@hwm/convex`:
```typescript
import { api } from "@hwm/convex/api"
```

## Key Patterns

- **Convex schema**: Tables defined in `packages/convex/convex/schema/*.ts`, combined in `index.ts`
- **Validators**: Shared validation literals in `packages/convex/convex/schema/validators.ts`
- **Communications**: Email (Resend) and SMS (Twilio) actions in `packages/convex/convex/communications/`

## DENR Philippines Compliance Documents

### Auto-generated Documents

1. **Certificate of Treatment (COT)** - Automatically generated when a QR-tagged trashbag is disposed. Treater provides this to the Generator as proof of proper treatment (required by DENR Philippines).

2. **Permit to Transport (PTT)** - Generated for each collected waste. Given to the Generator to authorize waste transport.

3. **HazwasteID** - Future feature (not priority). Will be auto-generated from COT + PTT as the final compliance identifier for DENR reporting.
