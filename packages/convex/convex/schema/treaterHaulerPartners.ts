import { defineTable } from "convex/server";
import { v } from "convex/values";

// Treater-Hauler partnerships (many-to-many)
export const treaterHaulerPartners = defineTable({
	treaterId: v.id("treaters"),
	haulerId: v.id("haulers"),
	isActive: v.boolean(),
	createdAt: v.number(),
})
	.index("by_treater", ["treaterId"])
	.index("by_hauler", ["haulerId"])
	.index("by_treater_active", ["treaterId", "isActive"]);
