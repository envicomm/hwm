import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { qrMode } from "../schema/validators";
import { requireTreaterAccess, requireGeneratorAccess } from "../lib/auth";

// Create a new generator (Convex entity only)
// The organization creation and invitations should be handled client-side
// Only treaters can create generators under their organization
export const create = mutation({
	args: {
		treaterId: v.id("treaters"),
		name: v.string(),
		address: v.string(),
		contactEmail: v.string(),
		contactPhone: v.string(),
		facilityCode: v.optional(v.string()),
		qrMode: qrMode,
		maxStorageCapacityKg: v.optional(v.number()),
		maxBagCount: v.optional(v.number()),
		storageAlertThreshold: v.optional(v.number()),
		location: v.optional(
			v.object({
				lat: v.number(),
				lng: v.number(),
			})
		),
	},
	handler: async (ctx, args) => {
		// Verify user has access to this treater organization
		await requireTreaterAccess(ctx, args.treaterId);

		const now = Date.now();

		const generatorId = await ctx.db.insert("generators", {
			treaterId: args.treaterId,
			name: args.name,
			address: args.address,
			contactEmail: args.contactEmail,
			contactPhone: args.contactPhone,
			facilityCode: args.facilityCode,
			qrMode: args.qrMode,
			maxStorageCapacityKg: args.maxStorageCapacityKg,
			maxBagCount: args.maxBagCount,
			storageAlertThreshold: args.storageAlertThreshold,
			location: args.location,
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});

		return generatorId;
	},
});

// Update a generator
// Requires access to the generator (either as generator member or parent treater)
export const update = mutation({
	args: {
		generatorId: v.id("generators"),
		name: v.optional(v.string()),
		address: v.optional(v.string()),
		contactEmail: v.optional(v.string()),
		contactPhone: v.optional(v.string()),
		facilityCode: v.optional(v.string()),
		qrMode: v.optional(qrMode),
		maxStorageCapacityKg: v.optional(v.number()),
		maxBagCount: v.optional(v.number()),
		storageAlertThreshold: v.optional(v.number()),
		location: v.optional(
			v.object({
				lat: v.number(),
				lng: v.number(),
			})
		),
		isActive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		// Verify user has access to this generator
		await requireGeneratorAccess(ctx, args.generatorId);

		const { generatorId, ...updates } = args;

		await ctx.db.patch(generatorId, {
			...updates,
			updatedAt: Date.now(),
		});

		return generatorId;
	},
});

// Soft delete a generator
// Requires access to the generator (either as generator member or parent treater)
export const remove = mutation({
	args: {
		generatorId: v.id("generators"),
	},
	handler: async (ctx, args) => {
		// Verify user has access to this generator
		await requireGeneratorAccess(ctx, args.generatorId);

		await ctx.db.patch(args.generatorId, {
			isActive: false,
			updatedAt: Date.now(),
		});
	},
});
