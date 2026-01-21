# Technology Stack for Multi-Tenant Authentication

**Project:** Hospital Waste Management Platform
**Research Focus:** Multi-tenant org management with Better Auth
**Researched:** 2026-01-21
**Confidence:** HIGH

## Executive Summary

Better Auth 1.4.9 organization plugin provides production-ready multi-tenant infrastructure. The existing brownfield setup uses Better Auth with @convex-dev/better-auth adapter (v0.10.9). This research identifies required configurations, schema additions, and patterns for implementing organization management with role-based access control (RBAC) across three organization types: treaters (primary tenants), generators (hospitals), and haulers (trucking partners).

## Existing Validated Stack (DO NOT MODIFY)

| Technology | Version | Status | Notes |
|------------|---------|--------|-------|
| Better Auth | 1.4.9 | INSTALLED | Core auth library |
| @convex-dev/better-auth | 0.10.9 | INSTALLED | Convex adapter + component |
| Convex | 1.31.3 | INSTALLED | Serverless backend |
| React | 19 | INSTALLED | Frontend framework |
| TanStack Router | Latest | INSTALLED | File-based routing |
| Resend | Latest | CONFIGURED | Email for invitations |

**Already configured in `packages/convex/convex/auth.ts`:**
- organization plugin (basic setup)
- admin plugin (for user management)
- crossDomain plugin (multi-app sessions)
- convex plugin (Convex compatibility)
- Email verification with Resend
- Rate limiting
- Invitation email sending

## Required Better Auth Organization Plugin Configuration

### 1. Organization Plugin Configuration (Server)

**Location:** `packages/convex/convex/auth.ts`

**Current configuration:**
```typescript
organization({
  allowUserToCreateOrganization: true,
  organizationLimit: 100,
  async sendInvitationEmail(data) { /* Resend integration */ }
})
```

**Required additions for multi-tenant RBAC:**

```typescript
organization({
  // Existing config
  allowUserToCreateOrganization: true,
  organizationLimit: 100,

  // NEW: Custom role definitions
  ac: hwmAccessControl,
  roles: {
    owner: hwmOwnerRole,
    admin: hwmAdminRole,
    member: hwmMemberRole,
  },

  // NEW: Organization metadata schema
  schema: {
    organization: {
      fields: {
        metadata: {
          // Tracks organization type and linked entity
          organizationType: { type: "string", required: true },
          linkedEntityId: { type: "string", required: true },
        }
      }
    }
  },

  // Invitation config (existing)
  async sendInvitationEmail(data) { /* keep existing */ }
})
```

### 2. Access Control Definition

**New file:** `packages/convex/convex/lib/accessControl.ts`

```typescript
import { createAccessControl } from "better-auth/plugins/access";

// Define resources and actions specific to HWM domain
export const hwmStatement = {
  // Generator (hospital) resources
  wasteBag: ["create", "read", "update", "delete"],
  collectionRequest: ["create", "read", "update", "delete"],

  // Treater resources
  treatment: ["create", "read", "update", "delete"],
  disposalBatch: ["create", "read", "update", "delete"],
  bagDistribution: ["create", "read", "update", "delete"],

  // Hauler resources
  pickupRoute: ["create", "read", "update", "delete"],

  // Organization management
  organization: ["read", "update", "delete", "invite"],
  member: ["read", "update", "remove"],
} as const;

export const hwmAccessControl = createAccessControl(hwmStatement);

// Define roles with specific permissions
export const hwmOwnerRole = hwmAccessControl.newRole({
  wasteBag: ["create", "read", "update", "delete"],
  collectionRequest: ["create", "read", "update", "delete"],
  treatment: ["create", "read", "update", "delete"],
  disposalBatch: ["create", "read", "update", "delete"],
  bagDistribution: ["create", "read", "update", "delete"],
  pickupRoute: ["create", "read", "update", "delete"],
  organization: ["read", "update", "delete", "invite"],
  member: ["read", "update", "remove"],
});

export const hwmAdminRole = hwmAccessControl.newRole({
  wasteBag: ["create", "read", "update", "delete"],
  collectionRequest: ["create", "read", "update", "delete"],
  treatment: ["create", "read", "update", "delete"],
  disposalBatch: ["create", "read", "update", "delete"],
  bagDistribution: ["create", "read", "update"],
  pickupRoute: ["create", "read", "update", "delete"],
  organization: ["read", "invite"],
  member: ["read"],
});

export const hwmMemberRole = hwmAccessControl.newRole({
  wasteBag: ["create", "read"],
  collectionRequest: ["create", "read"],
  treatment: ["read"],
  disposalBatch: ["read"],
  bagDistribution: ["read"],
  pickupRoute: ["read"],
  organization: ["read"],
  member: ["read"],
});
```

**Why this structure:**
- Separates domain resources (wasteBag, treatment) from org management (organization, member)
- Owner has full control
- Admin can operate but not delete org or remove members
- Member has read-only + create for their domain work

### 3. Client Plugin Configuration

**Location:** `packages/auth/src/client.ts`

**Current configuration:**
```typescript
plugins: [
  convexClient(),
  crossDomainClient(),
  organizationClient(),  // Basic client
  adminClient(),
]
```

**Required additions:**

```typescript
import { hwmAccessControl, hwmOwnerRole, hwmAdminRole, hwmMemberRole } from "@hwm/convex/lib/accessControl";

plugins: [
  convexClient(),
  crossDomainClient(),

  // NEW: Organization client with access control
  organizationClient({
    ac: hwmAccessControl,
    roles: {
      owner: hwmOwnerRole,
      admin: hwmAdminRole,
      member: hwmMemberRole,
    }
  }),

  adminClient(),
]
```

## Better Auth Organization Plugin Schema

**Source:** Better Auth automatically creates these tables via @convex-dev/better-auth component

### Tables Created by Organization Plugin

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `organization` | Organization records | id, name, slug, logo, metadata, createdAt |
| `member` | Organization membership | id, organizationId, userId, role, createdAt |
| `invitation` | Pending invitations | id, email, organizationId, inviterId, role, status, expiresAt |
| `session` (enhanced) | Active org tracking | activeOrganizationId (added) |

**Metadata field structure:**
```typescript
{
  organizationType: "treater" | "generator" | "hauler",
  linkedEntityId: string  // ID of treaters/generators/haulers record
}
```

### Existing HWM Domain Tables (Keep Unchanged)

| Table | Purpose | Notes |
|-------|---------|-------|
| `treaters` | Treatment facility entities | Primary tenant type |
| `generators` | Hospital entities | Belongs to treater |
| `haulers` | Trucking company entities | Linked via partnerships |
| `organizationLinks` | Maps Better Auth org to HWM entities | Bridge table |
| `users` | Legacy user table | Will be deprecated in favor of Better Auth's user table |

## Integration Pattern: Better Auth Orgs + HWM Domain Entities

### The Bridge Strategy

Better Auth manages authentication and organization membership. HWM domain tables (treaters, generators, haulers) store business logic. `organizationLinks` connects them.

**Flow:**
1. User signs up → Better Auth creates `user` record
2. User creates organization → Better Auth creates `organization` record with metadata
3. Mutation creates domain entity (treater/generator/hauler) → Stores Better Auth org ID in `organizationLinks`
4. All subsequent queries check membership via Better Auth, scope data via domain entity ID

### Example: Creating a Treater Organization

```typescript
// In Convex mutation
export const createTreaterOrganization = mutation({
  args: {
    name: v.string(),
    address: v.string(),
    contactEmail: v.string(),
    contactPhone: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Require authentication
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");

    // 2. Create Better Auth organization via auth API
    // NOTE: This must be done via Better Auth's organization API
    // const betterAuthOrg = await authComponent.createOrganization(ctx, {
    //   name: args.name,
    //   metadata: { organizationType: "treater" }
    // });

    // 3. Create domain entity
    const treaterId = await ctx.db.insert("treaters", {
      name: args.name,
      address: args.address,
      contactEmail: args.contactEmail,
      contactPhone: args.contactPhone,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 4. Create link
    await ctx.db.insert("organizationLinks", {
      betterAuthOrgId: betterAuthOrg.id,
      organizationType: "treater",
      treaterId: treaterId,
      createdAt: Date.now(),
    });

    return { treaterId, organizationId: betterAuthOrg.id };
  }
});
```

## Authorization Patterns for Multi-Tenant Scoping

### Pattern 1: Membership Verification Helper

**New file:** `packages/convex/convex/lib/orgAuth.ts`

```typescript
import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { authComponent } from "../auth";
import type { Id } from "../_generated/dataModel";

/**
 * Verify user is a member of the specified organization
 * Returns the member record with role
 */
export async function requireOrgMembership(
  ctx: QueryCtx | MutationCtx,
  organizationId: string
) {
  const user = await authComponent.getAuthUser(ctx);
  if (!user) {
    throw new ConvexError("Not authenticated");
  }

  // Query Better Auth member table
  const member = await ctx.db
    .query("member")
    .withIndex("by_organization_user", (q) =>
      q.eq("organizationId", organizationId).eq("userId", user.id)
    )
    .first();

  if (!member) {
    throw new ConvexError("Not a member of this organization");
  }

  return { user, member };
}

/**
 * Require user to have specific role in organization
 */
export async function requireOrgRole(
  ctx: QueryCtx | MutationCtx,
  organizationId: string,
  allowedRoles: string[]
) {
  const { user, member } = await requireOrgMembership(ctx, organizationId);

  if (!allowedRoles.includes(member.role)) {
    throw new ConvexError(`Requires one of: ${allowedRoles.join(", ")}`);
  }

  return { user, member };
}

/**
 * Get organization link for a Better Auth organization
 */
export async function getOrgLink(
  ctx: QueryCtx | MutationCtx,
  betterAuthOrgId: string
) {
  const link = await ctx.db
    .query("organizationLinks")
    .withIndex("by_better_auth_org", (q) => q.eq("betterAuthOrgId", betterAuthOrgId))
    .first();

  if (!link) {
    throw new ConvexError("Organization link not found");
  }

  return link;
}
```

### Pattern 2: Scoped Query Pattern

**Example: Get waste bags for a generator, scoped to org membership**

```typescript
export const getGeneratorWasteBags = query({
  args: {
    generatorId: v.id("generators"),
    betterAuthOrgId: v.string()
  },
  handler: async (ctx, args) => {
    // 1. Verify membership
    await requireOrgMembership(ctx, args.betterAuthOrgId);

    // 2. Get org link
    const orgLink = await getOrgLink(ctx, args.betterAuthOrgId);

    // 3. Verify the generator belongs to this organization
    if (orgLink.generatorId !== args.generatorId) {
      throw new ConvexError("Generator does not belong to this organization");
    }

    // 4. Return scoped data
    return await ctx.db
      .query("wasteBags")
      .withIndex("by_generator", (q) => q.eq("generatorId", args.generatorId))
      .collect();
  }
});
```

### Pattern 3: Cross-Organization Access (Treater sees Generators)

**Example: Treater views all linked generators**

```typescript
export const getTreaterGenerators = query({
  args: {
    treaterId: v.id("treaters"),
    betterAuthOrgId: v.string()
  },
  handler: async (ctx, args) => {
    // 1. Verify user is member of treater org
    await requireOrgMembership(ctx, args.betterAuthOrgId);

    // 2. Verify the treater org is linked to this treater entity
    const orgLink = await getOrgLink(ctx, args.betterAuthOrgId);
    if (orgLink.treaterId !== args.treaterId) {
      throw new ConvexError("Not authorized for this treater");
    }

    // 3. Get all generators for this treater
    const generators = await ctx.db
      .query("generators")
      .withIndex("by_treater", (q) => q.eq("treaterId", args.treaterId))
      .collect();

    // 4. For each generator, get its Better Auth org
    const generatorsWithOrgs = await Promise.all(
      generators.map(async (gen) => {
        const genOrgLink = await ctx.db
          .query("organizationLinks")
          .withIndex("by_generator", (q) => q.eq("generatorId", gen._id))
          .first();

        return {
          ...gen,
          betterAuthOrgId: genOrgLink?.betterAuthOrgId,
        };
      })
    );

    return generatorsWithOrgs;
  }
});
```

## Active Organization Context (Session-Based)

Better Auth's organization plugin adds `activeOrganizationId` to the session table. This enables:

1. **Multi-org users:** A user can be member of treater + generator + hauler orgs
2. **Session context:** Track which org the user is currently acting as
3. **Multi-tab support:** Different tabs can have different active orgs

**Client-side usage:**

```typescript
import { authClient } from "@/lib/auth";

// Set active organization
await authClient.organization.setActive({
  organizationId: "org_123"
});

// Get active organization
const activeOrg = await authClient.organization.getActive();
```

**Server-side pattern:**

```typescript
export const getActiveOrgContext = query({
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) return null;

    // Get active organization from session
    const session = await ctx.db
      .query("session")
      .withIndex("by_user", (q) => q.eq("userId", user.id))
      .first();

    if (!session?.activeOrganizationId) {
      return null;
    }

    // Get organization details
    const org = await ctx.db.get(session.activeOrganizationId);
    const orgLink = await getOrgLink(ctx, session.activeOrganizationId);

    return {
      organization: org,
      organizationType: orgLink.organizationType,
      linkedEntityId: orgLink.treaterId || orgLink.generatorId || orgLink.haulerId,
    };
  }
});
```

## Migration Path: Deprecated Users Table → Better Auth Users

### Current State
- `users` table with treaterId/generatorId/haulerId foreign keys
- Single role per user
- Direct entity linking

### Target State
- Better Auth's `user` table (managed by component)
- `member` table for org membership with roles
- `organizationLinks` for entity linking

### Migration Strategy

**Phase 1: Parallel existence (current milestone)**
- Keep `users` table for now
- Add organizationLinks table
- Create orgs + members for new signups
- Continue using `users` for existing legacy queries

**Phase 2: Data migration (future milestone)**
- Create script to migrate existing users to Better Auth
- For each user record:
  - Create Better Auth user if not exists
  - Create organization for their entity (treater/generator/hauler)
  - Create member record
  - Create organizationLinks entry
- Update all queries to use Better Auth tables

**Phase 3: Deprecation (future milestone)**
- Remove `users` table
- Remove treaterId/generatorId/haulerId from all code
- Rely entirely on organizationLinks

**For this milestone:** Focus only on Phase 1. Do NOT migrate existing users.

## Required Convex Schema Additions

### 1. Export organizationLinks

**File:** `packages/convex/convex/schema/index.ts`

Add to exports:
```typescript
export { organizationLinks } from "./organizationLinks";
```

### 2. Add Indexes to organizationLinks (if not present)

**File:** `packages/convex/convex/schema/organizationLinks.ts`

Verify these indexes exist:
```typescript
.index("by_better_auth_org", ["betterAuthOrgId"])
.index("by_treater", ["treaterId"])
.index("by_generator", ["generatorId"])
.index("by_hauler", ["haulerId"])
```

### 3. Add Indexes to Better Auth Tables

Better Auth component tables are generated automatically. To add custom indexes, you need local install.

**NOT RECOMMENDED for this milestone.** Use default Better Auth component indexes. If performance becomes an issue later, consider local install to add custom indexes.

## What NOT to Add

### 1. DO NOT Use Dynamic Access Control
Better Auth supports runtime role creation via `dynamicAccessControl: { enabled: true }`. This allows tenants to create custom roles.

**Why avoid:**
- Adds complexity without clear business need
- HWM has fixed role hierarchy (owner, admin, member)
- No requirement for per-tenant custom roles
- Increases query complexity and debugging difficulty

**Decision:** Stick with static roles defined at plugin configuration.

### 2. DO NOT Use Teams Feature
Better Auth organization plugin includes optional teams feature (`teams.enabled: true`). Teams are sub-groups within organizations.

**Why avoid:**
- HWM's hierarchy is already defined: Treater → Generator/Hauler
- Adding teams would create unnecessary nesting
- No clear use case for teams within generators or treaters
- Invitations and roles already cover the required scenarios

**Decision:** Disable teams feature.

### 3. DO NOT Use Local Install Yet
@convex-dev/better-auth supports two modes:
- Component mode (current): Pre-built component with fixed schema
- Local install: Full control over schema, custom indexes, plugin modifications

**Why avoid for now:**
- Component mode is simpler and officially supported
- Local install requires maintaining Better Auth schema manually
- Can migrate to local install later if needed
- Current milestone doesn't require schema customization beyond metadata

**Decision:** Stick with component mode. Re-evaluate in Phase 2 if custom indexes are needed.

### 4. DO NOT Migrate Existing Users
Current brownfield app has existing users in the `users` table.

**Why avoid:**
- Migration adds risk and complexity to auth milestone
- Parallel systems can coexist safely
- Better to validate new auth system with new users first
- Migration can be a separate, well-tested milestone

**Decision:** New signups use Better Auth. Existing users continue using legacy `users` table. Migration is Phase 2.

## Environment Variables

**Required (already configured):**
- `RESEND_API_KEY` - For invitation emails
- `RESEND_FROM_EMAIL` - Sender address
- `SITE_URL` - Base URL for callbacks
- `NODE_ENV` - Production/development mode

**No new environment variables needed.**

## Installation Steps

All dependencies are already installed. Required changes are configuration only.

### Step 1: Create Access Control File
Create `packages/convex/convex/lib/accessControl.ts` with role definitions (see section above).

### Step 2: Update Server Auth Config
Modify `packages/convex/convex/auth.ts` to add ac + roles to organization plugin.

### Step 3: Update Client Auth Config
Modify `packages/auth/src/client.ts` to add ac + roles to organizationClient.

### Step 4: Create Org Auth Helpers
Create `packages/convex/convex/lib/orgAuth.ts` with membership verification helpers.

### Step 5: Export organizationLinks
Add export to `packages/convex/convex/schema/index.ts`.

### Step 6: Update Existing Auth Helpers
Modify `packages/convex/convex/lib/auth.ts` to use Better Auth tables for membership checks (update requireTreaterAccess, etc.).

## Sources

**HIGH CONFIDENCE - Official Documentation:**
- [Better Auth Organization Plugin](https://www.better-auth.com/docs/plugins/organization) - Configuration options, role definitions
- [Better Auth Convex Integration](https://www.better-auth.com/docs/integrations/convex) - Adapter setup, component usage
- [Convex + Better Auth](https://labs.convex.dev/better-auth) - Local install, schema generation
- [Authorization Best Practices (Convex)](https://stack.convex.dev/authorization) - Multi-tenant patterns

**MEDIUM CONFIDENCE - Community Resources:**
- [Building Multi-Tenant Apps with Better Auth](https://zenstack.dev/blog/better-auth) - Integration patterns
- [Better Auth Organization Structure](https://www.premieroctet.com/blog/en/better-auth-structure-and-permissions-with-the-organization-plugin) - Permissions deep dive
- [Better Auth UI Organizations](https://better-auth-ui.com/advanced/organizations) - Client-side patterns

**Verified via WebFetch (2026-01-21):**
- Organization plugin configuration options
- Database schema structure (organization, member, invitation tables)
- Custom role definition patterns
- Access control API

## Confidence Assessment

| Area | Confidence | Rationale |
|------|------------|-----------|
| Better Auth config | HIGH | Official docs + existing brownfield setup verified |
| Organization plugin | HIGH | Configuration options extracted from official docs |
| Schema structure | HIGH | Table definitions verified via WebFetch |
| Role-based access | HIGH | Custom role patterns documented officially |
| Convex integration | MEDIUM | Component mode is documented but less common than Prisma examples |
| Migration strategy | MEDIUM | Based on best practices, not HWM-specific validation |

## Open Questions for Implementation

1. **Session management:** How to handle users switching between treater/generator/hauler orgs? (Active org context pattern addresses this)
2. **Invitation workflow:** Should invited users create new accounts or link existing? (Better Auth handles both via requireEmailVerificationOnInvitation)
3. **Role granularity:** Are owner/admin/member sufficient or do we need role per org type? (Current structure assumes sufficient; can add custom roles later if needed)
4. **Cross-org visibility:** How do treaters see generator waste without being generator members? (Pattern 3 shows treater viewing linked generators)

All open questions have documented patterns in Better Auth official docs.

---

# Technology Stack for Waste Tracking Features

**Project:** Hospital Waste Management Platform
**Research Focus:** QR code scanning/generation, real-time status updates, state machine for waste lifecycle
**Researched:** 2026-01-21
**Confidence:** HIGH

## Executive Summary

The waste tracking feature requires three new capabilities: QR code scanning (mobile camera), QR code generation (for labels/PDFs), and real-time status tracking across apps. The existing Convex infrastructure provides native real-time subscriptions that handle status updates automatically. QR functionality requires two new libraries: `@yudiel/react-qr-scanner` for scanning and `qrcode.react` for generation. No state machine library is needed — the existing schema and Convex mutations with discriminated union validators provide sufficient structure.

## Stack Additions for Waste Tracking

### QR Code Scanning

| Library | Version | Purpose | Install To |
|---------|---------|---------|------------|
| @yudiel/react-qr-scanner | ^2.1.0 | Camera-based QR/barcode scanning | apps/trucking, apps/generator |

**Why this library:**
- **Actively maintained:** Last published January 2025, regular updates
- **Modern API:** Built on Barcode Detection API with React hooks/components
- **Mobile-ready:** Camera controls (torch, zoom, camera switching) built-in
- **TypeScript:** Fully typed
- **Lightweight:** Minimal dependencies, optimized bundle
- **Cross-browser:** WebRTC adapter included for compatibility

**Alternative considered:** `html5-qrcode` — More feature-rich but heavier, requires manual React integration, ESM compatibility issues with Next.js/Vite SSR.

### QR Code Generation

| Library | Version | Purpose | Install To |
|---------|---------|---------|------------|
| qrcode.react | ^4.2.0 | Generate QR codes as SVG/Canvas | apps/generator, apps/treater |

**Why this library:**
- **Two rendering modes:** QRCodeSVG (scalable, printable) and QRCodeCanvas (image export)
- **Customizable:** Colors, error correction, embedded images/logos
- **Lightweight:** Minimal bundle size
- **Widely used:** 1.8M+ weekly downloads, battle-tested
- **Print-friendly:** SVG output works well for label printing

**Alternative considered:** `react-qr-code` — Similar features, but `qrcode.react` has better documentation and more rendering options (Canvas vs SVG choice).

### Signature Capture (for pickup confirmation)

| Library | Version | Purpose | Install To |
|---------|---------|---------|------------|
| react-signature-canvas | ^1.1.0 | Capture driver/staff signatures | apps/trucking |

**Why this library:**
- **Wrapper around signature_pad:** Proven underlying library
- **React-friendly:** Direct prop passing to canvas
- **Export methods:** `getTrimmedCanvas()` for clean image export
- **TypeScript types:** @types/react-signature-canvas available

### Real-Time Status Updates

**No additional library needed.** Convex provides this natively.

| Existing Capability | How It Helps |
|---------------------|--------------|
| `useQuery` hook | Auto-subscribes to data changes, triggers re-renders |
| Dependency tracking | Convex tracks which data each query reads |
| Push updates | When data changes, all subscribed clients get updates simultaneously |

**Pattern for waste tracking:**
```typescript
// In trucking app - driver sees real-time bag status
const bags = useQuery(api.wasteBags.getByCollectionRequest, {
  collectionRequestId
});
// Automatically updates when any bag status changes

// In generator app - hospital sees real-time collection status
const request = useQuery(api.collectionRequests.get, {
  requestId
});
// Automatically updates when driver location or status changes
```

### State Machine for Waste Lifecycle

**No library needed.** Use TypeScript discriminated unions with Convex validators.

**Why not XState:**
- Overkill for linear status progression
- Adds 50KB+ to bundle
- No hierarchical states needed
- No parallel states needed
- Convex transactions + validators provide sufficient guarantees

**Why not a state machine library:**
- Waste status is mostly linear: initialized → to_be_collected → collected → treated → aggregated → disposal_requested → disposed
- Transitions are enforced in Convex mutations (server-side)
- Type safety comes from existing validators in `packages/convex/convex/schema/validators.ts`

**Pattern:**
```typescript
// packages/convex/convex/lib/wasteStateMachine.ts
const VALID_TRANSITIONS: Record<WasteStatus, WasteStatus[]> = {
  initialized: ["to_be_collected"],
  to_be_collected: ["collected"],
  collected: ["treated"],
  treated: ["aggregated"],
  aggregated: ["disposal_requested"],
  disposal_requested: ["disposed"],
  disposed: [], // Terminal state
};

export function validateStatusTransition(
  currentStatus: WasteStatus,
  newStatus: WasteStatus
): boolean {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}

// Used in mutations:
export const updateWasteBagStatus = mutation({
  args: {
    bagId: v.id("wasteBags"),
    newStatus: wasteStatus, // From validators.ts
  },
  handler: async (ctx, args) => {
    const bag = await ctx.db.get(args.bagId);
    if (!validateStatusTransition(bag.status, args.newStatus)) {
      throw new ConvexError(`Invalid transition: ${bag.status} → ${args.newStatus}`);
    }
    // ... update bag and create history record
  }
});
```

## Installation Commands

```bash
# QR scanning (trucking app - mobile drivers, generator app - hospital staff)
pnpm --filter @hwm/trucking add @yudiel/react-qr-scanner
pnpm --filter @hwm/generator add @yudiel/react-qr-scanner

# QR generation (generator app - create labels, treater app - verify/reprint)
pnpm --filter @hwm/generator add qrcode.react
pnpm --filter @hwm/treater add qrcode.react

# Signature capture (trucking app - pickup confirmation)
pnpm --filter @hwm/trucking add react-signature-canvas
pnpm --filter @hwm/trucking add -D @types/react-signature-canvas
```

## Integration Points with Existing Stack

### QR Scanner + Convex

```typescript
// apps/trucking/src/components/qr-scanner.tsx
import { Scanner } from "@yudiel/react-qr-scanner";
import { useMutation } from "convex/react";
import { api } from "@hwm/convex/api";

export function BagScanner({ onScanComplete }) {
  const markCollected = useMutation(api.wasteBags.markCollected);

  const handleScan = async (detectedCodes) => {
    const qrCode = detectedCodes[0]?.rawValue;
    if (!qrCode) return;

    try {
      await markCollected({ qrCode });
      onScanComplete(qrCode);
    } catch (error) {
      // Handle invalid QR, already collected, etc.
    }
  };

  return (
    <Scanner
      onScan={handleScan}
      constraints={{ facingMode: "environment" }} // Back camera
      formats={["qr_code"]}
      components={{
        audio: true, // Beep on scan
        torch: true, // Flashlight toggle
      }}
    />
  );
}
```

### QR Generator + Convex File Storage

```typescript
// apps/generator/src/components/qr-label.tsx
import { QRCodeSVG } from "qrcode.react";

export function WasteBagLabel({ bag }) {
  const qrValue = `hwm://bag/${bag.qrCode}`; // URL scheme for the app

  return (
    <div className="print:block">
      <QRCodeSVG
        value={qrValue}
        size={128}
        level="M" // Medium error correction (15%)
        includeMargin={true}
      />
      <p className="text-xs mt-2">{bag.qrCode}</p>
      <p className="text-xs">{bag.wasteType}</p>
    </div>
  );
}
```

### Signature + Convex File Storage

```typescript
// apps/trucking/src/components/signature-capture.tsx
import SignatureCanvas from "react-signature-canvas";
import { useMutation } from "convex/react";
import { api } from "@hwm/convex/api";

export function PickupSignature({ collectionRequestId }) {
  const sigRef = useRef<SignatureCanvas>(null);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const confirmPickup = useMutation(api.collectionRequests.confirmPickup);

  const handleSubmit = async () => {
    // 1. Get trimmed signature as data URL
    const signatureDataUrl = sigRef.current?.getTrimmedCanvas().toDataURL("image/png");

    // 2. Upload to Convex file storage
    const uploadUrl = await generateUploadUrl();
    const response = await fetch(uploadUrl, {
      method: "POST",
      body: dataUrlToBlob(signatureDataUrl),
    });
    const { storageId } = await response.json();

    // 3. Confirm pickup with signature reference
    await confirmPickup({
      collectionRequestId,
      signatureStorageId: storageId,
    });
  };

  return (
    <div>
      <SignatureCanvas
        ref={sigRef}
        canvasProps={{ className: "border rounded w-full h-48" }}
      />
      <button onClick={() => sigRef.current?.clear()}>Clear</button>
      <button onClick={handleSubmit}>Confirm Pickup</button>
    </div>
  );
}
```

## What NOT to Add

### 1. DO NOT Add XState or State Machine Libraries

**Why avoid:**
- Waste status is fundamentally linear, not a complex graph
- Convex mutations already provide transactional guarantees
- TypeScript discriminated unions provide compile-time safety
- A simple transition map (object literal) is sufficient
- XState adds 50KB+ and significant learning curve

**Instead:** Use the `VALID_TRANSITIONS` pattern shown above.

### 2. DO NOT Add WebSocket Libraries

**Why avoid:**
- Convex handles all real-time subscriptions automatically
- `useQuery` hook manages WebSocket connection under the hood
- No manual socket management needed
- Adding Socket.io or similar would duplicate functionality

**Instead:** Use `useQuery` for any data that needs real-time updates.

### 3. DO NOT Add PDF Libraries Yet

**Why avoid:**
- QR code generation works directly with browser print
- `QRCodeSVG` produces print-ready vector graphics
- PDF generation adds complexity for minimal gain at MVP
- Can add `@react-pdf/renderer` later if needed for formal documents

**Instead:** Use CSS `@media print` for label printing, browser's native print dialog.

### 4. DO NOT Add Separate QR Libraries for Generation and Scanning

**Why avoid:**
- Some libraries try to do both but do neither well
- Scanning needs camera/WebRTC integration
- Generation needs rendering optimization
- Separation of concerns keeps bundles smaller

**Correct approach:** Use `@yudiel/react-qr-scanner` for scanning, `qrcode.react` for generation.

### 5. DO NOT Add Location Tracking Libraries

**Why avoid:**
- Browser Geolocation API is sufficient for MVP
- `navigator.geolocation.watchPosition()` provides continuous tracking
- Libraries like `react-geolocated` add wrapper complexity without clear value

**Instead:** Use native Geolocation API in trucking app for driver location updates.

## Browser Requirements

### QR Scanning Requirements

| Requirement | Details |
|-------------|---------|
| HTTPS | Camera access requires secure context (localhost works for dev) |
| Camera permission | User must grant permission on first scan |
| Modern browser | Chrome 76+, Firefox 69+, Safari 14+, Edge 79+ |

**Mobile considerations:**
- iOS Safari: Works in standalone PWA mode
- Android Chrome: Full support including torch
- Older Android WebView: May have issues, recommend Chrome

### Geolocation Requirements

| Requirement | Details |
|-------------|---------|
| HTTPS | Required for geolocation |
| Permission | User must grant location permission |
| Background | Requires user interaction to continue in background |

## Environment Variables

**No new environment variables needed for these features.**

The QR code content uses internal identifiers (bag QR codes stored in database). File uploads use Convex's built-in file storage (no external service).

## Affected Schema Fields (Already Exist)

The existing schema already supports these features:

| Table | Field | Purpose |
|-------|-------|---------|
| `wasteBags` | `qrCode` | Unique QR identifier |
| `wasteBags` | `qrSource` | "pre_manufactured" or "hospital_generated" |
| `wasteBags` | `status` | Current lifecycle status |
| `wasteStatusHistory` | `*` | Audit trail for all transitions |
| `collectionRequests` | `pickupSignatureUrl` | Signature image reference |
| `collectionRequests` | `driverLocation` | Real-time driver position |

## Sources

**HIGH CONFIDENCE - npm/GitHub:**
- [@yudiel/react-qr-scanner](https://github.com/yudielcurbelo/react-qr-scanner) - Actively maintained, TypeScript, modern API
- [qrcode.react](https://github.com/zpao/qrcode.react) - 4M+ weekly downloads, battle-tested
- [react-signature-canvas](https://github.com/agilgur5/react-signature-canvas) - React wrapper for signature_pad

**HIGH CONFIDENCE - Official Documentation:**
- [Convex Real-time](https://docs.convex.dev/realtime) - Automatic subscriptions, dependency tracking
- [Convex File Storage](https://docs.convex.dev/file-storage) - Upload, store, serve files

**MEDIUM CONFIDENCE - WebSearch:**
- [QR scanning comparison 2025](https://github.com/topics/qr-code-scanner) - Library ecosystem survey
- [State machine patterns in TypeScript](https://medium.com/@MichaelVD/composable-state-machines-in-typescript) - Discriminated union approach

## Confidence Assessment

| Area | Confidence | Rationale |
|------|------------|-----------|
| QR scanning library | HIGH | GitHub repo verified, npm stats checked, recent releases |
| QR generation library | HIGH | Widely used, stable API, official documentation |
| Signature capture | HIGH | Mature library, TypeScript types available |
| Real-time updates | HIGH | Convex's core feature, extensively documented |
| State machine approach | MEDIUM | Pattern is sound but HWM-specific validation needed |
| Browser compatibility | MEDIUM | Based on caniuse.com data, not tested on HWM apps |

## Summary: What to Install

| App | Package | Purpose |
|-----|---------|---------|
| trucking | @yudiel/react-qr-scanner | Scan bags during collection |
| trucking | react-signature-canvas | Capture pickup signatures |
| trucking | @types/react-signature-canvas | TypeScript support |
| generator | @yudiel/react-qr-scanner | Scan to log new waste |
| generator | qrcode.react | Generate/print bag labels |
| treater | qrcode.react | Verify/reprint labels |

**Total new dependencies:** 3 runtime packages + 1 dev package

**Bundle impact estimate:** ~25KB gzipped total (scanner ~15KB, QR gen ~5KB, signature ~5KB)
