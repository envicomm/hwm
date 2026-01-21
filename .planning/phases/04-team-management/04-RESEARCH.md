# Phase 4: Team Management - Research

**Researched:** 2026-01-22
**Domain:** Better Auth organization invitations, member management, and multi-app authentication
**Confidence:** HIGH

## Summary

Phase 4 implements team management allowing organization owners/admins to invite team members, assign roles, and manage teams. The codebase has solid foundation: Better Auth organization plugin with `sendInvitationEmail` callback already configured in `packages/convex/convex/auth.ts`, the bridge table pattern established, and auth clients in all three apps. The key work is implementing invitation creation mutations, acceptance flow for new users, member listing/management UI, and enabling auth in generator and trucking apps.

The standard approach uses Better Auth's organization plugin for invitation management (`auth.api.createInvitation`, `acceptInvitation`) combined with the existing `sendInvitationEmail` callback for email delivery via Resend. The critical challenge is handling new users who don't have accounts yet - Better Auth's `acceptInvitation` requires an authenticated user, so the flow must: (1) create invitation, (2) email user with signup link that includes invitation ID, (3) new user signs up, (4) after authentication completes, accept the invitation.

**Primary recommendation:** Implement invitation flow using Better Auth's `auth.api.createInvitation` from Convex mutations. For new users, create a custom signup page that captures the invitation token from URL, completes signup, and automatically accepts the invitation post-authentication. Use the existing `@daveyplate/better-auth-ui` AuthView component with custom redirect handling. Enable SSR auth in generator and trucking apps by copying the treater app's auth-server pattern.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| better-auth | ^1.4.10 | Organization invitations & members | Built-in invitation workflow, member roles, accept/reject APIs |
| @convex-dev/better-auth | 0.10.9 | Convex adapter | `authComponent.getAuth()` pattern for calling Better Auth API from mutations |
| @daveyplate/better-auth-ui | 3.3.12+ | Auth UI components | AuthView, AcceptInvitationCard, OrganizationMembersCard pre-built |
| Resend | API | Email delivery | Already configured in auth.ts sendInvitationEmail callback |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-router | latest | File-based routing | Accept invitation page, member management routes |
| @tanstack/react-query | latest | Data fetching | Member list queries, invitation status |
| lucide-react | latest | Icons | Member status, role badges |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Better Auth createInvitation | Custom invitation table | Better Auth handles expiration, token security, membership creation automatically |
| AcceptInvitationCard | Custom acceptance UI | Pre-built handles edge cases (expired, already accepted, auth redirect) |
| Resend in callback | Convex action for email | Callback is simpler; action needed only if you need to track email status in Convex |

**Installation:**
```bash
# No new dependencies - all required packages already installed
# Verify better-auth-ui has AcceptInvitationCard
pnpm --filter @hwm/treater list @daveyplate/better-auth-ui
```

## Architecture Patterns

### Recommended Project Structure
```
packages/convex/convex/
├── teams/
│   ├── mutations.ts           # inviteMember, removeMember, updateMemberRole
│   ├── queries.ts             # listMembers, getInvitation, listInvitations
│   └── index.ts               # Barrel export
├── users/
│   ├── mutations.ts           # createDomainUser (on invitation accept)
│   └── queries.ts             # getUserByBetterAuthId

apps/treater/src/
├── routes/
│   ├── accept-invitation.tsx  # Invitation acceptance page
│   ├── dashboard/
│   │   └── team/
│   │       └── index.tsx      # Team member list, invite form
├── components/
│   └── team/
│       ├── member-list.tsx    # Member table with role badges
│       ├── invite-form.tsx    # Email + role invitation form
│       └── member-actions.tsx # Remove, update role dropdowns

apps/generator/src/
├── lib/
│   ├── auth-server.ts         # NEW: SSR auth helpers (copy from treater)
├── routes/
│   ├── __root.tsx             # MODIFY: Add ConvexBetterAuthProvider
│   ├── api/auth/$.ts          # NEW: Auth proxy route
│   └── accept-invitation.tsx  # NEW: Invitation acceptance

apps/trucking/src/
├── lib/
│   ├── auth-server.ts         # NEW: SSR auth helpers (copy from treater)
├── routes/
│   ├── __root.tsx             # MODIFY: Add ConvexBetterAuthProvider
│   ├── api/auth/$.ts          # NEW: Auth proxy route
│   └── accept-invitation.tsx  # NEW: Invitation acceptance
```

### Pattern 1: Invite Team Member Mutation
**What:** Create Better Auth invitation and send email via callback
**When to use:** Treater admin invites generator/hauler admin
**Example:**
```typescript
// Source: Better Auth organization plugin + existing auth.ts pattern
import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { authComponent, createAuth } from "../auth";
import { getBetterAuthOrgFromEntity } from "../organizations/helpers";

export const inviteGeneratorAdmin = mutation({
  args: {
    generatorId: v.id("generators"),
    email: v.string(),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    // 1. Get auth context
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

    // 2. Get Better Auth organization ID for this generator
    const orgLink = await getBetterAuthOrgFromEntity(ctx, "generator", args.generatorId);

    // 3. Create invitation via Better Auth API
    // This triggers sendInvitationEmail callback in auth.ts
    const invitation = await auth.api.createInvitation({
      body: {
        email: args.email,
        role: args.role,
        organizationId: orgLink.betterAuthOrgId,
      },
      headers,
    });

    if (!invitation) {
      throw new ConvexError("Failed to create invitation");
    }

    return {
      invitationId: invitation.id,
      email: args.email,
      role: args.role,
      expiresAt: invitation.expiresAt,
    };
  },
});
```

### Pattern 2: Accept Invitation Flow (New User)
**What:** Combined signup + invitation acceptance for users without accounts
**When to use:** New user clicks invitation link in email
**Example:**
```typescript
// Source: Better Auth community patterns + existing AuthView usage
// apps/generator/src/routes/accept-invitation.tsx

import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthView } from "@daveyplate/better-auth-ui";
import { authClient } from "@/lib/auth";

export const Route = createFileRoute("/accept-invitation")({
  validateSearch: (search) => ({
    token: search.token as string,
  }),
  beforeLoad: async ({ search, context }) => {
    // If already authenticated, try to accept invitation immediately
    if (context.isAuthenticated && search.token) {
      try {
        await authClient.organization.acceptInvitation({
          invitationId: search.token,
        });
        throw redirect({ to: "/dashboard" });
      } catch (e) {
        // Invitation may be invalid/expired, show error page
      }
    }
    return { invitationToken: search.token };
  },
  component: AcceptInvitationPage,
});

function AcceptInvitationPage() {
  const { invitationToken } = Route.useRouteContext();

  // Show signup form with invitation context
  // After signup, redirect back here to accept invitation
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full">
        <h1>Join Your Organization</h1>
        <p>Create an account to accept your invitation</p>
        <AuthView
          pathname="sign-up"
          redirectTo={`/accept-invitation?token=${invitationToken}`}
        />
      </div>
    </div>
  );
}
```

### Pattern 3: Post-Signup Invitation Acceptance
**What:** Automatically accept invitation after new user authenticates
**When to use:** Completing the invitation flow after signup
**Example:**
```typescript
// Source: Better Auth patterns + TanStack Router
// In root route or a dedicated hook

import { useEffect } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { authClient } from "@/lib/auth";
import { useConvexAuth } from "convex/react";

export function useAutoAcceptInvitation() {
  const { isAuthenticated } = useConvexAuth();
  const search = useSearch({ strict: false });
  const navigate = useNavigate();

  useEffect(() => {
    const acceptPendingInvitation = async () => {
      const token = search.token || sessionStorage.getItem("pendingInvitation");
      if (!token || !isAuthenticated) return;

      try {
        await authClient.organization.acceptInvitation({
          invitationId: token,
        });
        sessionStorage.removeItem("pendingInvitation");
        navigate({ to: "/dashboard" });
      } catch (e) {
        console.error("Failed to accept invitation:", e);
      }
    };

    acceptPendingInvitation();
  }, [isAuthenticated, search.token, navigate]);
}
```

### Pattern 4: List Organization Members
**What:** Query Better Auth members for an organization
**When to use:** Team management UI
**Example:**
```typescript
// Source: Better Auth organization plugin client API
// apps/treater/src/components/team/member-list.tsx

import { authClient } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";

export function MemberList({ organizationId }: { organizationId: string }) {
  // Use Better Auth client to list members
  const { data: members, isLoading } = useQuery({
    queryKey: ["org-members", organizationId],
    queryFn: async () => {
      const result = await authClient.organization.listMembers({
        organizationId,
        limit: 100,
        sortBy: "createdAt",
        sortDirection: "desc",
      });
      return result.data?.members ?? [];
    },
  });

  if (isLoading) return <LoadingSkeleton />;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members?.map((member) => (
          <TableRow key={member.id}>
            <TableCell>{member.user.name}</TableCell>
            <TableCell>{member.user.email}</TableCell>
            <TableCell>
              <RoleBadge role={member.role} />
            </TableCell>
            <TableCell>{formatDate(member.createdAt)}</TableCell>
            <TableCell>
              <MemberActions member={member} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### Pattern 5: Update Member Role
**What:** Change a member's role in the organization
**When to use:** Team management role assignment
**Example:**
```typescript
// Source: Better Auth organization plugin
import { authClient } from "@/lib/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      role,
      organizationId,
    }: {
      memberId: string;
      role: "owner" | "admin" | "member";
      organizationId: string;
    }) => {
      return authClient.organization.updateMemberRole({
        memberId,
        role,
        organizationId,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["org-members", variables.organizationId],
      });
    },
  });
}
```

### Pattern 6: Enable Auth in Generator/Trucking Apps
**What:** Add SSR authentication to generator and trucking apps
**When to use:** Apps need full auth support like treater app
**Example:**
```typescript
// apps/generator/src/lib/auth-server.ts
// Copy exactly from treater app
import { convexBetterAuthReactStart } from "@convex-dev/better-auth/react-start";

export const {
  handler,
  getToken,
  fetchAuthQuery,
  fetchAuthMutation,
  fetchAuthAction,
} = convexBetterAuthReactStart({
  convexUrl: process.env.VITE_CONVEX_URL!,
  convexSiteUrl: process.env.VITE_CONVEX_SITE_URL!,
});

// apps/generator/src/routes/api/auth/$.ts
// Auth proxy route
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { handler } from "@/lib/auth-server";

export const APIRoute = createAPIFileRoute("/api/auth/$")({
  GET: async ({ request }) => handler(request),
  POST: async ({ request }) => handler(request),
});

// apps/generator/src/routes/__root.tsx
// Modify to add ConvexBetterAuthProvider (same pattern as treater)
```

### Anti-Patterns to Avoid

- **Don't skip email verification for invitees:** Better Auth can require email verification before invitation acceptance. Enable `requireEmailVerificationOnInvitation` for security-critical flows.
- **Don't create custom invitation tokens:** Better Auth handles token generation, expiration, and validation. Use `auth.api.createInvitation`.
- **Don't call acceptInvitation before user is authenticated:** Better Auth requires a valid session. Always authenticate first, then accept.
- **Don't store invitation state only in URL:** Use sessionStorage to persist invitation token across signup/signin redirects.
- **Don't skip domain user creation after invitation acceptance:** Create a domain user record in the `users` table when a new user joins via invitation.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Invitation tokens | Custom UUID + expiry logic | Better Auth createInvitation | Handles expiration, security, duplicate checking, rate limiting |
| Email sending | Custom email action per invite | sendInvitationEmail callback | Already configured in auth.ts, templates ready, Resend integration |
| Member roles | Custom roles table | Better Auth organization roles | Built-in owner/admin/member with permission hierarchy |
| Invitation UI | Custom forms | @daveyplate/better-auth-ui AcceptInvitationCard | Handles expired, invalid, auth redirect edge cases |
| Member list | Custom query to Better Auth tables | authClient.organization.listMembers | Pagination, sorting, filtering built-in |
| SSR auth | Custom cookie parsing | convexBetterAuthReactStart | Token extraction, server-side validation, client hydration |

**Key insight:** Better Auth organization plugin provides complete invitation lifecycle. The work is wiring it to HWM's domain model (creating domain users, linking to organizations) not reimplementing invitation mechanics.

## Common Pitfalls

### Pitfall 1: Invitation Email URL Points to Wrong App
**What goes wrong:** Generator admin invitation email links to treater app (port 3002) instead of generator app (port 3001)
**Why it happens:** `sendInvitationEmail` uses `siteUrl` which defaults to treater app
**How to avoid:**
- Store organization type in invitation metadata
- Build invitation URL based on org type:
  - treater: https://treater.hwm.app or localhost:3002
  - generator: https://generator.hwm.app or localhost:3001
  - hauler: https://trucking.hwm.app or localhost:3003
**Warning signs:** Users click invitation link and land on wrong app, unable to log in

### Pitfall 2: acceptInvitation Called Before Authentication
**What goes wrong:** "UNAUTHORIZED" error when accepting invitation
**Why it happens:** User clicks accept before completing signup/signin
**How to avoid:**
- Store invitation token in sessionStorage before redirecting to signup
- After authentication completes, retrieve token and accept
- Use `useConvexAuth().isAuthenticated` to gate acceptance
**Warning signs:** 401 errors after clicking accept button

### Pitfall 3: Missing Domain User Record
**What goes wrong:** User can authenticate but queries fail because no domain user exists
**Why it happens:** Better Auth creates auth user, but domain `users` table record not created
**How to avoid:**
- After invitation acceptance, create domain user record:
  ```typescript
  await ctx.db.insert("users", {
    name: authUser.name,
    email: authUser.email,
    betterAuthUserId: authUser.id,
    role: "generator", // based on org type
    generatorId: orgLink.generatorId,
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  ```
**Warning signs:** "User not found" errors after successful invitation acceptance

### Pitfall 4: Duplicate Invitations
**What goes wrong:** Same email invited multiple times, user receives multiple emails
**Why it happens:** No check for existing pending invitation
**How to avoid:**
- Set `cancelPendingInvitationsOnReInvite: true` in organization plugin config, OR
- Check for pending invitation before creating new one
- Use `resend: true` parameter to resend existing invitation
**Warning signs:** User confused by multiple invitation emails with different tokens

### Pitfall 5: Invitation Expiration Not Communicated
**What goes wrong:** User clicks expired invitation link, gets cryptic error
**Why it happens:** Default expiration is 48 hours, no UI feedback
**How to avoid:**
- Display expiration date in invitation email
- Show clear "invitation expired" message in AcceptInvitationCard
- Provide "request new invitation" option
**Warning signs:** User reports "invitation doesn't work" after delay

### Pitfall 6: Cross-Origin Auth Issues in Multi-App Setup
**What goes wrong:** Auth session not recognized in generator/trucking apps
**Why it happens:** Cross-domain cookies require explicit configuration
**How to avoid:**
- Ensure crossDomain plugin is configured (already is in auth.ts)
- All apps must use same Convex deployment (VITE_CONVEX_SITE_URL)
- trustedOrigins includes all app URLs (already configured)
**Warning signs:** User logs in on treater, shows unauthenticated on generator

## Code Examples

Verified patterns from official sources and existing codebase:

### Existing sendInvitationEmail Callback (in auth.ts)
```typescript
// Source: packages/convex/convex/auth.ts (lines 194-262)
organization({
  async sendInvitationEmail(data) {
    const { email, organization: org, inviter } = data;

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY is not configured");
      return;
    }

    const orgMeta = org.metadata as { organizationType?: string } | undefined;
    const orgType = orgMeta?.organizationType || "organization";
    const orgTypeName = orgType === "treater" ? "Treatment Facility"
      : orgType === "generator" ? "Hospital"
      : "Trucking Partner";

    const inviterName = inviter.user.name || inviter.user.email;
    const invitationUrl = `${siteUrl}/accept-invitation?token=${data.id}`;

    // ... HTML template and Resend API call
  },
})
```

### Better Auth Organization Member Types
```typescript
// Source: Better Auth organization plugin types
interface OrganizationMember {
  id: string;
  userId: string;
  organizationId: string;
  role: string; // "owner" | "admin" | "member" or comma-separated for multiple
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

interface Invitation {
  id: string;
  email: string;
  organizationId: string;
  role: string;
  status: "pending" | "accepted" | "rejected" | "canceled";
  inviterId: string;
  createdAt: Date;
  expiresAt: Date;
}
```

### Client-Side Invitation Methods
```typescript
// Source: Better Auth organization plugin client API
// https://www.better-auth.com/docs/plugins/organization

// Send invitation
await authClient.organization.inviteMember({
  email: "user@example.com",
  role: "admin",
  organizationId: "org_123", // optional, uses active org if not provided
  resend: false, // set true to resend existing invitation
});

// Accept invitation (user must be authenticated)
await authClient.organization.acceptInvitation({
  invitationId: "inv_123",
});

// Cancel invitation
await authClient.organization.cancelInvitation({
  invitationId: "inv_123",
});

// List organization's pending invitations
const invitations = await authClient.organization.listInvitations({
  organizationId: "org_123",
});

// Get user's pending invitations
const myInvitations = await authClient.organization.listUserInvitations();
```

### Server-Side createInvitation (from Convex mutation)
```typescript
// Source: Better Auth + Convex integration
// https://labs.convex.dev/better-auth/basic-usage

export const createInvitation = mutation({
  args: {
    email: v.string(),
    role: v.string(),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

    // Server-side method is createInvitation, not inviteMember
    const result = await auth.api.createInvitation({
      body: {
        email: args.email,
        role: args.role,
        organizationId: args.organizationId,
      },
      headers,
    });

    return result;
  },
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual invitation tokens | Better Auth createInvitation | Better Auth 1.2+ | Automatic expiration, secure tokens, status tracking |
| Custom email templates inline | sendInvitationEmail callback | Better Auth organization plugin | Centralized email handling, access to inviter/org context |
| Separate signup then invite | Unified invite-to-signup flow | Better Auth UI 3.3+ | AcceptInvitationCard handles auth redirect |
| Query Better Auth tables directly | authClient.organization.listMembers | Better Auth client plugins | Type-safe, paginated, filtered member queries |

**Current patterns to maintain:**
- `authComponent.getAuth(createAuth, ctx)` pattern for calling Better Auth API from Convex
- Bridge table (`organizationLinks`) for mapping Better Auth orgs to domain entities
- Cross-domain auth via `crossDomain` plugin for multi-app sessions
- `@daveyplate/better-auth-ui` AuthView for consistent auth UI

**Patterns to add:**
- Domain user creation on invitation acceptance
- App-specific invitation URLs based on organization type
- Invitation token persistence across signup flow

## Open Questions

Things that couldn't be fully resolved:

1. **Invitation URL Routing by Organization Type**
   - What we know: Invitation email currently uses single `siteUrl` for all invitations
   - What's unclear: Best way to determine which app URL to use based on org type
   - Recommendation: Modify `sendInvitationEmail` to check `org.metadata.organizationType` and use appropriate app URL. Store app URLs in env vars: `GENERATOR_APP_URL`, `TRUCKING_APP_URL`.

2. **Domain User Creation Timing**
   - What we know: Better Auth creates auth user on signup; domain `users` record needed for HWM queries
   - What's unclear: Should domain user be created on signup or on invitation acceptance?
   - Recommendation: Create domain user on invitation acceptance (not signup) since that's when we know the organization context. Use `afterAcceptInvitation` hook if available, or create in mutation after `auth.api.acceptInvitation`.

3. **Multiple Organization Membership**
   - What we know: Better Auth supports users in multiple organizations
   - What's unclear: How to handle a user invited to multiple generators by same treater
   - Recommendation: For Phase 4, assume one user = one organization. Add organization switcher UI in later phase if needed.

4. **Invitation Resend vs Cancel+New**
   - What we know: Better Auth has `resend: true` option and `cancelInvitation` method
   - What's unclear: Best UX for "invite again" when prior invitation exists
   - Recommendation: Use `resend: true` which handles cancellation automatically if `cancelPendingInvitationsOnReInvite` is set.

## Sources

### Primary (HIGH confidence)
- [Better Auth Organization Plugin](https://www.better-auth.com/docs/plugins/organization) - Invitation API, member management, roles
- [Convex + Better Auth Basic Usage](https://labs.convex.dev/better-auth/basic-usage) - authComponent.getAuth pattern
- [Better Auth UI Organizations](https://better-auth-ui.com/advanced/organizations) - AcceptInvitationCard, OrganizationMembersCard
- Existing codebase: `packages/convex/convex/auth.ts` - sendInvitationEmail callback already implemented

### Secondary (MEDIUM confidence)
- [Better Auth UI AcceptInvitationCard](https://better-auth-ui.com/components/accept-invitation-card) - Component usage, props
- GitHub Issues: #3452 (set active organization), #2336 (acceptInvitation issues) - Known edge cases
- [AnswerOverflow: Invitation + user creation](https://www.answeroverflow.com/m/1427014105348440176) - Community patterns for new user flow

### Tertiary (LOW confidence)
- Community discussions on invite-only registration - Multiple approaches suggested, no official pattern
- GitHub Issue #4223: Invitation workflow feature request - Indicates native support may improve

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All packages already in use, Better Auth organization plugin well-documented
- Architecture patterns: HIGH - Extending existing auth patterns, treater app has working template
- Pitfalls: MEDIUM - Some based on GitHub issues and community reports
- Code examples: HIGH - Pulled from official docs and existing codebase

**Research date:** 2026-01-22
**Valid until:** ~2026-02-22 (30 days - Better Auth stable, patterns established)
**Notes:**
- The sendInvitationEmail callback is already implemented in auth.ts
- Generator and trucking apps have auth clients but need SSR auth (auth-server.ts, api proxy route, ConvexBetterAuthProvider)
- The users table has `betterAuthUserId` field ready for linking
- Invitation flow for new users requires careful sequencing: signup -> authenticate -> accept
