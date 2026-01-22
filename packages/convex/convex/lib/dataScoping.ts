import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import type { UserContext } from "./userContext";

type Ctx = QueryCtx | MutationCtx;

/**
 * Get generators accessible to the user based on their domain role
 *
 * - Treater: All generators linked to their treater
 * - Generator: Only their own generator org
 * - Hauler: No generators (empty array)
 */
export async function getAccessibleGenerators(
	ctx: Ctx,
	user: UserContext,
	options?: { includeInactive?: boolean }
): Promise<Doc<"generators">[]> {
	const { includeInactive = false } = options ?? {};

	switch (user.orgType) {
		case "treater": {
			if (!user.treaterId) return [];
			const query = ctx.db
				.query("generators")
				.withIndex("by_treater", (q) => q.eq("treaterId", user.treaterId!));

			const generators = await query.collect();
			return includeInactive
				? generators
				: generators.filter((g) => g.isActive);
		}

		case "generator": {
			if (!user.generatorId) return [];
			const generator = await ctx.db.get(user.generatorId);
			if (!generator) return [];
			if (!includeInactive && !generator.isActive) return [];
			return [generator];
		}

		case "hauler":
			// Haulers don't have access to generators
			return [];

		default:
			return [];
	}
}

/**
 * Get haulers accessible to the user based on their domain role
 *
 * - Treater: All haulers with active partnership
 * - Hauler: Only their own hauler org
 * - Generator: No haulers (empty array)
 */
export async function getAccessibleHaulers(
	ctx: Ctx,
	user: UserContext,
	options?: { includeInactive?: boolean }
): Promise<Doc<"haulers">[]> {
	const { includeInactive = false } = options ?? {};

	switch (user.orgType) {
		case "treater": {
			if (!user.treaterId) return [];

			// Get active partnerships
			const partnerships = await ctx.db
				.query("treaterHaulerPartners")
				.withIndex("by_treater", (q) => q.eq("treaterId", user.treaterId!))
				.filter((q) => q.eq(q.field("isActive"), true))
				.collect();

			// Fetch hauler records
			const haulerIds = partnerships.map((p) => p.haulerId);
			const haulers: Doc<"haulers">[] = [];

			for (const haulerId of haulerIds) {
				const hauler = await ctx.db.get(haulerId);
				if (hauler && (includeInactive || hauler.isActive)) {
					haulers.push(hauler);
				}
			}

			return haulers;
		}

		case "hauler": {
			if (!user.haulerId) return [];
			const hauler = await ctx.db.get(user.haulerId);
			if (!hauler) return [];
			if (!includeInactive && !hauler.isActive) return [];
			return [hauler];
		}

		case "generator":
			// Generators don't have access to haulers
			return [];

		default:
			return [];
	}
}

/**
 * Check if user can access a specific generator
 * Returns true if access allowed, false otherwise
 */
export async function canAccessGenerator(
	ctx: Ctx,
	user: UserContext,
	generatorId: Id<"generators">
): Promise<boolean> {
	switch (user.orgType) {
		case "treater": {
			// Treater can access generators under their organization
			const generator = await ctx.db.get(generatorId);
			if (!generator) return false;
			return generator.treaterId === user.treaterId;
		}

		case "generator":
			// Generator can only access their own org
			return user.generatorId === generatorId;

		case "hauler":
			// Haulers cannot access generators
			return false;

		default:
			return false;
	}
}

/**
 * Check if user can access a specific hauler
 * Returns true if access allowed, false otherwise
 */
export async function canAccessHauler(
	ctx: Ctx,
	user: UserContext,
	haulerId: Id<"haulers">
): Promise<boolean> {
	switch (user.orgType) {
		case "treater": {
			// Treater can access haulers with active partnership
			if (!user.treaterId) return false;

			const partnership = await ctx.db
				.query("treaterHaulerPartners")
				.withIndex("by_treater", (q) => q.eq("treaterId", user.treaterId!))
				.filter((q) =>
					q.and(
						q.eq(q.field("haulerId"), haulerId),
						q.eq(q.field("isActive"), true)
					)
				)
				.first();

			return partnership !== null;
		}

		case "hauler":
			// Hauler can only access their own org
			return user.haulerId === haulerId;

		case "generator":
			// Generators cannot access haulers
			return false;

		default:
			return false;
	}
}

/**
 * Require access to a generator or throw
 * Use in mutations/queries that need generator access
 */
export async function requireGeneratorAccess(
	ctx: Ctx,
	user: UserContext,
	generatorId: Id<"generators">
): Promise<void> {
	const hasAccess = await canAccessGenerator(ctx, user, generatorId);
	if (!hasAccess) {
		throw new ConvexError({
			message: "Access denied",
			code: "FORBIDDEN",
		});
	}
}

/**
 * Require access to a hauler or throw
 * Use in mutations/queries that need hauler access
 */
export async function requireHaulerAccess(
	ctx: Ctx,
	user: UserContext,
	haulerId: Id<"haulers">
): Promise<void> {
	const hasAccess = await canAccessHauler(ctx, user, haulerId);
	if (!hasAccess) {
		throw new ConvexError({
			message: "Access denied",
			code: "FORBIDDEN",
		});
	}
}
