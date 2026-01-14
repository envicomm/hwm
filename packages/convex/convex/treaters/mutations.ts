import { v } from "convex/values";
import { mutation } from "../_generated/server";

// Create a new treater account
// This creates the treater organization in the database
export const createAccount = mutation({
	args: {
		facilityName: v.string(),
		facilityAddress: v.string(),
		contactEmail: v.string(),
		contactPhone: v.string(),
	},
	handler: async (ctx, args) => {
		const now = Date.now();

		// Create the treater organization
		const treaterId = await ctx.db.insert("treaters", {
			name: args.facilityName,
			address: args.facilityAddress,
			contactEmail: args.contactEmail,
			contactPhone: args.contactPhone,
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});

		// TODO: Create the admin user account with better-auth
		// This would involve:
		// 1. Creating the user in better-auth
		// 2. Creating the organization in better-auth
		// 3. Linking the organization to the treater via organizationLinks table

		return treaterId;
	},
});
