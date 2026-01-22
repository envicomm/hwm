import { v } from "convex/values";
import { qrMode } from "../schema/validators";
import { protectedMutation } from "../lib/customFunctions";
import { requirePermission } from "../lib/permissions";
import { requireGeneratorAccess } from "../lib/dataScoping";

/**
 * Create a new generator
 * Requires: treater org type + generator.create permission (owner/admin)
 *
 * BREAKING CHANGE: treaterId argument removed - now inferred from user context
 */
export const create = protectedMutation({
	args: {
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
		const { user, audit } = ctx;

		// Only treaters can create generators
		if (user.orgType !== "treater" || !user.treaterId) {
			throw new Error("Only treaters can create generators");
		}

		// Check permission (owner/admin can create)
		requirePermission(user.orgRole, "generator", "create");

		const now = Date.now();

		const generatorId = await ctx.db.insert("generators", {
			treaterId: user.treaterId,
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

		// Audit log
		await audit("generator.created", "generators", generatorId, {
			name: args.name,
			treaterId: user.treaterId,
		});

		return generatorId;
	},
});

/**
 * Update a generator
 * Requires: access to generator + generator.update permission (owner/admin)
 */
export const update = protectedMutation({
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
		const { user, audit } = ctx;

		// Check access (treater owns it OR it's the user's generator)
		await requireGeneratorAccess(ctx, user, args.generatorId);

		// Check permission (owner/admin can update)
		requirePermission(user.orgRole, "generator", "update");

		const { generatorId, ...updates } = args;

		await ctx.db.patch(generatorId, {
			...updates,
			updatedAt: Date.now(),
		});

		// Audit log
		await audit("generator.updated", "generators", generatorId, {
			updatedFields: Object.keys(updates),
		});

		return generatorId;
	},
});

/**
 * Soft delete a generator
 * Requires: access to generator + generator.delete permission (owner only)
 */
export const remove = protectedMutation({
	args: {
		generatorId: v.id("generators"),
	},
	handler: async (ctx, args) => {
		const { user, audit } = ctx;

		// Check access
		await requireGeneratorAccess(ctx, user, args.generatorId);

		// Check permission (owner only can delete)
		requirePermission(user.orgRole, "generator", "delete");

		// Get generator name for audit log before soft delete
		const generator = await ctx.db.get(args.generatorId);

		await ctx.db.patch(args.generatorId, {
			isActive: false,
			updatedAt: Date.now(),
		});

		// Audit log
		await audit("generator.deleted", "generators", args.generatorId, {
			name: generator?.name,
		});
	},
});
