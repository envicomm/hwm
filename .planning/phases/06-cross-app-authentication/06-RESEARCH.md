# Phase 6: Cross-App Authentication - Research

**Researched:** 2026-01-22
**Domain:** Multi-app authentication with Better Auth + Convex
**Confidence:** MEDIUM

## Summary

This research covers implementing cross-app authentication across three React applications (generator, treater, trucking) running on different localhost ports during development and different subdomains in production. The system uses Better Auth 1.4.10 with @convex-dev/better-auth 0.10.9, with sessions stored server-side in Convex.

**Key Finding:** The `crossDomain` plugin from @convex-dev/better-auth is already configured on both server and client side. However, localhost development with different ports presents cookie-sharing challenges that require understanding browser behavior and potential workarounds.

**Primary recommendation:** Focus on organization-based routing and switching rather than trying to force cookie sharing across localhost ports. Better Auth's session is already shared server-side in Convex; the challenge is ensuring each app can access and validate that session independently.

## Standard Stack

The authentication stack is already established from Phase 4:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| better-auth | 1.4.10 | Authentication framework | Type-safe, plugin-based, framework-agnostic |
| @convex-dev/better-auth | 0.10.9 | Convex integration | Bridges Better Auth with Convex backend |
| @daveyplate/better-auth-ui | Latest | Auth UI components | Pre-built AuthView and OrganizationSwitcher |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-router | Current | File-based routing | Already used for all three apps |
| @tanstack/react-start | Current | SSR framework | Already configured for all three apps |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Better Auth | NextAuth/Auth.js | Better Auth has superior TypeScript support and plugin system |
| Cookie-based sessions | JWT-only | Cookies provide better security and automatic CSRF protection |
| OIDC Provider plugin | crossDomain plugin | OIDC adds complexity; crossDomain is simpler for same-backend scenario |

**Installation:**
All packages already installed. No additional dependencies needed.

## Architecture Patterns

### Current Authentication Flow (Phase 4)
```
User Request → App (port 300X)
           ↓
    TanStack Router __root.tsx beforeLoad
           ↓
    getToken() from auth-server.ts
           ↓
    setAuth(token) on ConvexQueryClient
           ↓
    ConvexBetterAuthProvider with initialToken
           ↓
    AuthContext provides user/session
```

### Cross-App Session Architecture
```
Better Auth Server (Convex)
    ├── Session Storage (server-side, shared)
    ├── trustedOrigins: [3001, 3002, 3003]
    └── crossDomain plugin enabled
         ↓
Three Apps (Client-side)
├── Generator (3001)
│   ├── crossDomainClient() plugin
│   ├── /api/auth/$ proxy route
│   └── Session validation
├── Treater (3002)
│   ├── crossDomainClient() plugin
│   ├── /api/auth/$ proxy route
│   └── Session validation
└── Trucking (3003)
    ├── crossDomainClient() plugin
    ├── /api/auth/$ proxy route
    └── Session validation
```

### Organization-Based Routing Pattern
```typescript
// Determine user's primary organization type
const orgType = user.activeOrganization?.organizationType ||
                user.organizations[0]?.organizationType

// Route to appropriate app
const targetApp = {
  treater: 'http://localhost:3002',
  generator: 'http://localhost:3001',
  hauler: 'http://localhost:3003'
}[orgType]

// Redirect if in wrong app
if (currentPort !== targetApp.port) {
  window.location.href = `${targetApp}/dashboard`
}
```

### Multi-Organization User Pattern
```typescript
// User with multiple organizations
interface UserWithOrgs {
  user: User;
  activeOrganization: Organization;
  organizations: Organization[]; // May include treater, generator, hauler
}

// Organization Switcher UI
<OrganizationSwitcher
  onSetActive={async (org) => {
    await authClient.organization.setActive({
      organizationId: org.id
    })
    // Redirect to app matching new org type
    const appUrl = getAppUrlForOrgType(org.organizationType)
    if (appUrl !== window.location.origin) {
      window.location.href = `${appUrl}/dashboard`
    }
  }}
/>
```

### Session Validation Pattern
```typescript
// In each app's __root.tsx beforeLoad
const token = await getToken()
if (token) {
  // Token exists - validate it's for correct org type
  const session = await authClient.getSession()
  const userOrgType = session.activeOrganization?.organizationType
  const currentAppType = getCurrentAppOrgType() // based on port/subdomain

  if (userOrgType !== currentAppType) {
    // User is authenticated but in wrong app
    const correctApp = getAppUrlForOrgType(userOrgType)
    throw redirect(correctApp)
  }
}
```

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Organization switcher UI | Custom dropdown | `<OrganizationSwitcher />` from better-auth-ui | Handles edge cases, loading states, permissions |
| Session synchronization | Custom cookie sync logic | crossDomain plugin (already configured) | Handles CSRF, origin validation, secure cookies |
| Cross-app redirects | Manual URL building | `getAppUrlForOrgType()` helper (already exists) | Environment-aware, handles dev/prod |
| Organization type detection | Parse URL manually | `getCurrentAppOrgType()` helper (already exists) | Handles port and subdomain patterns |
| Multi-org session management | Custom state management | Better Auth's `organization.setActive()` | Updates session server-side, broadcasts to all apps |

**Key insight:** Better Auth's organization plugin + crossDomain plugin already solve most cross-app authentication challenges. The main work is routing logic and UI for organization switching, not low-level session management.

## Common Pitfalls

### Pitfall 1: Localhost Cookie Sharing Expectations
**What goes wrong:** Developers expect cookies to automatically work across localhost:3001, localhost:3002, localhost:3003, but browsers treat different ports as separate origins.

**Why it happens:** Cookies are domain-scoped, not port-scoped. However, same-origin policy treats different ports as different origins for security features. Some browsers (especially Firefox) partition cookies by port on localhost.

**How to avoid:**
- Don't rely on cookies magically working across ports
- Test that each app can independently validate sessions via the auth-server.ts proxy
- Consider using /etc/hosts aliases (app1.local, app2.local, app3.local) for true cross-domain testing

**Warning signs:**
- Session works in one app but not others after sign-in
- User must sign in separately for each app during development

**Source:** [Cross sub domain session sharing - Better Auth](https://www.answeroverflow.com/m/1377654953614508192), [Sharing cookies with JWTs across different domains and ports](https://jaygould.co.uk/2021-08-20-sharing-cookies-jwt-between-different-domains/)

### Pitfall 2: Circular Redirect Loops
**What goes wrong:** User gets redirected from app A → app B → app A → app B infinitely.

**Why it happens:** Each app's beforeLoad checks organization type and redirects, but the organization's linkedEntityId might not match the expected app, or the user has multiple organizations and the "active" one keeps changing.

**How to avoid:**
- Add redirect history tracking (max 2 redirects)
- Use query params to signal "already redirected"
- Ensure organization.setActive() completes before redirecting
- Allow users to manually choose app (don't force auto-redirect on every page load)

**Warning signs:**
- Browser shows "too many redirects" error
- User can't access any app
- Network tab shows repeated 302s between apps

### Pitfall 3: Session Cookie Name Conflicts
**What goes wrong:** All three apps try to set cookies with the same name, causing session conflicts on localhost.

**Why it happens:** Better Auth uses default cookie names. When all apps run on localhost (same domain), browsers can't distinguish which cookie belongs to which app.

**How to avoid:**
- Verify Better Auth's cookie configuration in auth.ts
- Check if cookies are properly scoped by path or domain
- Consider using different cookie names per app in development (though this goes against the "shared session" goal)
- Test that cookies include proper `Path` and `Domain` attributes

**Warning signs:**
- Sign in to app A, then app B signs you out of app A
- Session cookies keep getting overwritten
- DevTools shows duplicate session cookies with different values

**Source:** [Same cookie being set for two apps running in different ports](https://github.com/vercel/next.js/discussions/64097), [connect.session: can't have multiple sessions on localhost](https://github.com/senchalabs/connect/issues/765)

### Pitfall 4: Organization Type Mismatch After Invitation
**What goes wrong:** User accepts invitation to a generator organization while signed into the treater app, creating confusion about which app they should be in.

**Why it happens:** Invitation acceptance doesn't automatically switch apps or set the new organization as active.

**How to avoid:**
- After invitation acceptance, always call `organization.setActive()` with the new organization ID
- Redirect to the app matching the new organization type
- Show clear messaging: "You've joined [Hospital Name]. Redirecting to Generator app..."

**Warning signs:**
- User accepts invitation but doesn't see new organization
- User is in the wrong app after accepting invitation
- Active organization doesn't update after invitation acceptance

### Pitfall 5: Missing Auth Context on Cross-App Navigation
**What goes wrong:** User clicks a link from app A to app B, but app B doesn't recognize the authenticated session immediately.

**Why it happens:** Each app's ConvexBetterAuthProvider initializes independently. If the session cookie isn't readable or the token isn't validated on app B's first load, the user appears unauthenticated.

**How to avoid:**
- Ensure all three apps have identical auth-server.ts configuration
- Verify trustedOrigins in auth.ts includes all three localhost ports
- Test that getToken() works in each app's beforeLoad
- Add loading states during session validation

**Warning signs:**
- Flash of "unauthenticated" state when navigating between apps
- User must refresh page to see authenticated state
- Auth context shows null user initially, then populates after a delay

## Code Examples

Verified patterns from existing codebase:

### Server-Side Auth Configuration (Already Configured)
```typescript
// packages/convex/convex/auth.ts
import { crossDomain } from "@convex-dev/better-auth/plugins";

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: siteUrl,
    trustedOrigins: [
      "http://localhost:3001", // generator app
      "http://localhost:3002", // treater app
      "http://localhost:3003", // trucking app
    ],
    plugins: [
      crossDomain({ siteUrl }),
      // ... other plugins
    ],
  });
};
```

### Client-Side Auth Configuration (Already Configured)
```typescript
// packages/auth/src/client.ts
import { crossDomainClient } from "@convex-dev/better-auth/client/plugins";

export function createHwmAuthClient(convexSiteUrl: string) {
  return createAuthClient({
    baseURL: convexSiteUrl,
    plugins: [
      convexClient(),
      crossDomainClient(), // Enables cross-app session access
      organizationClient(),
    ],
  });
}
```

### Setting Active Organization (Existing Pattern)
```typescript
// apps/treater/src/routes/accept-invitation.tsx (line 83)
await authClient.organization.setActive({ organizationId: orgId });
```

### Organization-Based Routing Helper (Already Exists)
```typescript
// packages/auth/src/routing.ts
export function getAppUrlForOrgType(
  orgType: OrganizationType | undefined | null
): string | null {
  if (!orgType) return null;

  const env = getEnvironment();
  const urls = APP_URLS[env];

  return urls[orgType] ?? null;
}

export function getCurrentAppOrgType(): OrganizationType {
  if (typeof window === "undefined") return "generator";

  const hostname = window.location.hostname;
  const port = window.location.port;

  // Development: Check by port
  if (hostname === "localhost") {
    switch (port) {
      case "3001": return "generator";
      case "3002": return "treater";
      case "3003": return "hauler";
      default: return "generator";
    }
  }

  // Production: Check by subdomain
  if (hostname.includes("treater")) return "treater";
  if (hostname.includes("generator")) return "generator";
  if (hostname.includes("trucking")) return "hauler";

  return "generator";
}
```

### Organization Switcher UI Pattern
```typescript
// New component to create
import { OrganizationSwitcher } from "@daveyplate/better-auth-ui";
import { authClient } from "@/lib/auth";
import { getAppUrlForOrgType, getCurrentAppOrgType } from "@hwm/auth";

export function AppOrganizationSwitcher() {
  const handleSetActive = async (org: { id: string; organizationType: string }) => {
    // Set active organization in Better Auth session
    await authClient.organization.setActive({
      organizationId: org.id
    });

    // Check if we need to redirect to different app
    const targetAppUrl = getAppUrlForOrgType(org.organizationType);
    const currentAppType = getCurrentAppOrgType();

    if (org.organizationType !== currentAppType && targetAppUrl) {
      // Redirect to appropriate app
      window.location.href = `${targetAppUrl}/dashboard`;
    }
  };

  return (
    <OrganizationSwitcher
      onSetActive={handleSetActive}
      hidePersonal={true} // HWM is organization-only
    />
  );
}
```

### Auto-Redirect Based on Active Organization
```typescript
// New routing middleware pattern for __root.tsx
export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ context, location }) => {
    const token = await getAuth();

    // Set server auth if token exists
    if (token && context.convexQueryClient?.serverHttpClient) {
      context.convexQueryClient.serverHttpClient.setAuth(token);
    }

    // If authenticated, verify user is in correct app
    if (token) {
      const session = await authClient.getSession();
      const activeOrgType = session?.user?.activeOrganization?.organizationType;
      const currentAppType = getCurrentAppOrgType();

      // Only redirect if there's a mismatch and we're not on auth pages
      if (activeOrgType &&
          activeOrgType !== currentAppType &&
          !location.pathname.startsWith('/auth') &&
          !location.pathname.startsWith('/accept-invitation')) {

        const correctAppUrl = getAppUrlForOrgType(activeOrgType);
        if (correctAppUrl) {
          // Redirect to correct app
          window.location.href = `${correctAppUrl}${location.pathname}`;
        }
      }
    }

    return { isAuthenticated: !!token, token };
  },
  // ... component
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Cookie-based SSO with shared domain | Better Auth crossDomain plugin | Better Auth 1.4+ (2024) | Simplified cross-app auth without complex cookie configuration |
| Manual session synchronization | Server-side session storage | Better Auth + Convex integration | Session automatically shared across apps via Convex database |
| Custom organization switching logic | Better Auth organization plugin | Better Auth organization plugin release | Built-in multi-tenant support with session management |
| OIDC Provider for multi-app auth | crossDomain plugin for same-backend scenario | @convex-dev/better-auth 0.10+ | Simpler setup when all apps use same Convex backend |

**Deprecated/outdated:**
- **Manual JWT passing between apps**: Better Auth's crossDomain plugin handles this automatically
- **localStorage for session sync**: Security risk; use server-side sessions
- **Wildcard cookies on localhost**: Doesn't work reliably across browsers; use auth proxy pattern instead

## Open Questions

Things that couldn't be fully resolved:

1. **Localhost Cookie Behavior Across All Browsers**
   - What we know: Cookies can be shared across localhost ports in some browsers (Chrome) but not others (Firefox partitions by port)
   - What's unclear: Whether Better Auth's crossDomain plugin fully compensates for this, or if development testing will reveal gaps
   - Recommendation: Test on both Chrome and Firefox during implementation; be prepared to use /etc/hosts aliases if needed

2. **Session Refresh on Organization Switch**
   - What we know: `organization.setActive()` updates the session server-side
   - What's unclear: Whether all three apps automatically pick up the change, or if each app needs to manually refresh its session
   - Recommendation: Test organization switching extensively; may need to add session refresh logic after setActive()

3. **Production Subdomain Cookie Configuration**
   - What we know: Production will use treater.hwm.app, generator.hwm.app, trucking.hwm.app
   - What's unclear: Whether cookies need to be scoped to `.hwm.app` or if Better Auth handles subdomain cookies automatically
   - Recommendation: Review Better Auth's `advanced.crossSubDomainCookies` configuration during deployment planning

4. **Handling Users Without Organizations**
   - What we know: Better Auth allows users to exist without organizations
   - What's unclear: Where to route such users in an organization-only app (HWM requires all users to belong to an organization)
   - Recommendation: Add validation during invitation acceptance to ensure all users have at least one organization; redirect org-less users to a "waiting for invitation" page

5. **Multi-Org Users Default App**
   - What we know: Users can belong to multiple organizations of different types
   - What's unclear: Which app to default to when a user has treater, generator, AND hauler organizations
   - Recommendation: Use activeOrganization as source of truth; if null, use the first organization in user.organizations array

## Sources

### Primary (HIGH confidence)
- [Better Auth Options Documentation](https://www.better-auth.com/docs/reference/options) - baseURL, trustedOrigins configuration
- [Better Auth Security Documentation](https://www.better-auth.com/docs/reference/security) - CSRF protection, cookie security, trusted origins
- [Better Auth Organization Plugin](https://www.better-auth.com/docs/plugins/organization) - organization.setActive(), multi-tenant patterns
- [OrganizationSwitcher UI Component](https://better-auth-ui.com/components/organization-switcher) - Pre-built organization switching UI
- Existing codebase (packages/convex/convex/auth.ts, packages/auth/src/client.ts, packages/auth/src/routing.ts) - Verified current implementation

### Secondary (MEDIUM confidence)
- [Convex + Better Auth Documentation](https://labs.convex.dev/better-auth) - crossDomain plugin integration with Convex
- [React (Vite SPA) Guide](https://labs.convex.dev/better-auth/framework-guides/react) - Client-side setup patterns
- [Multi-tenant SaaS Architecture Guide 2026](https://www.clickittech.com/software-development/multi-tenant-architecture/) - Organization switching UI patterns
- [Better Auth: Structure and Permissions](https://www.premieroctet.com/blog/en/better-auth-structure-and-permissions-with-the-organization-plugin) - Organization plugin best practices

### Tertiary (LOW confidence - requires validation)
- [Cross sub domain session sharing - Better Auth](https://www.answeroverflow.com/m/1377654953614508192) - Community discussion about session sharing challenges
- [Sharing cookies with JWTs across different domains](https://jaygould.co.uk/2021-08-20-sharing-cookies-jwt-between-different-domains/) - General cookie sharing patterns (2021 article, may be outdated)
- [Auth0: Test Applications Locally](https://auth0.com/docs/get-started/applications/work-with-auth0-locally) - General localhost testing practices
- [GitHub Issue: Same cookie being set for two apps](https://github.com/vercel/next.js/discussions/64097) - Community discussion about localhost cookie conflicts

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and configured from Phase 4
- Architecture: MEDIUM - Patterns are well-defined, but localhost testing may reveal edge cases
- Pitfalls: MEDIUM - Based on community reports and common patterns, not all tested in this specific setup
- Code examples: HIGH - Extracted from existing working codebase

**Research date:** 2026-01-22
**Valid until:** 30 days (Better Auth is stable; localhost development patterns are well-established)

**Key uncertainties requiring validation during implementation:**
1. Actual cookie behavior across localhost ports in development
2. Session refresh timing after organization.setActive()
3. Production subdomain cookie configuration needs
4. Optimal UX for multi-organization users

**Research notes:**
- The `crossDomain` plugin from @convex-dev/better-auth is already configured correctly on both server and client
- The main implementation work is routing logic and organization switcher UI, not low-level session management
- Localhost development may require workarounds (e.g., /etc/hosts) if cookie sharing doesn't work reliably
- Production deployment on subdomains (treater.hwm.app, generator.hwm.app, trucking.hwm.app) should work more reliably than localhost
