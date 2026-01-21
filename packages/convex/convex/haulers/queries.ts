import { query } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { requireAuth } from "../lib/auth";

// Get all haulers partnered with a treater
export const getByTreater = query({
	args: {
		treaterId: v.id("treaters"),
		includeInactive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx);

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
		treaterId: v.id("treaters"),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx);

		const hauler = await ctx.db.get(args.haulerId);
		if (!hauler) return null;

		// Verify partnership exists between hauler and treater
		const partnership = await ctx.db
			.query("treaterHaulerPartners")
			.withIndex("by_treater", (q) => q.eq("treaterId", args.treaterId))
			.collect()
			.then(partnerships => partnerships.find(p => p.haulerId === args.haulerId && p.isActive));

		if (!partnership) {
			throw new ConvexError("Access denied: No active partnership with this hauler");
		}

		return hauler;
	},
});

// Get hauler with its organization link
export const getWithOrgLink = query({
	args: {
		haulerId: v.id("haulers"),
		treaterId: v.id("treaters"),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx);

		const hauler = await ctx.db.get(args.haulerId);
		if (!hauler) return null;

		// Verify partnership exists between hauler and treater
		const partnership = await ctx.db
			.query("treaterHaulerPartners")
			.withIndex("by_treater", (q) => q.eq("treaterId", args.treaterId))
			.collect()
			.then(partnerships => partnerships.find(p => p.haulerId === args.haulerId && p.isActive));

		if (!partnership) {
			throw new ConvexError("Access denied: No active partnership with this hauler");
		}

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

