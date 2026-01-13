import { query } from "../_generated/server";
import { v } from "convex/values";

// Get all waste bags for a generator
export const getByGenerator = query({
	args: {
		generatorId: v.id("generators"),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const wasteBags = await ctx.db
			.query("wasteBags")
			.withIndex("by_generator", (q) => q.eq("generatorId", args.generatorId))
			.order("desc")
			.take(args.limit ?? 100);

		return wasteBags;
	},
});

// Get latest waste bags (for development/testing)
export const getLatest = query({
	args: {
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const wasteBags = await ctx.db
			.query("wasteBags")
			.order("desc")
			.take(args.limit ?? 10);

		return wasteBags;
	},
});

// Get a single waste bag by ID
export const getById = query({
	args: {
		wasteBagId: v.id("wasteBags"),
	},
	handler: async (ctx, args) => {
		return await ctx.db.get(args.wasteBagId);
	},
});
