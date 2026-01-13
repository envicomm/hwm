import { v } from "convex/values";
import { query } from "../_generated/server";

// Get latest collections (for development/testing)
export const getLatest = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const collectionRequests = await ctx.db
      .query("collectionRequests")
      .order("desc")
      .take(args.limit ?? 11);

    return collectionRequests;
  },
});
