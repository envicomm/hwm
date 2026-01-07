import { defineTable } from "convex/server";
import { v } from "convex/values";
import { userRole } from "./validators";

// Users across all organizations
export const users = defineTable({
	name: v.string(),
	email: v.string(),
	phone: v.optional(v.string()),
	role: userRole,

	// Organization references (one will be set based on role)
	treaterId: v.optional(v.id("treaters")),
	generatorId: v.optional(v.id("generators")),
	haulerId: v.optional(v.id("haulers")),

	isActive: v.boolean(),
	createdAt: v.number(),
	updatedAt: v.number(),
})
	.index("by_email", ["email"])
	.index("by_treater", ["treaterId"])
	.index("by_generator", ["generatorId"])
	.index("by_hauler", ["haulerId"])
	.index("by_role", ["role"]);
