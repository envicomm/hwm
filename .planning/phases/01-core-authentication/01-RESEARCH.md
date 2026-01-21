# Phase 1: Core Authentication - Research

**Researched:** 2026-01-21
**Domain:** Authentication and session management with Better Auth + Convex
**Confidence:** HIGH

## Summary

Phase 1 implements core authentication using Better Auth 1.4.9+ with the @convex-dev/better-auth adapter. The project already has significant infrastructure in place: Better Auth server configuration in `packages/convex/convex/auth.ts` with email/password authentication, email verification, password reset flows via Resend, and organization plugin setup. The treater app has @daveyplate/better-auth-ui 3.3.12 installed with an auth route at `/auth/$authView`.

The standard approach uses Better Auth's built-in email/password authentication with Convex as the database adapter, cookie-based session management with optional caching, and the organization plugin for multi-tenancy. Sessions persist across browser refresh via HTTP-only cookies, with automatic token validation on the Convex client.

**Key finding:** The project uses a bridge table pattern (`organizationLinks`) to map Better Auth's generic organizations to domain-specific entities (treaters, generators, haulers). This is already defined in the schema and allows organization-scoped queries without RLS.

**Primary recommendation:** Complete the auth integration by implementing server-side auth helpers (`getAuthenticatedUser`, `getActiveOrganization`), replacing the mock auth context with Better Auth hooks, and wiring the TanStack Start SSR authentication flow per the Convex + Better Auth guide.

## Standard Stack

The established libraries/tools for Better Auth + Convex authentication:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| better-auth | 1.4.9+ | Authentication framework | TypeScript-first, framework-agnostic, comprehensive plugin ecosystem |
| @convex-dev/better-auth | 0.10.9 | Convex adapter | Official integration layer between Better Auth and Convex |
| @daveyplate/better-auth-ui | 3.3.12 | Pre-built auth UI | shadcn/ui styled components, drop-in auth pages |
| Resend | Latest | Transactional email | Modern email API, simple integration, reliable delivery |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| convex | 1.31.3+ | Backend database | Already in use; required for @convex-dev/better-auth |
| TanStack Router | 1.132.0+ | Routing | Already in use; handles SSR auth flow |
| TanStack Query | 5.75.0+ | Data fetching | Already in use; integrates with Convex queries |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Better Auth | Clerk | Clerk is hosted SaaS (easier setup) but requires external provider and higher cost for multi-tenant |
| Better Auth | Auth.js (NextAuth) | Auth.js is more mature but has worse TypeScript support and less flexible plugin system |
| Resend | SendGrid/Mailgun | SendGrid/Mailgun have more features but more complex APIs; Resend is simpler for transactional email |

**Installation:**
```bash
# Already installed in packages/convex and packages/auth
# Verify versions match:
cd packages/convex && pnpm list better-auth @convex-dev/better-auth
cd packages/auth && pnpm list better-auth @convex-dev/better-auth
```

## Architecture Patterns

### Recommended Project Structure
```
packages/
├── convex/convex/
│   ├── auth.ts                 # Better Auth server instance (createAuth)
│   ├── auth.config.ts          # Auth provider config
│   ├── http.ts                 # HTTP routes (auth endpoints)
│   └── helpers/
│       ├── auth.ts             # getAuthenticatedUser, getActiveOrganization
│       └── organization.ts     # Organization context helpers
packages/
├── auth/src/
│   ├── client.ts               # createHwmAuthClient factory
│   └── index.ts                # Re-exports
apps/treater/src/
├── lib/
│   ├── auth-client.ts          # authClient instance
│   └── auth-server.ts          # Server-side helpers (getToken, fetchAuthQuery)
├── routes/
│   ├── __root.tsx              # ConvexBetterAuthProvider, auth loader
│   ├── auth.$authView.tsx      # AuthView component (already exists)
│   └── api/auth/$.ts           # Auth proxy route
```

### Pattern 1: Bridge Table for Multi-Tenancy
**What:** Use `organizationLinks` table to map Better Auth organizations to domain entities
**When to use:** Always - this pattern is foundational to the HWM multi-tenant model
**Example:**
```typescript
// Source: packages/convex/convex/schema/organizationLinks.ts (existing)
export const organizationLinks = defineTable({
  betterAuthOrgId: v.string(),
  organizationType: v.union(
    v.literal("treater"),
    v.literal("generator"),
    v.literal("hauler")
  ),
  treaterId: v.optional(v.id("treaters")),
  generatorId: v.optional(v.id("generators")),
  haulerId: v.optional(v.id("haulers")),
  createdAt: v.number(),
})
  .index("by_better_auth_org", ["betterAuthOrgId"])
  .index("by_treater", ["treaterId"])
  .index("by_generator", ["generatorId"])
  .index("by_hauler", ["haulerId"])
```

### Pattern 2: Auth Helper Functions
**What:** Centralized helpers to get authenticated user and organization context
**When to use:** At the start of every authenticated query/mutation
**Example:**
```typescript
// Source: Convex authorization best practices
// https://stack.convex.dev/authorization

export async function getAuthenticatedUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new Error("Not authenticated")
  }

  // Get Better Auth user via authComponent
  const authUser = await authComponent.getAuthUser(ctx)
  if (!authUser) {
    throw new Error("Auth user not found")
  }

  return authUser
}

export async function getActiveOrganization(ctx: QueryCtx | MutationCtx) {
  const authUser = await getAuthenticatedUser(ctx)
  const session = await authComponent.getAuthSession(ctx)

  if (!session?.activeOrganizationId) {
    throw new Error("No active organization")
  }

  const orgLink = await ctx.db
    .query("organizationLinks")
    .withIndex("by_better_auth_org", (q) =>
      q.eq("betterAuthOrgId", session.activeOrganizationId)
    )
    .first()

  if (!orgLink) {
    throw new Error("Organization link not found")
  }

  return orgLink
}
```

### Pattern 3: TanStack Start SSR Auth Flow
**What:** Server-side token loading and client-side provider setup
**When to use:** Root layout for SSR authentication
**Example:**
```typescript
// Source: https://labs.convex.dev/better-auth/framework-guides/tanstack-start

// In src/lib/auth-server.ts
export const {
  handler,
  getToken,
  fetchAuthQuery,
  fetchAuthMutation,
  fetchAuthAction,
} = convexBetterAuthReactStart({
  convexUrl: process.env.VITE_CONVEX_URL!,
  convexSiteUrl: process.env.VITE_CONVEX_SITE_URL!,
})

// In src/routes/__root.tsx
const getAuth = createServerFn({ method: 'GET' }).handler(
  async () => await getToken()
)

export const Route = createRootRouteWithContext()({
  beforeLoad: async (ctx) => {
    const token = await getAuth()
    if (token) {
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token)
    }
    return { isAuthenticated: !!token, token }
  },
  component: RootComponent,
})

function RootComponent() {
  const context = useRouteContext({ from: Route.id })
  return (
    <ConvexBetterAuthProvider
      client={context.convexQueryClient.convexClient}
      authClient={authClient}
      initialToken={context.token}
    >
      <RootDocument>
        <Outlet />
      </RootDocument>
    </ConvexBetterAuthProvider>
  )
}
```

### Pattern 4: Email Verification and Password Reset
**What:** Use Resend API directly in Better Auth callbacks (already implemented)
**When to use:** Email verification on signup, password reset requests
**Example:**
```typescript
// Source: packages/convex/convex/auth.ts (existing implementation)
emailVerification: {
  sendOnSignUp: true,
  async sendVerificationEmail({ user, url }) {
    // IMPORTANT: Don't await to prevent timing attacks
    // Source: https://www.better-auth.com/docs/concepts/email
    void fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL ?? "noreply@hwm.app",
        to: user.email,
        subject: "Verify your email address - HWM",
        html: emailTemplate,
      }),
    })
  },
}
```

### Anti-Patterns to Avoid

- **Don't use Better Auth's `useSession()` for auth state** - Use Convex's `useConvexAuth()` instead. Better Auth reflects authenticated state before Convex validates the token, causing race conditions.
- **Don't await email sending** - Prevents timing attacks. Use `void` or serverless `waitUntil`.
- **Don't rely on request inference for baseURL** - Always set explicitly via config or `BETTER_AUTH_URL` env var.
- **Don't call authenticated queries before `isAuthenticated: true`** - Wrap in `<Authenticated>` component or check `useConvexAuth().isAuthenticated`.
- **Don't disable CSRF protection** - `disableCSRFCheck` and `disableOriginCheck` should remain false (default).

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session management | Custom JWT/cookie logic | Better Auth sessions | Handles expiration, refresh, revocation, cookie security, CSRF protection |
| Email verification tokens | Random UUID + expiry check | Better Auth `emailVerification` | Secure token generation, timing attack prevention, rate limiting |
| Password reset flow | Custom token generation | Better Auth `sendResetPassword` | Token expiry (3600s), secure validation, email integration |
| Password hashing | bcrypt/custom | Better Auth (scrypt default) | Node.js native scrypt, configurable algorithms, proper salting |
| Rate limiting | Custom request counters | Better Auth `rateLimit` | Per-endpoint rules, window-based limiting, customizable thresholds |
| Multi-tenant context | Custom org middleware | Better Auth organization plugin | Active org tracking, member roles, invitation flow, session storage |
| Auth UI components | Custom forms | @daveyplate/better-auth-ui | Pre-built shadcn/ui components, responsive, form validation, error handling |

**Key insight:** Authentication has numerous security edge cases (timing attacks, token expiry, CSRF, rate limiting). Better Auth handles these correctly out of the box. Custom implementations inevitably miss edge cases.

## Common Pitfalls

### Pitfall 1: Using Better Auth Session State Too Early
**What goes wrong:** Using `authClient.useSession()` or `getSession()` to check authentication state causes queries to fire before Convex validates the token, resulting in "Not authenticated" errors.
**Why it happens:** Better Auth returns session data immediately from cookies, but Convex must validate the token asynchronously. There's a timing gap.
**How to avoid:** Always use Convex's auth state: `useConvexAuth()` hook or `<Authenticated>` component.
**Warning signs:** "Not authenticated" errors on page load, intermittent auth failures on refresh.

### Pitfall 2: Session Cookie Cache Staleness
**What goes wrong:** When `cookieCache` is enabled, revoked sessions remain valid until cache expires (default: maxAge duration).
**Why it happens:** Cookie caching stores session data in signed cookies to reduce database queries. Revocations don't immediately invalidate cached data.
**How to avoid:** For sensitive operations (password change, role change), use shorter `maxAge` (5 minutes) or disable `cookieCache` entirely. For user logout, increment `cookieCache.version` to invalidate all sessions.
**Warning signs:** Users remain logged in after account suspension, session changes not reflected immediately.

### Pitfall 3: Missing Environment Variables
**What goes wrong:** Better Auth silently fails to send emails or generates insecure sessions.
**Why it happens:** Missing `RESEND_API_KEY`, `BETTER_AUTH_SECRET`, or `SITE_URL` causes runtime failures with minimal error messages.
**How to avoid:** Validate environment variables at startup. Better Auth requires `BETTER_AUTH_SECRET` (generate with `openssl rand -base64 32`) and `SITE_URL` for trusted origins.
**Warning signs:** No verification emails sent, CSRF errors, "Invalid origin" errors.

### Pitfall 4: Forgetting to Proxy Auth Routes
**What goes wrong:** Authentication requests fail with 404 or CORS errors.
**Why it happens:** TanStack Start requires a proxy route (`/api/auth/$`) to forward requests to Convex's Better Auth endpoints.
**How to avoid:** Create `src/routes/api/auth/$.ts` with GET/POST handlers calling `handler(request)` from `auth-server.ts`.
**Warning signs:** 404 errors on `/api/auth/sign-in`, CORS errors, "Failed to fetch" on login.

### Pitfall 5: expectAuth: true Requires Page Reload
**What goes wrong:** After logout with `expectAuth: true`, users cannot re-authenticate without a page reload.
**Why it happens:** The `expectAuth: true` setting in `ConvexQueryClient` prevents authenticated queries before initial verification completes. After logout, the client remains in "unauthenticated" mode.
**How to avoid:** Either avoid `expectAuth: true`, or implement a full page reload (`window.location.href = '/auth/sign-in'`) on logout.
**Warning signs:** Login form submits successfully but user remains unauthenticated, requires manual refresh.

### Pitfall 6: Resend Rate Limits
**What goes wrong:** Email verification and password reset emails fail during high signup volume.
**Why it happens:** Resend default rate limit is 2 requests/second. Batch signups or password resets exceed this limit.
**How to avoid:** Implement queuing for batch operations. For critical flows, request higher rate limits from Resend. Monitor response headers for rate limit status.
**Warning signs:** 429 errors in logs, "daily_quota_exceeded" errors, sporadic email delivery failures.

## Code Examples

Verified patterns from official sources:

### Authenticated Query Pattern
```typescript
// Source: https://labs.convex.dev/better-auth/basic-usage/authorization
import { query } from "./_generated/server"
import { getAuthenticatedUser } from "./helpers/auth"

export const myQuery = query({
  args: {},
  handler: async (ctx) => {
    const authUser = await getAuthenticatedUser(ctx)

    // Query scoped to user's organization
    const orgLink = await getActiveOrganization(ctx)
    return await ctx.db
      .query("generators")
      .withIndex("by_treater", (q) => q.eq("treaterId", orgLink.treaterId))
      .collect()
  },
})
```

### Organization Creation on Signup
```typescript
// Source: Better Auth organization plugin patterns
// https://www.better-auth.com/docs/plugins/organization

export const createTreaterAccount = mutation({
  args: {
    userId: v.string(),
    betterAuthOrgId: v.string(),
    treaterName: v.string(),
    // ... other fields
  },
  handler: async (ctx, args) => {
    // Create treater entity
    const treaterId = await ctx.db.insert("treaters", {
      name: args.treaterName,
      // ... other fields
      createdAt: Date.now(),
    })

    // Create organization link
    await ctx.db.insert("organizationLinks", {
      betterAuthOrgId: args.betterAuthOrgId,
      organizationType: "treater",
      treaterId,
      createdAt: Date.now(),
    })

    return { treaterId }
  },
})
```

### SSR Auth Loader
```typescript
// Source: https://labs.convex.dev/better-auth/framework-guides/tanstack-start
import { createFileRoute } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '@hwm/convex'

export const Route = createFileRoute("/dashboard")({
  loader: async ({ context }) => {
    // Pre-fetch authenticated data for SSR
    await context.queryClient.ensureQueryData(
      convexQuery(api.auth.getCurrentUser, {})
    )
  },
  component: DashboardPage,
})
```

### Client Auth Initialization
```typescript
// Source: packages/auth/src/client.ts (existing implementation)
import { createAuthClient } from "better-auth/react"
import { convexClient, crossDomainClient } from "@convex-dev/better-auth/client/plugins"
import { organizationClient, adminClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_CONVEX_SITE_URL,
  plugins: [
    convexClient(),
    crossDomainClient(),
    organizationClient(),
    adminClient(),
  ],
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Auth.js (NextAuth) | Better Auth | Better Auth 1.0 (2024) | Better TypeScript support, plugin architecture, framework-agnostic |
| Manual cookie management | Cookie cache with `jwe` strategy | Better Auth 1.3+ | Stateless sessions option, reduced DB queries |
| Custom organization logic | Organization plugin | Better Auth 1.2+ | Built-in multi-tenancy, roles, invitations |
| Separate adapter packages | @convex-dev/better-auth | Dec 2024 | Official Convex integration, type-safe adapter |
| Hardcoded session expiry | `updateAge` and `freshAge` | Better Auth 1.4+ | Flexible session refresh, fresh session checks |

**Deprecated/outdated:**
- **better-auth < 1.4:** Organization plugin had type inference issues, fixed in 1.4.x
- **Manual session refresh:** Now automatic with `updateAge` configuration
- **Direct database session queries:** Use `authComponent.getAuthSession(ctx)` instead

## Open Questions

Things that couldn't be fully resolved:

1. **Version Mismatch: 1.4.9 vs 1.4.10**
   - What we know: Project uses better-auth 1.4.9 in convex package, 1.4.10 in auth package
   - What's unclear: Specific breaking changes between versions; 1.4.9 had custom roles inference issues
   - Recommendation: Align both packages to 1.4.10 or latest 1.4.x. Check GitHub releases for 1.4.10+ fixes.

2. **Organization Creation Timing**
   - What we know: Better Auth creates organization on signup, but we need to link to domain entity (treater)
   - What's unclear: Should organization creation happen in Better Auth hooks or separate mutation?
   - Recommendation: Use separate mutation after signup to create treater + organizationLink atomically. Better Auth organization is just the auth container.

3. **Active Organization Persistence**
   - What we know: Better Auth session can store `activeOrganizationId`
   - What's unclear: How to set initial active organization on signup, handle users in multiple orgs
   - Recommendation: Create helper mutation to set active organization, store in session. For Phase 1 (treater-only), user has one org by default.

4. **Email Template Styling**
   - What we know: Current implementation uses inline HTML in auth.ts
   - What's unclear: Should email templates move to separate files, use @daveyplate/better-auth-ui EmailTemplate component?
   - Recommendation: Keep inline for Phase 1 (already working). Refactor to template files in later phase if needed for consistency across communications.

## Sources

### Primary (HIGH confidence)
- [Convex + Better Auth Official Guide](https://labs.convex.dev/better-auth) - Installation and setup
- [TanStack Start Integration Guide](https://labs.convex.dev/better-auth/framework-guides/tanstack-start) - SSR auth flow
- [Better Auth Organization Plugin](https://www.better-auth.com/docs/plugins/organization) - Multi-tenant configuration
- [Better Auth Email & Password](https://www.better-auth.com/docs/authentication/email-password) - Email verification, password reset
- [Better Auth Session Management](https://www.better-auth.com/docs/concepts/session-management) - Cookie caching, expiration
- [Convex Authorization Patterns](https://labs.convex.dev/better-auth/basic-usage/authorization) - Auth helpers in queries
- [Better Auth Convex Integration Docs](https://www.better-auth.com/docs/integrations/convex) - Adapter configuration

### Secondary (MEDIUM confidence)
- [Better Auth Security Reference](https://www.better-auth.com/docs/reference/security) - CSRF, rate limiting, baseURL
- [Better Auth UI Documentation](https://better-auth-ui.com/) - AuthView component usage
- [Resend Rate Limits](https://resend.com/docs/api-reference/rate-limit) - Email API limits
- [Convex Authorization Best Practices](https://stack.convex.dev/authorization) - Access control patterns
- [Better Auth Concepts: Email](https://www.better-auth.com/docs/concepts/email) - Timing attack prevention

### Tertiary (LOW confidence)
- GitHub Issues: Custom roles bug in 1.4.9 - Reported by users, not official
- Community patterns: organizationLinks bridge table - Inferred from Convex relationship patterns, not Better Auth specific

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official packages, versions verified in package.json
- Architecture: HIGH - Official docs for TanStack Start + Convex + Better Auth integration
- Pitfalls: MEDIUM - Some based on GitHub issues, timing gap documented in official docs
- Code examples: HIGH - All sourced from official documentation or existing working code

**Research date:** 2026-01-21
**Valid until:** ~2026-02-21 (30 days for stable ecosystem)
**Notes:** Better Auth 1.4.x is stable but actively maintained. Check for patches monthly. @convex-dev/better-auth adapter version should stay in sync with better-auth minor version.
