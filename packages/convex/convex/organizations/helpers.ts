import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id, Doc } from "../_generated/dataModel";

type OrganizationLink = Doc<"organizationLinks">;
type OrganizationType = "treater" | "generator" | "hauler";

/**
 * Get domain entity from Better Auth organization ID
 *
 * @param ctx - Query or mutation context
 * @param betterAuthOrgId - Better Auth organization ID
 * @returns Object containing the link record and the domain entity
 * @throws ConvexError if organization link or entity not found
 *
 * @example
 * const { link, entity, type } = await getDomainEntityFromOrg(ctx, "org_123");
 * if (type === "treater") {
 *   // entity is Doc<"treaters">
 * }
 */
export async function getDomainEntityFromOrg(
	ctx: QueryCtx | MutationCtx,
	betterAuthOrgId: string
): Promise<{
	link: OrganizationLink;
	entity: Doc<"treaters"> | Doc<"generators"> | Doc<"haulers">;
	type: OrganizationType;
}> {
	// Query the link table by Better Auth org ID
	const link = await ctx.db
		.query("organizationLinks")
		.withIndex("by_better_auth_org", (q) =>
			q.eq("betterAuthOrgId", betterAuthOrgId)
		)
		.first();

	if (!link) {
		throw new ConvexError({
			message: "Organization link not found",
			betterAuthOrgId,
		});
	}

	// Fetch the correct domain entity based on organization type
	let entity: Doc<"treaters"> | Doc<"generators"> | Doc<"haulers">;

	switch (link.organizationType) {
		case "treater": {
			if (!link.treaterId) {
				throw new ConvexError({
					message: "Organization link missing treaterId",
					linkId: link._id,
				});
			}
			const treater = await ctx.db.get(link.treaterId);
			if (!treater) {
				throw new ConvexError({
					message: "Treater entity not found",
					treaterId: link.treaterId,
				});
			}
			entity = treater;
			break;
		}
		case "generator": {
			if (!link.generatorId) {
				throw new ConvexError({
					message: "Organization link missing generatorId",
					linkId: link._id,
				});
			}
			const generator = await ctx.db.get(link.generatorId);
			if (!generator) {
				throw new ConvexError({
					message: "Generator entity not found",
					generatorId: link.generatorId,
				});
			}
			entity = generator;
			break;
		}
		case "hauler": {
			if (!link.haulerId) {
				throw new ConvexError({
					message: "Organization link missing haulerId",
					linkId: link._id,
				});
			}
			const hauler = await ctx.db.get(link.haulerId);
			if (!hauler) {
				throw new ConvexError({
					message: "Hauler entity not found",
					haulerId: link.haulerId,
				});
			}
			entity = hauler;
			break;
		}
	}

	return {
		link,
		entity,
		type: link.organizationType,
	};
}

/**
 * Get Better Auth organization link from domain entity
 *
 * @param ctx - Query or mutation context
 * @param entityType - Type of domain entity ("treater" | "generator" | "hauler")
 * @param entityId - ID of the domain entity
 * @returns Organization link record
 * @throws ConvexError if link not found
 *
 * @example
 * const link = await getBetterAuthOrgFromEntity(ctx, "treater", treaterId);
 * const betterAuthOrgId = link.betterAuthOrgId;
 */
export async function getBetterAuthOrgFromEntity(
	ctx: QueryCtx | MutationCtx,
	entityType: "treater" | "generator" | "hauler",
	entityId: Id<"treaters"> | Id<"generators"> | Id<"haulers">
): Promise<OrganizationLink> {
	let link: OrganizationLink | null = null;

	// Use switch for type-safe index queries
	switch (entityType) {
		case "treater":
			link = await ctx.db
				.query("organizationLinks")
				.withIndex("by_treater", (q) =>
					q.eq("treaterId", entityId as Id<"treaters">)
				)
				.first();
			break;
		case "generator":
			link = await ctx.db
				.query("organizationLinks")
				.withIndex("by_generator", (q) =>
					q.eq("generatorId", entityId as Id<"generators">)
				)
				.first();
			break;
		case "hauler":
			link = await ctx.db
				.query("organizationLinks")
				.withIndex("by_hauler", (q) =>
					q.eq("haulerId", entityId as Id<"haulers">)
				)
				.first();
			break;
	}

	if (!link) {
		throw new ConvexError({
			message: `Organization link not found for ${entityType}`,
			entityType,
			entityId,
		});
	}

	return link;
}

/**
 * Type-safe helper to create organization link data
 * Enforces type-to-field mapping to prevent storing wrong entity ID in wrong field
 *
 * @param type - Organization type ("treater" | "generator" | "hauler")
 * @param entityId - ID of the domain entity
 * @param betterAuthOrgId - Better Auth organization ID
 * @param parentBetterAuthOrgId - Optional parent organization ID (for generators/haulers)
 * @returns Object ready for ctx.db.insert("organizationLinks", ...)
 *
 * @example
 * const linkData = makeOrgLinkData("treater", treaterId, orgResult.id);
 * await ctx.db.insert("organizationLinks", linkData);
 *
 * const childLinkData = makeOrgLinkData("generator", generatorId, orgResult.id, parentOrgId);
 * await ctx.db.insert("organizationLinks", childLinkData);
 */
export function makeOrgLinkData<T extends OrganizationType>(
	type: T,
	entityId: T extends "treater"
		? Id<"treaters">
		: T extends "generator"
		? Id<"generators">
		: Id<"haulers">,
	betterAuthOrgId: string,
	parentBetterAuthOrgId?: string
): {
	betterAuthOrgId: string;
	organizationType: T;
	createdAt: number;
	parentBetterAuthOrgId?: string;
} & (
	| { treaterId: Id<"treaters"> }
	| { generatorId: Id<"generators"> }
	| { haulerId: Id<"haulers"> }
) {
	const base = {
		betterAuthOrgId,
		organizationType: type,
		createdAt: Date.now(),
		...(parentBetterAuthOrgId ? { parentBetterAuthOrgId } : {}),
	};

	// Type-safe field assignment based on organization type
	// This prevents storing generatorId in treaterId field (Pattern 5 anti-pattern)
	if (type === "treater") {
		return {
			...base,
			treaterId: entityId as Id<"treaters">,
		} as any;
	}

	if (type === "generator") {
		return {
			...base,
			generatorId: entityId as Id<"generators">,
		} as any;
	}

	// type === "hauler"
	return {
		...base,
		haulerId: entityId as Id<"haulers">,
	} as any;
}

/**
 * Get domain user from Better Auth user ID
 *
 * @param ctx - Query or mutation context
 * @param betterAuthUserId - Better Auth user ID
 * @returns User record or null if not found
 *
 * Note: Returns null instead of throwing because user may not exist yet
 * (e.g., during initial signup flow before domain user is created)
 *
 * @example
 * const user = await getDomainUser(ctx, session.userId);
 * if (!user) {
 *   // User needs to complete onboarding
 * }
 */
export async function getDomainUser(
	ctx: QueryCtx | MutationCtx,
	betterAuthUserId: string
): Promise<Doc<"users"> | null> {
	// Note: This assumes betterAuthUserId field exists on users table
	// Phase 02-03 will add this field and migration
	return await ctx.db
		.query("users")
		.withIndex("by_better_auth_user", (q) =>
			q.eq("betterAuthUserId", betterAuthUserId)
		)
		.first();
}
