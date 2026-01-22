import { v } from "convex/values";
import { protectedMutation } from "../lib/customFunctions";
import { requirePermission } from "../lib/permissions";
import { requireHaulerAccess } from "../lib/dataScoping";

/**
 * Create a new hauler (and partnership with treater)
 * Requires: treater org type + hauler.create permission (owner/admin)
 */
export const create = protectedMutation({
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
		const { user, audit } = ctx;

		// Only treaters can create haulers
		if (user.orgType !== "treater" || !user.treaterId) {
			throw new Error("Only treaters can create haulers");
		}

		// Check permission (owner/admin can create)
		requirePermission(user.orgRole, "hauler", "create");

		const now = Date.now();

		// Create hauler
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

		// Create treater-hauler partnership atomically
		await ctx.db.insert("treaterHaulerPartners", {
			treaterId: user.treaterId,
			haulerId: haulerId,
			isActive: true,
			createdAt: now,
		});

		// Audit log
		await audit("hauler.created", "haulers", haulerId, {
			name: args.name,
			treaterId: user.treaterId,
		});

		return haulerId;
	},
});

/**
 * Create a treater-hauler partnership
 * Only treaters can create partnerships with haulers
 * Requires: hauler.create permission (owner/admin)
 */
export const createPartnership = protectedMutation({
	args: {
		haulerId: v.id("haulers"),
	},
	handler: async (ctx, args) => {
		const { user, audit } = ctx;

		// Only treaters can create partnerships
		if (user.orgType !== "treater" || !user.treaterId) {
			throw new Error("Only treaters can create hauler partnerships");
		}

		// Check permission (owner/admin can create partnerships)
		requirePermission(user.orgRole, "hauler", "create");

		const now = Date.now();

		// Check if partnership already exists
		const existing = await ctx.db
			.query("treaterHaulerPartners")
			.withIndex("by_treater", (q) => q.eq("treaterId", user.treaterId!))
			.collect();

		const existingPartnership = existing.find(
			(p) => p.haulerId === args.haulerId
		);

		if (existingPartnership) {
			// Reactivate if inactive
			if (!existingPartnership.isActive) {
				await ctx.db.patch(existingPartnership._id, { isActive: true });

				// Audit log for reactivation
				await audit(
					"hauler.partnership_reactivated",
					"treaterHaulerPartners",
					existingPartnership._id,
					{
						haulerId: args.haulerId,
						treaterId: user.treaterId,
					}
				);
			}
			return existingPartnership._id;
		}

		// Create new partnership
		const partnershipId = await ctx.db.insert("treaterHaulerPartners", {
			treaterId: user.treaterId,
			haulerId: args.haulerId,
			isActive: true,
			createdAt: now,
		});

		// Audit log
		await audit(
			"hauler.partnership_created",
			"treaterHaulerPartners",
			partnershipId,
			{
				haulerId: args.haulerId,
				treaterId: user.treaterId,
			}
		);

		return partnershipId;
	},
});

/**
 * Update a hauler
 * Requires: access to hauler + hauler.update permission (owner/admin)
 */
export const update = protectedMutation({
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
		const { user, audit } = ctx;

		// Check access (treater has partnership OR it's the user's hauler)
		await requireHaulerAccess(ctx, user, args.haulerId);

		// Check permission (owner/admin can update)
		requirePermission(user.orgRole, "hauler", "update");

		const { haulerId, ...updates } = args;

		await ctx.db.patch(haulerId, {
			...updates,
			updatedAt: Date.now(),
		});

		// Audit log
		await audit("hauler.updated", "haulers", haulerId, {
			updatedFields: Object.keys(updates),
		});

		return haulerId;
	},
});

/**
 * Soft delete a hauler
 * Requires: access to hauler + hauler.delete permission (owner only)
 */
export const remove = protectedMutation({
	args: {
		haulerId: v.id("haulers"),
	},
	handler: async (ctx, args) => {
		const { user, audit } = ctx;

		// Check access
		await requireHaulerAccess(ctx, user, args.haulerId);

		// Check permission (owner only can delete)
		requirePermission(user.orgRole, "hauler", "delete");

		// Get hauler name for audit log before soft delete
		const hauler = await ctx.db.get(args.haulerId);

		await ctx.db.patch(args.haulerId, {
			isActive: false,
			updatedAt: Date.now(),
		});

		// Also deactivate any partnerships if treater is deleting
		if (user.orgType === "treater" && user.treaterId) {
			const partnerships = await ctx.db
				.query("treaterHaulerPartners")
				.withIndex("by_treater", (q) => q.eq("treaterId", user.treaterId!))
				.filter((q) => q.eq(q.field("haulerId"), args.haulerId))
				.collect();

			for (const partnership of partnerships) {
				await ctx.db.patch(partnership._id, {
					isActive: false,
				});
			}
		}

		// Audit log
		await audit("hauler.deleted", "haulers", args.haulerId, {
			name: hauler?.name,
		});
	},
});

/**
 * Remove treater-hauler partnership
 * Only treaters can remove partnerships
 * Requires: hauler.delete permission (owner only)
 */
export const removePartnership = protectedMutation({
	args: {
		haulerId: v.id("haulers"),
	},
	handler: async (ctx, args) => {
		const { user, audit } = ctx;

		// Only treaters can remove partnerships
		if (user.orgType !== "treater" || !user.treaterId) {
			throw new Error("Only treaters can remove hauler partnerships");
		}

		// Check permission (owner only can remove partnerships)
		requirePermission(user.orgRole, "hauler", "delete");

		const partnerships = await ctx.db
			.query("treaterHaulerPartners")
			.withIndex("by_treater", (q) => q.eq("treaterId", user.treaterId!))
			.collect();

		const partnership = partnerships.find((p) => p.haulerId === args.haulerId);

		if (partnership) {
			await ctx.db.patch(partnership._id, { isActive: false });

			// Audit log
			await audit(
				"hauler.partnership_removed",
				"treaterHaulerPartners",
				partnership._id,
				{
					haulerId: args.haulerId,
					treaterId: user.treaterId,
				}
			);
		}
	},
});
