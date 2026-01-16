import { v } from "convex/values";
import { mutation } from "../_generated/server";

// Create a treater user (admin of a treatment facility)
export const createTreaterUser = mutation({
	args: {
		name: v.string(),
		email: v.string(),
		phone: v.optional(v.string()),
		treaterId: v.id("treaters"),
	},
	handler: async (ctx, args) => {
		const now = Date.now();

		// Check if user with this email already exists
		const existingUser = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", args.email))
			.first();

		if (existingUser) {
			// Update existing user to link to treater
			await ctx.db.patch(existingUser._id, {
				treaterId: args.treaterId,
				role: "treater",
				updatedAt: now,
			});
			return existingUser._id;
		}

		// Create new user linked to the treater
		const userId = await ctx.db.insert("users", {
			name: args.name,
			email: args.email,
			phone: args.phone,
			role: "treater",
			treaterId: args.treaterId,
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});

		return userId;
	},
});
