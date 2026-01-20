import { v } from "convex/values";
import { action, query } from "../_generated/server";

// Action to verify admin credentials against environment variables
export const verifyAdminCredentials = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (_ctx, args) => {
    // Get admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Check if environment variables are configured
    if (!adminEmail || !adminPassword) {
      console.error(
        "Admin credentials not configured in environment variables"
      );
      return {
        success: false,
        error: "Server configuration error. Please contact support.",
      };
    }

    // Validate credentials
    if (args.email === adminEmail && args.password === adminPassword) {
      return {
        success: true,
        user: {
          username: adminEmail,
          role: "admin",
        },
      };
    }

    return {
      success: false,
      error: "User account not found.",
    };
  },
});

// Get user by email and return with their organization details
export const getUserByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      return null;
    }

    // If user is a treater, fetch the treater organization details
    if (user.role === "treater" && user.treaterId) {
      const treater = await ctx.db.get(user.treaterId);
      return {
        ...user,
        treaterName: treater?.name || "Unknown Facility",
      };
    }

    // If user is a generator, fetch the generator organization details
    if (user.role === "generator" && user.generatorId) {
      const generator = await ctx.db.get(user.generatorId);
      return {
        ...user,
        generatorName: generator?.name || "Unknown Facility",
      };
    }

    // If user is a hauler/driver, fetch the hauler organization details
    if ((user.role === "hauler" || user.role === "driver") && user.haulerId) {
      const hauler = await ctx.db.get(user.haulerId);
      return {
        ...user,
        haulerName: hauler?.name || "Unknown Company",
      };
    }

    return user;
  },
});
