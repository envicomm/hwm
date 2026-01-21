import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { authComponent, createAuth } from "../auth";
import { getBetterAuthOrgFromEntity } from "../organizations/helpers";

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
