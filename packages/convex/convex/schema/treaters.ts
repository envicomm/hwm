import { defineTable } from "convex/server";
import { v } from "convex/values";

// Treaters - Primary tenants (Treatment Facilities)
export const treaters = defineTable({
	name: v.string(),
	address: v.string(),
	contactEmail: v.string(),
	contactPhone: v.string(),
	licenseNumber: v.optional(v.string()),
	isActive: v.boolean(),
	createdAt: v.number(),
	updatedAt: v.number(),
}).index("by_active", ["isActive"]);
