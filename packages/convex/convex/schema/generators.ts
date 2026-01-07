import { defineTable } from "convex/server";
import { v } from "convex/values";

// Generators - Hospitals that belong to a Treater
export const generators = defineTable({
	treaterId: v.id("treaters"),
	name: v.string(),
	address: v.string(),
	contactEmail: v.string(),
	contactPhone: v.string(),
	facilityCode: v.optional(v.string()),
	isActive: v.boolean(),
	createdAt: v.number(),
	updatedAt: v.number(),
})
	.index("by_treater", ["treaterId"])
	.index("by_treater_active", ["treaterId", "isActive"]);
