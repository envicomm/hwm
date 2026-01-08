import { mutation } from "../_generated/server";
import { v } from "convex/values";
import {
	requireAuth,
	requireHaulerAccess,
	requireTreaterAccess,
} from "../lib/auth";

// Create a new hauler (Convex entity only)
// The organization creation and invitations should be handled client-side
// Requires authentication (hauler creation typically done during onboarding)
export const create = mutation({
	args: {
		name: v.string(),
		address: v.string(),
		contactEmail: v.string(),
		contactPhone: v.string(),
		licenseNumber: v.optional(v.string()),
		location: v.optional(
			v.object({
				lat: v.number(),
				lng: v.number(),
			})
		),
		serviceArea: v.optional(
			v.object({
				cities: v.array(v.string()),
			})
		),
	},
	handler: async (ctx, args) => {
		// Require authentication for hauler creation
		await requireAuth(ctx);

		const now = Date.now();

		const haulerId = await ctx.db.insert("haulers", {
			name: args.name,
			address: args.address,
			contactEmail: args.contactEmail,
			contactPhone: args.contactPhone,
			licenseNumber: args.licenseNumber,
			location: args.location,
			serviceArea: args.serviceArea,
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});

		return haulerId;
	},
});

// Create a treater-hauler partnership
// Only treaters can create partnerships with haulers
export const createPartnership = mutation({
	args: {
		treaterId: v.id("treaters"),
		haulerId: v.id("haulers"),
	},
	handler: async (ctx, args) => {
		// Verify user has access to this treater organization
		await requireTreaterAccess(ctx, args.treaterId);

		const now = Date.now();

		// Check if partnership already exists
		const existing = await ctx.db
			.query("treaterHaulerPartners")
			.withIndex("by_treater", (q) => q.eq("treaterId", args.treaterId))
			.collect();

		const existingPartnership = existing.find(
			(p) => p.haulerId === args.haulerId
		);

		if (existingPartnership) {
			// Reactivate if inactive
			if (!existingPartnership.isActive) {
				await ctx.db.patch(existingPartnership._id, { isActive: true });
			}
			return existingPartnership._id;
		}

		// Create new partnership
		const partnershipId = await ctx.db.insert("treaterHaulerPartners", {
			treaterId: args.treaterId,
			haulerId: args.haulerId,
			isActive: true,
			createdAt: now,
		});

		return partnershipId;
	},
});

// Update a hauler
// Only members of the hauler organization can update
export const update = mutation({
	args: {
		haulerId: v.id("haulers"),
		name: v.optional(v.string()),
		address: v.optional(v.string()),
		contactEmail: v.optional(v.string()),
		contactPhone: v.optional(v.string()),
		licenseNumber: v.optional(v.string()),
		location: v.optional(
			v.object({
				lat: v.number(),
				lng: v.number(),
			})
		),
		serviceArea: v.optional(
			v.object({
				cities: v.array(v.string()),
			})
		),
		isActive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		// Verify user has access to this hauler organization
		await requireHaulerAccess(ctx, args.haulerId);

		const { haulerId, ...updates } = args;

		await ctx.db.patch(haulerId, {
			...updates,
			updatedAt: Date.now(),
		});

		return haulerId;
	},
});

// Soft delete a hauler
// Only members of the hauler organization can delete
export const remove = mutation({
	args: {
		haulerId: v.id("haulers"),
	},
	handler: async (ctx, args) => {
		// Verify user has access to this hauler organization
		await requireHaulerAccess(ctx, args.haulerId);

		await ctx.db.patch(args.haulerId, {
			isActive: false,
			updatedAt: Date.now(),
		});
	},
});

// Remove treater-hauler partnership
// Only treaters can remove partnerships
export const removePartnership = mutation({
	args: {
		treaterId: v.id("treaters"),
		haulerId: v.id("haulers"),
	},
	handler: async (ctx, args) => {
		// Verify user has access to this treater organization
		await requireTreaterAccess(ctx, args.treaterId);

		const partnerships = await ctx.db
			.query("treaterHaulerPartners")
			.withIndex("by_treater", (q) => q.eq("treaterId", args.treaterId))
			.collect();

		const partnership = partnerships.find((p) => p.haulerId === args.haulerId);

		if (partnership) {
			await ctx.db.patch(partnership._id, { isActive: false });
		}
	},
});
