# Technology Stack

**Analysis Date:** 2026-01-21

## Languages

**Primary:**
- **TypeScript** 5.7.2 - Used across all packages and applications (frontend, backend, shared)
- **JavaScript** (ESM modules) - Runtime environment

**Secondary:**
- **CSS** - Tailwind CSS 4.0.6 for styling

## Runtime

**Environment:**
- **Node.js** - Backend runtime (no specific version pinned, compatible with pnpm 9.15.0)
- **Browser** - React 19 for frontend applications

**Package Manager:**
- **pnpm** 9.15.0 - Workspace monorepo manager
- **Lockfile:** `pnpm-lock.yaml` (14,949 lines, committed to repo)

## Frameworks

**Core Frontend:**
- **React** 19.2.3 - UI library for all three apps
- **React DOM** 19.2.3 - DOM rendering
- **TanStack Router** 1.145.7 - File-based routing with SSR support
  - `@tanstack/react-router` - Router core
  - `@tanstack/react-start` - Full-stack framework integration
  - `@tanstack/router-plugin` - Vite plugin for file-based routing
  - `@tanstack/react-router-ssr-query` - SSR + React Query integration

**Data & State Management:**
- **TanStack Query (React Query)** 5.90.16 - Server state management
  - `@convex-dev/react-query` 0.1.0 - Convex integration adapter

**Backend:**
- **Convex** 1.31.3 - Serverless backend platform with built-in database
  - Located in `packages/convex/`
  - Manages all database, queries, mutations, and actions

**Build & Dev:**
- **Vite** 7.3.1 - Build tool and dev server
  - `@vitejs/plugin-react` 5.0.4 - React Fast Refresh
  - `vite-tsconfig-paths` 6.0.2 - Path alias support
- **Turbo** 2.7.3 - Monorepo task orchestrator
- **Tailwind CSS** 4.0.6 - Utility-first CSS framework
  - `@tailwindcss/vite` 4.1.18 - Vite integration

**Testing:**
- Not detected in dependencies (tests may be configured but not yet implemented)

**Code Quality:**
- **Biome** 2.2.4 - Linter and formatter (unified tool replacing ESLint + Prettier)
  - Configuration: `biome.json` (root) with extends `packages/biome-config/biome.json`

## Key Dependencies

**Critical:**
- **Convex** 1.31.3 - Database and backend infrastructure (no external database required)
- **Better Auth** 1.4.10 - Authentication framework
  - `@convex-dev/better-auth` 0.10.9 - Convex integration for Better Auth
  - Provides multi-tenant auth with email/password, organization, and admin plugins

**UI Components:**
- **shadcn/ui** 3.6.3 - Component collection (installed via CLI, not dependencies)
- **Radix UI** 1.4.3 - Headless component primitives
  - `@radix-ui/react-avatar` 1.1.11 - Avatar component
- **Base UI** 1.0.0 - Alternative UI component library
- **Lucide React** 0.561.0 - Icon library
- **Recharts** 3.6.0 - Charting library
- **class-variance-authority** 0.7.1 - Component variant management
- **clsx** 2.1.1 - Conditional classname utility
- **tailwind-merge** 3.4.0 - Tailwind CSS class merging utility

**Mapping & Geolocation:**
- **Mapbox GL** 3.17.0 - WebGL mapping library
- **react-map-gl** 8.1.0 - React wrapper for Mapbox GL
- **@types/mapbox-gl** 3.4.1 - TypeScript types for Mapbox GL
- **@types/geojson** 7946.0.16 - GeoJSON TypeScript types

**Fonts & Styling:**
- **@fontsource-variable/figtree** 5.2.10 - Variable font family
- **tw-animate-css** 1.4.0 - Tailwind animation utilities
- **@daveyplate/better-auth-ui** 3.3.12 - Pre-built auth UI components

## Configuration

**Environment:**
- Development configuration: `.env.local` files per app
- Examples provided: `.env.example` in each app and `packages/convex/`
- Key variables:
  - `VITE_CONVEX_URL` - Convex deployment URL (frontend apps)
  - `VITE_MAPBOX_ACCESS_TOKEN` - Mapbox API token (generator, trucking apps)
  - `CONVEX_DEPLOYMENT` - Convex deployment ID (backend)
  - `RESEND_API_KEY` - Email service API key (backend)
  - `RESEND_FROM_EMAIL` - Sender email address (backend)
  - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` - SMS service (backend)
  - `SITE_URL` - Base URL for auth callbacks
  - `NODE_ENV` - Environment (production/development)

**Build:**
- **Vite Configs:**
  - `apps/generator/vite.config.ts` - Port 3001, SSR enabled for better-auth
  - `apps/treater/vite.config.ts` - Port 3002, SSR enabled
  - `apps/trucking/vite.config.ts` - Port 3003, SSR enabled
- **TypeScript:**
  - Root `tsconfig.json` via `@hwm/typescript-config` workspace package
  - Each app/package includes `tsconfig.json` extending shared config

**Monorepo:**
- **pnpm-workspace.yaml** - Workspace configuration
- **turbo.json** - Task pipeline definition for build, dev, typecheck, lint
- **Workspace packages:**
  - `packages/convex/` - Backend
  - `packages/auth/` - Shared auth utilities
  - `packages/types/` - Shared TypeScript types
  - `packages/typescript-config/` - Shared TS config
  - `packages/biome-config/` - Shared linting config
  - `apps/generator/` - Hospital portal
  - `apps/treater/` - Treatment facility portal
  - `apps/trucking/` - Hauler/driver portal

## Platform Requirements

**Development:**
- Node.js (version compatible with pnpm 9.15.0, typically 16+)
- pnpm 9.15.0
- Mapbox account for development (if using maps locally)
- Convex account for local development (`convex dev`)

**Production:**
- **Frontend Hosting:** Vite-built static sites (deployable to Vercel, Netlify, etc.)
- **Backend Hosting:** Convex cloud platform (https://convex.cloud)
- **Database:** Convex-managed (no separate database setup required)
- **Domain:** SSL/HTTPS required for production auth

**External Services Required:**
- Convex cloud deployment
- Resend for email delivery
- Twilio for SMS delivery
- Mapbox for maps (generator and trucking apps)

---

*Stack analysis: 2026-01-21*
