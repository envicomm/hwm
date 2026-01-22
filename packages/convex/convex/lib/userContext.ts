import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { authComponent, createAuth } from "../auth";

// Organization roles from Better Auth organization plugin
// Defined inline to avoid dependency on permissions.ts (parallel plan)
// TODO: Import from ./permissions.ts once 05-01 completes
export type OrgRole = "owner" | "admin" | "member";

// Domain roles from users table
export type DomainRole = "generator" | "treater" | "hauler" | "driver" | "admin";

// Full user context for RBAC
export type UserContext = {
	// Better Auth identifiers
	userId: string; // Better Auth user ID
	email: string;
	name?: string;

	// Organization context
	orgId: string; // Better Auth organization ID
	orgRole: OrgRole; // owner | admin | member

	// Domain context
	domainRole: DomainRole; // generator | treater | hauler | driver | admin

	// Entity IDs (one will be set based on org type)
	treaterId?: Id<"treaters">;
	generatorId?: Id<"generators">;
	haulerId?: Id<"haulers">;

	// Organization type for convenience
	orgType: "treater" | "generator" | "hauler";
};

/**
 * Resolve full user context from Better Auth session
 * Returns null if not authenticated or no active organization
 */
export async function resolveUserContext(
	ctx: QueryCtx | MutationCtx
): Promise<UserContext | null> {
	// Get authenticated user from Better Auth (returns user document directly)
	const authUser = await authComponent.safeGetAuthUser(ctx);
	if (!authUser) {
		return null;
	}

	// Get Better Auth API and headers for API calls
	const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

	// Get active member info which includes organizationId and role
	// IMPORTANT: Default to "member" (most restrictive) if API call fails.
	// This is a fail-safe design - if we can't verify the role, we assume
	// the lowest permission level to prevent privilege escalation.
	let orgRole: OrgRole = "member";
	let activeOrgId: string | null = null;

	try {
		// getActiveMember returns the member info including organizationId and role
		const memberResult = await auth.api.getActiveMember({ headers });
		if (memberResult) {
			activeOrgId = memberResult.organizationId;
			if (memberResult.role) {
				orgRole = memberResult.role as OrgRole;
			}
		}
	} catch (error) {
		// Log for debugging but continue with member role
		// This ensures the system remains functional even if Better Auth
		// API is temporarily unavailable
		console.warn(
			"Failed to fetch active member from Better Auth, defaulting to member:",
			error
		);
	}

	// If no active organization, try to get from session via getSession
	if (!activeOrgId) {
		try {
			const sessionResult = await auth.api.getSession({ headers });
			activeOrgId =
				(sessionResult?.session as { activeOrganizationId?: string })
					?.activeOrganizationId ?? null;
		} catch (error) {
			console.warn("Failed to fetch session from Better Auth:", error);
		}
	}

	if (!activeOrgId) {
		return null;
	}

	// Get organization link to find domain entity
	const orgLink = await ctx.db
		.query("organizationLinks")
		.withIndex("by_better_auth_org", (q) => q.eq("betterAuthOrgId", activeOrgId))
		.first();

	if (!orgLink) {
		return null;
	}

	// Get domain user for role info (uses the Better Auth user's _id as string)
	const betterAuthUserId = authUser._id.toString();
	const domainUser = await ctx.db
		.query("users")
		.withIndex("by_better_auth_user", (q) =>
			q.eq("betterAuthUserId", betterAuthUserId)
		)
		.first();

	// Determine domain role (from user or infer from org type)
	let domainRole: DomainRole;
	if (domainUser?.role) {
		domainRole = domainUser.role;
	} else {
		// Infer from organization type
		domainRole = orgLink.organizationType as DomainRole;
	}

	return {
		userId: betterAuthUserId,
		email: authUser.email,
		name: authUser.name ?? undefined,
		orgId: activeOrgId,
		orgRole,
		domainRole,
		treaterId: orgLink.treaterId ?? undefined,
		generatorId: orgLink.generatorId ?? undefined,
		haulerId: orgLink.haulerId ?? undefined,
		orgType: orgLink.organizationType,
	};
}

/**
 * Require user context - throws if not authenticated
 */
export async function requireUserContext(
	ctx: QueryCtx | MutationCtx
): Promise<UserContext> {
	const userContext = await resolveUserContext(ctx);
	if (!userContext) {
		throw new ConvexError({
			message: "Authentication required",
			code: "UNAUTHORIZED",
		});
	}
	return userContext;
}
