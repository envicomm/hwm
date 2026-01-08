import { query } from "../_generated/server";
import { v } from "convex/values";

// Get all haulers partnered with a treater
export const getByTreater = query({
	args: {
		treaterId: v.id("treaters"),
		includeInactive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		// Get all partnerships for this treater
		const partnerships = await ctx.db
			.query("treaterHaulerPartners")
			.withIndex("by_treater", (q) => q.eq("treaterId", args.treaterId))
			.collect();

		// Filter by active status if needed
		const activePartnerships = args.includeInactive
			? partnerships
			: partnerships.filter((p) => p.isActive);

		// Get the hauler details for each partnership
		const haulers = await Promise.all(
			activePartnerships.map(async (p) => {
				const hauler = await ctx.db.get(p.haulerId);
				return hauler;
			})
		);

		return haulers.filter((h) => h !== null);
	},
});

// Get a single hauler by ID
export const getById = query({
	args: {
		haulerId: v.id("haulers"),
	},
	handler: async (ctx, args) => {
		return await ctx.db.get(args.haulerId);
	},
});

// Get hauler with its organization link
export const getWithOrgLink = query({
	args: {
		haulerId: v.id("haulers"),
	},
	handler: async (ctx, args) => {
		const hauler = await ctx.db.get(args.haulerId);
		if (!hauler) return null;

		const orgLink = await ctx.db
			.query("organizationLinks")
			.withIndex("by_hauler", (q) => q.eq("haulerId", args.haulerId))
			.first();

		return {
			...hauler,
			organizationLink: orgLink,
		};
	},
});

// Get all active haulers
export const getAll = query({
	args: {
		includeInactive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const haulers = await ctx.db.query("haulers").collect();

		if (args.includeInactive) {
			return haulers;
		}

		return haulers.filter((h) => h.isActive);
	},
});
