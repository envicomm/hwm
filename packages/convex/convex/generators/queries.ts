import { query } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { requireAuth } from "../lib/auth";

// Get all generators for a treater
export const getByTreater = query({
	args: {
		treaterId: v.id("treaters"),
		includeInactive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx);

		const generators = await ctx.db
			.query("generators")
			.withIndex("by_treater", (q) => q.eq("treaterId", args.treaterId))
			.collect();

		if (args.includeInactive) {
			return generators;
		}

		return generators.filter((g) => g.isActive);
	},
});

// Get a single generator by ID
export const getById = query({
	args: {
		generatorId: v.id("generators"),
		treaterId: v.id("treaters"),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx);

		const generator = await ctx.db.get(args.generatorId);
		if (!generator) return null;

		// Verify generator belongs to treater
		if (generator.treaterId !== args.treaterId) {
			throw new ConvexError("Access denied: Generator does not belong to this treater");
		}

		return generator;
	},
});

// Get generator with its organization link
export const getWithOrgLink = query({
	args: {
		generatorId: v.id("generators"),
		treaterId: v.id("treaters"),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx);

		const generator = await ctx.db.get(args.generatorId);
		if (!generator) return null;

		// Verify generator belongs to treater
		if (generator.treaterId !== args.treaterId) {
			throw new ConvexError("Access denied: Generator does not belong to this treater");
		}

		const orgLink = await ctx.db
			.query("organizationLinks")
			.withIndex("by_generator", (q) => q.eq("generatorId", args.generatorId))
			.first();

		return {
			...generator,
			organizationLink: orgLink,
		};
	},
});
