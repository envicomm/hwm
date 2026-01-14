import { v } from "convex/values";
import { action } from "../_generated/server";

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
