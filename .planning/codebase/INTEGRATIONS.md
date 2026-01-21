# External Integrations

**Analysis Date:** 2026-01-21

## APIs & External Services

**Email Delivery:**
- **Resend** - Email service for sending transactional emails
  - SDK/Client: Native fetch API (no SDK package, uses REST API directly)
  - Auth: `RESEND_API_KEY` environment variable
  - Base URL: `https://api.resend.com/emails`
  - Integration: `packages/convex/convex/communications/email.ts`
  - Used for password reset emails and user notifications via `sendEmail()` and `sendEmailToUser()` actions

**SMS Delivery:**
- **Twilio** - SMS service for sending text messages
  - SDK/Client: Native fetch API (no SDK package, uses REST API directly)
  - Auth: Basic authentication with `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`
  - Base URL: `https://api.twilio.com/2010-04-01/Accounts/{accountSid}/Messages.json`
  - Environment variables:
    - `TWILIO_ACCOUNT_SID` - Account identifier
    - `TWILIO_AUTH_TOKEN` - Authentication token
    - `TWILIO_PHONE_NUMBER` - Sender phone number (format: +1234567890)
  - Integration: `packages/convex/convex/communications/sms.ts`
  - Used for SMS notifications via `sendSMS()` and `sendSMSToUser()` actions

**Mapping & Geolocation:**
- **Mapbox GL** - Interactive mapping and geolocation service
  - SDK/Client: `mapbox-gl` 3.17.0 (native library), `react-map-gl` 8.1.0 (React wrapper)
  - Auth: `VITE_MAPBOX_ACCESS_TOKEN` environment variable (frontend only)
  - Used in: `apps/generator/`, `apps/trucking/`
  - Features: Route visualization, location marking, spatial queries

## Data Storage

**Databases:**
- **Convex Database** - Primary database
  - Type: Document database (serverless)
  - Provider: Convex cloud platform
  - Connection: `VITE_CONVEX_URL` (frontend) and `CONVEX_DEPLOYMENT` (backend)
  - Client: Convex SDK 1.31.3
  - ORM: None - Convex uses direct query/mutation functions
  - Schema: `packages/convex/convex/schema/` (index.ts imports all schema modules)
  - Tables: treaters, generators, haulers, users, wasteBags, collectionRequests, treatments, disposalBatches, bagInventory, wasteStatusHistory, treatmentCertificates, disposalCertificates, transportPermits, bagDistributions, organizationLinks, treaterHaulerPartners

**File Storage:**
- Not detected - Local filesystem only (no S3, Cloud Storage, or file service integration)

**Caching:**
- **TanStack Query** - In-memory client-side caching
  - Not a separate service, but manages local state
  - Convex integration via `@convex-dev/react-query`

## Authentication & Identity

**Auth Provider:**
- **Better Auth** 1.4.10 - Custom authentication framework
  - Implementation: Self-hosted via Convex
  - SDK: `better-auth` 1.4.10 (core) + `@convex-dev/better-auth` 0.10.9 (Convex integration)
  - Configuration: `packages/convex/convex/auth.config.ts` (uses Convex plugin provider)
  - Features:
    - Email/password authentication with verification required
    - Organization plugin for multi-tenancy
    - Admin plugin for role-based access
    - Cross-domain/CORS support
    - Rate limiting: 10 requests/minute default, stricter on login (5/min), signup (3/5min), password reset (3/5min)
  - Database adapter: Convex tables for storing users, sessions, accounts, verifications
  - CORS trusted origins (environment-dependent):
    - Dev: `http://localhost:3001` (generator), `http://localhost:3002` (treater), `http://localhost:3003` (trucking)
    - Prod: `https://generator.hwm.app`, `https://treater.hwm.app`, `https://trucking.hwm.app`
  - HTTP routes registered via: `packages/convex/convex/http.ts` (Better Auth httpRouter)

## Monitoring & Observability

**Error Tracking:**
- Not detected - No Sentry, LogRocket, or similar service integrated

**Logs:**
- Console logging only - Development uses standard console output
- Production: Browser console and Convex cloud logs

## CI/CD & Deployment

**Hosting:**
- **Convex Cloud** - Backend deployment platform
  - Deployment command: `pnpm --filter @hwm/convex deploy`
  - Dev command: `pnpm --filter @hwm/convex dev`
  - Production URL: `https://polite-lynx-19.convex.cloud` (example in .env.example)

**Frontend Hosting:**
- Not detected in configuration - Apps are built with Vite and ready for deployment to Vercel, Netlify, or static hosting

**CI Pipeline:**
- Not detected - No GitHub Actions, GitLab CI, or other CI service configured

## Environment Configuration

**Required env vars:**

**Frontend (.env.local in each app):**
- `VITE_CONVEX_URL` - Convex deployment endpoint (e.g., `https://polite-lynx-19.convex.cloud`)
- `VITE_MAPBOX_ACCESS_TOKEN` - Mapbox API token (generator and trucking apps only)

**Backend (packages/convex/.env.local):**
- `CONVEX_DEPLOYMENT` - Convex deployment ID
- `CONVEX_URL` - Convex deployment URL
- `RESEND_API_KEY` - Resend email API key
- `RESEND_FROM_EMAIL` - Email sender address (default: `noreply@example.com`)
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_PHONE_NUMBER` - Twilio phone number (SMS sender)
- `SITE_URL` - Base URL for auth redirects (default: `http://localhost:3002`)
- `NODE_ENV` - Environment mode (production/development)

**Secrets location:**
- `.env.local` files (git-ignored, not committed)
- Templates: `.env.example` files in each package/app

## Webhooks & Callbacks

**Incoming:**
- **Better Auth Callbacks:**
  - Auth endpoints registered in `packages/convex/convex/http.ts`
  - Routes: `/auth/*` (handled by Better Auth httpRouter)
  - CORS-protected with whitelisted origins
  - Used for email verification, password reset, session management

**Outgoing:**
- **Email Callbacks (Resend):**
  - Actions: `sendEmail()`, `sendEmailToUser()` in `packages/convex/convex/communications/email.ts`
  - Called from Convex mutations/actions (internal workflow, not external webhooks)
  - HTTP POST to `https://api.resend.com/emails`

- **SMS Callbacks (Twilio):**
  - Actions: `sendSMS()`, `sendSMSToUser()` in `packages/convex/convex/communications/sms.ts`
  - Called from Convex mutations/actions (internal workflow, not external webhooks)
  - HTTP POST to `https://api.twilio.com/2010-04-01/Accounts/{accountSid}/Messages.json`

- **Mapbox Queries:**
  - Frontend-only (browser-side API calls)
  - Mapbox token in `VITE_MAPBOX_ACCESS_TOKEN`
  - No server-side proxying detected

## Data Flow

**Authentication Flow:**
1. User submits credentials via Better Auth UI component (`@daveyplate/better-auth-ui`)
2. Frontend sends HTTP request to `/auth/*` endpoints (Convex HTTP router)
3. Better Auth verifies credentials against Convex database
4. Session created in Convex `sessions` table
5. Token returned to frontend, stored in browser
6. Frontend uses token for subsequent Convex query/mutation calls

**Email Communication Flow:**
1. Convex mutation triggers `sendEmail()` or `sendEmailToUser()` action
2. Action retrieves API key from `RESEND_API_KEY` env var
3. HTTP POST to Resend API with email content
4. Resend delivers email, returns message ID
5. Action returns success/failure to caller

**SMS Communication Flow:**
1. Convex mutation triggers `sendSMS()` or `sendSMSToUser()` action
2. Action retrieves Twilio credentials from env vars
3. HTTP POST to Twilio API with message content
4. Twilio sends SMS, returns SID
5. Action returns success/failure to caller

**Data Query Flow:**
1. Frontend app makes TanStack Query request
2. Query calls Convex API function (imported from `@hwm/convex`)
3. Convex routes to appropriate query/mutation in `packages/convex/convex/`
4. Data fetched/modified in Convex database
5. Result serialized and returned to frontend
6. TanStack Query caches and reactively updates UI

---

*Integration audit: 2026-01-21*
