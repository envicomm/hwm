import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { authComponent, createAuth } from "../auth";
import { getBetterAuthOrgFromEntity } from "../organizations/helpers";
import type { Id } from "../_generated/dataModel";

/**
 * Invite a user to a generator organization.
 * Can be called by treater admins to invite generator staff.
 *
 * The invitation triggers Better Auth's sendInvitationEmail callback,
 * which routes to the generator app URL based on organization type.
 */
export const inviteToGenerator = mutation({
	args: {
		generatorId: v.id("generators"),
		email: v.string(),
		role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
	},
	handler: async (ctx, args) => {
		// 1. Get auth context for Better Auth API calls
		const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

		// 2. Verify generator exists
		const generator = await ctx.db.get(args.generatorId);
		if (!generator) {
			throw new ConvexError({
				message: "Generator not found",
				generatorId: args.generatorId,
			});
		}

		// 3. Get Better Auth organization ID for this generator
		const orgLink = await getBetterAuthOrgFromEntity(
			ctx,
			"generator",
			args.generatorId
		);

		// 4. Create invitation via Better Auth API
		// This triggers the sendInvitationEmail callback in auth.ts
		const invitation = await auth.api.createInvitation({
			body: {
				email: args.email,
				role: args.role,
				organizationId: orgLink.betterAuthOrgId,
			},
			headers,
		});

		if (!invitation) {
			throw new ConvexError("Failed to create invitation");
		}

		return {
			invitationId: invitation.id,
			email: args.email,
			role: args.role,
			expiresAt: invitation.expiresAt,
			generatorName: generator.name,
		};
	},
});

/**
 * Invite a user to a hauler organization.
 * Can be called by treater admins to invite hauler staff.
 *
 * The invitation triggers Better Auth's sendInvitationEmail callback,
 * which routes to the trucking app URL based on organization type.
 */
export const inviteToHauler = mutation({
	args: {
		haulerId: v.id("haulers"),
		email: v.string(),
		role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
	},
	handler: async (ctx, args) => {
		// 1. Get auth context for Better Auth API calls
		const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

		// 2. Verify hauler exists
		const hauler = await ctx.db.get(args.haulerId);
		if (!hauler) {
			throw new ConvexError({
				message: "Hauler not found",
				haulerId: args.haulerId,
			});
		}

		// 3. Get Better Auth organization ID for this hauler
		const orgLink = await getBetterAuthOrgFromEntity(
			ctx,
			"hauler",
			args.haulerId
		);

		// 4. Create invitation via Better Auth API
		const invitation = await auth.api.createInvitation({
			body: {
				email: args.email,
				role: args.role,
				organizationId: orgLink.betterAuthOrgId,
			},
			headers,
		});

		if (!invitation) {
			throw new ConvexError("Failed to create invitation");
		}

		return {
			invitationId: invitation.id,
			email: args.email,
			role: args.role,
			expiresAt: invitation.expiresAt,
			haulerName: hauler.name,
		};
	},
});

/**
 * Invite a user to a treater organization.
 * Can be called by treater owners/admins to invite treater staff.
 *
 * The invitation triggers Better Auth's sendInvitationEmail callback,
 * which routes to the treater app URL (siteUrl).
 */
export const inviteToTreater = mutation({
	args: {
		treaterId: v.id("treaters"),
		email: v.string(),
		role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
	},
	handler: async (ctx, args) => {
		// 1. Get auth context
		const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

		// 2. Verify treater exists
		const treater = await ctx.db.get(args.treaterId);
		if (!treater) {
			throw new ConvexError({
				message: "Treater not found",
				treaterId: args.treaterId,
			});
		}

		// 3. Get Better Auth organization ID
		const orgLink = await getBetterAuthOrgFromEntity(
			ctx,
			"treater",
			args.treaterId
		);

		// 4. Create invitation
		const invitation = await auth.api.createInvitation({
			body: {
				email: args.email,
				role: args.role,
				organizationId: orgLink.betterAuthOrgId,
			},
			headers,
		});

		if (!invitation) {
			throw new ConvexError("Failed to create invitation");
		}

		return {
			invitationId: invitation.id,
			email: args.email,
			role: args.role,
			expiresAt: invitation.expiresAt,
			treaterName: treater.name,
		};
	},
});

/**
 * Create domain user record after invitation acceptance.
 * Called after Better Auth acceptInvitation succeeds.
 *
 * This links the Better Auth user to the domain users table with
 * the correct organization (generator, hauler, or treater).
 */
export const createDomainUserFromInvitation = mutation({
	args: {
		betterAuthUserId: v.string(),
		betterAuthOrgId: v.string(),
		name: v.string(),
		email: v.string(),
	},
	handler: async (ctx, args) => {
		// 1. Check if domain user already exists
		const existingUser = await ctx.db
			.query("users")
			.withIndex("by_better_auth_user", (q) =>
				q.eq("betterAuthUserId", args.betterAuthUserId)
			)
			.first();

		if (existingUser) {
			// User already exists - this might be joining additional org
			// For Phase 4, we assume one user = one org, so just return existing
			return { userId: existingUser._id, created: false };
		}

		// 2. Get organization link to determine org type and entity ID
		const orgLink = await ctx.db
			.query("organizationLinks")
			.withIndex("by_better_auth_org", (q) =>
				q.eq("betterAuthOrgId", args.betterAuthOrgId)
			)
			.first();

		if (!orgLink) {
			throw new ConvexError({
				message: "Organization link not found",
				betterAuthOrgId: args.betterAuthOrgId,
			});
		}

		// 3. Determine domain role from organization type
		// Using inline union type (not importing userRole validator - it's for schema validation)
		let domainRole: "generator" | "treater" | "hauler" | "driver" | "admin";
		let orgFields: {
			treaterId?: Id<"treaters">;
			generatorId?: Id<"generators">;
			haulerId?: Id<"haulers">;
		} = {};

		switch (orgLink.organizationType) {
			case "generator":
				domainRole = "generator";
				orgFields = { generatorId: orgLink.generatorId };
				break;
			case "hauler":
				domainRole = "hauler";
				orgFields = { haulerId: orgLink.haulerId };
				break;
			case "treater":
				domainRole = "treater";
				orgFields = { treaterId: orgLink.treaterId };
				break;
			default:
				throw new ConvexError({
					message: "Unknown organization type",
					organizationType: orgLink.organizationType,
				});
		}

		// 4. Create domain user record
		const now = Date.now();
		const userId = await ctx.db.insert("users", {
			name: args.name,
			email: args.email,
			betterAuthUserId: args.betterAuthUserId,
			role: domainRole,
			...orgFields,
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});

		return { userId, created: true };
	},
});
