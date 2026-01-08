import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { authComponent } from "../auth";

// Type for organization types
export type OrganizationType = "treater" | "generator" | "hauler";

// Type for user roles
export type UserRole = "generator" | "treater" | "hauler" | "driver" | "admin";

/**
 * Require authentication - throws if user is not logged in
 * Returns the user identity from Convex auth
 */
export async function requireAuth(ctx: QueryCtx | MutationCtx) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new ConvexError("Unauthorized: Please log in to continue");
	}
	return identity;
}

/**
 * Get authenticated user identity without throwing - returns null if not logged in
 */
export async function getAuthIdentity(ctx: QueryCtx | MutationCtx) {
	return await ctx.auth.getUserIdentity();
}

/**
 * Get the full Better Auth user record
 */
export async function getAuthUser(ctx: QueryCtx | MutationCtx) {
	return await authComponent.getAuthUser(ctx);
}

/**
 * Get organization link for a better-auth organization ID
 */
export async function getOrganizationLink(
	ctx: QueryCtx | MutationCtx,
	betterAuthOrgId: string
) {
	const link = await ctx.db
		.query("organizationLinks")
		.withIndex("by_better_auth_org", (q) =>
			q.eq("betterAuthOrgId", betterAuthOrgId)
		)
		.first();
	return link;
}

/**
 * Get organization link by treater ID
 */
export async function getOrganizationLinkByTreater(
	ctx: QueryCtx | MutationCtx,
	treaterId: Id<"treaters">
) {
	return await ctx.db
		.query("organizationLinks")
		.withIndex("by_treater", (q) => q.eq("treaterId", treaterId))
		.first();
}

/**
 * Get organization link by generator ID
 */
export async function getOrganizationLinkByGenerator(
	ctx: QueryCtx | MutationCtx,
	generatorId: Id<"generators">
) {
	return await ctx.db
		.query("organizationLinks")
		.withIndex("by_generator", (q) => q.eq("generatorId", generatorId))
		.first();
}

/**
 * Get organization link by hauler ID
 */
export async function getOrganizationLinkByHauler(
	ctx: QueryCtx | MutationCtx,
	haulerId: Id<"haulers">
) {
	return await ctx.db
		.query("organizationLinks")
		.withIndex("by_hauler", (q) => q.eq("haulerId", haulerId))
		.first();
}

/**
 * Require user to be a member of a treater organization
 * This is a simplified check - in a full implementation, you'd verify
 * the user is actually a member of the org via better-auth organization membership
 */
export async function requireTreaterAccess(
	ctx: QueryCtx | MutationCtx,
	treaterId: Id<"treaters">
) {
	const identity = await requireAuth(ctx);

	// Get the treater record to verify it exists
	const treater = await ctx.db.get(treaterId);
	if (!treater) {
		throw new ConvexError("Treater not found");
	}

	// For now, verify user is authenticated
	// TODO: Add proper organization membership verification via better-auth
	// This requires querying the better-auth organization members table
	return { identity, treaterId };
}

/**
 * Require user to be a member of a generator organization
 * Also allows access if user is a member of the parent treater
 */
export async function requireGeneratorAccess(
	ctx: QueryCtx | MutationCtx,
	generatorId: Id<"generators">
) {
	const identity = await requireAuth(ctx);

	// Get the generator record
	const generator = await ctx.db.get(generatorId);
	if (!generator) {
		throw new ConvexError("Generator not found");
	}

	// For now, verify user is authenticated
	// TODO: Add proper organization membership verification via better-auth
	return { identity, generatorId };
}

/**
 * Require user to be a member of a hauler organization
 */
export async function requireHaulerAccess(
	ctx: QueryCtx | MutationCtx,
	haulerId: Id<"haulers">
) {
	const identity = await requireAuth(ctx);

	// Get the hauler record
	const hauler = await ctx.db.get(haulerId);
	if (!hauler) {
		throw new ConvexError("Hauler not found");
	}

	// For now, verify user is authenticated
	// TODO: Add proper organization membership verification via better-auth
	return { identity, haulerId };
}

/**
 * Require user to be a treater with a partnership to the specified hauler
 */
export async function requireTreaterHaulerPartnership(
	ctx: QueryCtx | MutationCtx,
	treaterId: Id<"treaters">,
	haulerId: Id<"haulers">
) {
	// First verify treater access
	const { identity } = await requireTreaterAccess(ctx, treaterId);

	// Then verify partnership exists
	const partnerships = await ctx.db
		.query("treaterHaulerPartners")
		.withIndex("by_treater", (q) => q.eq("treaterId", treaterId))
		.collect();

	const partnership = partnerships.find(
		(p) => p.haulerId === haulerId && p.isActive
	);

	if (!partnership) {
		throw new ConvexError(
			"Forbidden: No active partnership exists with this hauler"
		);
	}

	return { identity, treaterId, haulerId };
}
