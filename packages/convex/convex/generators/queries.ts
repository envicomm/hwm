import { query } from "../_generated/server";
import { v } from "convex/values";

// Get all generators for a treater
export const getByTreater = query({
	args: {
		treaterId: v.id("treaters"),
		includeInactive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
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
	},
	handler: async (ctx, args) => {
		return await ctx.db.get(args.generatorId);
	},
});

// Get generator with its organization link
export const getWithOrgLink = query({
	args: {
		generatorId: v.id("generators"),
	},
	handler: async (ctx, args) => {
		const generator = await ctx.db.get(args.generatorId);
		if (!generator) return null;

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
