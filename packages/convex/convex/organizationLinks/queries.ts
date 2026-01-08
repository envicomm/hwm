import { query } from "../_generated/server";
import { v } from "convex/values";

// Get organization link by better-auth org ID
export const getByBetterAuthOrgId = query({
	args: {
		betterAuthOrgId: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("organizationLinks")
			.withIndex("by_better_auth_org", (q) =>
				q.eq("betterAuthOrgId", args.betterAuthOrgId)
			)
			.first();
	},
});

// Get organization link by treater ID
export const getByTreater = query({
	args: {
		treaterId: v.id("treaters"),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("organizationLinks")
			.withIndex("by_treater", (q) => q.eq("treaterId", args.treaterId))
			.first();
	},
});

// Get organization link by generator ID
export const getByGenerator = query({
	args: {
		generatorId: v.id("generators"),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("organizationLinks")
			.withIndex("by_generator", (q) => q.eq("generatorId", args.generatorId))
			.first();
	},
});

// Get organization link by hauler ID
export const getByHauler = query({
	args: {
		haulerId: v.id("haulers"),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("organizationLinks")
			.withIndex("by_hauler", (q) => q.eq("haulerId", args.haulerId))
			.first();
	},
});
