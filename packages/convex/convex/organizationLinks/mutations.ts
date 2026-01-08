import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { organizationType } from "../schema/organizationLinks";
import { requireAuth } from "../lib/auth";

// Create a link between better-auth organization and Convex entity
// Requires authentication - typically called during organization setup
export const createLink = mutation({
	args: {
		betterAuthOrgId: v.string(),
		organizationType: organizationType,
		treaterId: v.optional(v.id("treaters")),
		generatorId: v.optional(v.id("generators")),
		haulerId: v.optional(v.id("haulers")),
	},
	handler: async (ctx, args) => {
		// Require authentication for creating organization links
		await requireAuth(ctx);

		const now = Date.now();

		const linkId = await ctx.db.insert("organizationLinks", {
			betterAuthOrgId: args.betterAuthOrgId,
			organizationType: args.organizationType,
			treaterId: args.treaterId,
			generatorId: args.generatorId,
			haulerId: args.haulerId,
			createdAt: now,
		});

		return linkId;
	},
});

// Delete an organization link
// Requires authentication - admin level operation
export const deleteLink = mutation({
	args: {
		linkId: v.id("organizationLinks"),
	},
	handler: async (ctx, args) => {
		// Require authentication for deleting organization links
		await requireAuth(ctx);

		await ctx.db.delete(args.linkId);
	},
});
