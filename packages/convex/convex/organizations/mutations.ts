import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { authComponent, createAuth } from "../auth";
import { makeOrgLinkData, getBetterAuthOrgFromEntity } from "./helpers";
import { qrMode } from "../schema/validators";

/**
 * Create a treater (treatment facility) with its Better Auth organization and link
 *
 * This is an atomic operation that:
 * 1. Creates a Better Auth organization
 * 2. Creates the treater domain entity
 * 3. Creates the bridge link between them
 *
 * All three steps succeed together or all fail together (within Convex transaction).
 *
 * NOTE: Better Auth org creation happens over HTTP before Convex writes.
 * If Convex writes fail after Better Auth org is created, an orphaned Better Auth
 * organization will exist. This is acceptable for MVP. A cleanup job can be added
 * later to detect and remove orphaned Better Auth orgs.
 */
export const createTreaterWithOrganization = mutation({
	args: {
		name: v.string(),
		address: v.string(),
		contactEmail: v.string(),
		contactPhone: v.string(),
		licenseNumber: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// 1. Get auth context for calling Better Auth API
		const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

		// 2. Generate URL-safe slug from name
		const slug = args.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

		// 3. Create Better Auth organization with treater metadata
		const orgResult = await auth.api.createOrganization({
			body: {
				name: args.name,
				slug,
				metadata: { organizationType: "treater" },
			},
			headers,
		});

		if (!orgResult) {
			throw new ConvexError({
				message: "Failed to create Better Auth organization",
				name: args.name,
			});
		}

		// 4. Create treater domain entity (Convex)
		const now = Date.now();
		const treaterId = await ctx.db.insert("treaters", {
			name: args.name,
			address: args.address,
			contactEmail: args.contactEmail,
			contactPhone: args.contactPhone,
			licenseNumber: args.licenseNumber,
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});

		// 5. Create organization link (Convex)
		// Treaters are top-level organizations, so no parentBetterAuthOrgId
		const linkData = makeOrgLinkData("treater", treaterId, orgResult.id);
		await ctx.db.insert("organizationLinks", linkData);

		return {
			treaterId,
			betterAuthOrgId: orgResult.id,
		};
	},
});

/**
 * Create a generator (hospital) with its Better Auth organization and link
 *
 * This is an atomic operation that:
 * 1. Creates a Better Auth organization with parent reference
 * 2. Creates the generator domain entity
 * 3. Creates the bridge link with parentBetterAuthOrgId
 *
 * The generator is created as a child organization of the treater.
 */
export const createGeneratorWithOrganization = mutation({
	args: {
		treaterId: v.id("treaters"),
		name: v.string(),
		address: v.string(),
		contactEmail: v.string(),
		contactPhone: v.string(),
		facilityCode: v.optional(v.string()),
		qrMode: qrMode,
	},
	handler: async (ctx, args) => {
		// 1. Get auth context for calling Better Auth API
		const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

		// 2. Get parent treater's Better Auth org ID for hierarchy tracking
		const parentLink = await getBetterAuthOrgFromEntity(
			ctx,
			"treater",
			args.treaterId
		);

		// 3. Generate URL-safe slug from name
		const slug = args.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

		// 4. Create Better Auth organization with parent reference in metadata
		const orgResult = await auth.api.createOrganization({
			body: {
				name: args.name,
				slug,
				metadata: {
					organizationType: "generator",
					parentTreaterId: args.treaterId,
				},
			},
			headers,
		});

		if (!orgResult) {
			throw new ConvexError({
				message: "Failed to create Better Auth organization",
				name: args.name,
			});
		}

		// 5. Create generator domain entity (Convex)
		const now = Date.now();
		const generatorId = await ctx.db.insert("generators", {
			treaterId: args.treaterId,
			name: args.name,
			address: args.address,
			contactEmail: args.contactEmail,
			contactPhone: args.contactPhone,
			facilityCode: args.facilityCode,
			qrMode: args.qrMode,
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});

		// 6. Create organization link with parent reference (Convex)
		const linkData = makeOrgLinkData(
			"generator",
			generatorId,
			orgResult.id,
			parentLink.betterAuthOrgId
		);
		await ctx.db.insert("organizationLinks", linkData);

		return {
			generatorId,
			betterAuthOrgId: orgResult.id,
		};
	},
});

/**
 * Create a hauler (trucking company) with its Better Auth organization and link
 *
 * This is an atomic operation that:
 * 1. Creates a Better Auth organization with parent reference
 * 2. Creates the hauler domain entity
 * 3. Creates the bridge link with parentBetterAuthOrgId
 * 4. Creates the treater-hauler partnership record
 *
 * The hauler is created as a child organization of the treater.
 * Note: Haulers table doesn't have treaterId field; the relationship
 * is established via treaterHaulerPartners table.
 */
export const createHaulerWithOrganization = mutation({
	args: {
		treaterId: v.id("treaters"),
		name: v.string(),
		address: v.string(),
		contactEmail: v.string(),
		contactPhone: v.string(),
		licenseNumber: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// 1. Get auth context for calling Better Auth API
		const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

		// 2. Get parent treater's Better Auth org ID for hierarchy tracking
		const parentLink = await getBetterAuthOrgFromEntity(
			ctx,
			"treater",
			args.treaterId
		);

		// 3. Generate URL-safe slug from name
		const slug = args.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

		// 4. Create Better Auth organization with parent reference in metadata
		const orgResult = await auth.api.createOrganization({
			body: {
				name: args.name,
				slug,
				metadata: {
					organizationType: "hauler",
					parentTreaterId: args.treaterId,
				},
			},
			headers,
		});

		if (!orgResult) {
			throw new ConvexError({
				message: "Failed to create Better Auth organization",
				name: args.name,
			});
		}

		// 5. Create hauler domain entity (Convex)
		const now = Date.now();
		const haulerId = await ctx.db.insert("haulers", {
			name: args.name,
			address: args.address,
			contactEmail: args.contactEmail,
			contactPhone: args.contactPhone,
			licenseNumber: args.licenseNumber,
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});

		// 6. Create organization link with parent reference (Convex)
		const linkData = makeOrgLinkData(
			"hauler",
			haulerId,
			orgResult.id,
			parentLink.betterAuthOrgId
		);
		await ctx.db.insert("organizationLinks", linkData);

		// 7. Create treater-hauler partnership record
		await ctx.db.insert("treaterHaulerPartners", {
			treaterId: args.treaterId,
			haulerId,
			isActive: true,
			createdAt: now,
		});

		return {
			haulerId,
			betterAuthOrgId: orgResult.id,
		};
	},
});
