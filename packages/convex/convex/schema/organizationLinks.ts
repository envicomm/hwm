import { defineTable } from "convex/server";
import { v } from "convex/values";

// Organization type validator
export const organizationType = v.union(
	v.literal("treater"),
	v.literal("generator"),
	v.literal("hauler")
);

// Maps better-auth organizations to Convex entities
// This table links the generic better-auth organization to specific domain entities
export const organizationLinks = defineTable({
	// Better-auth organization ID
	betterAuthOrgId: v.string(),

	// Type of organization
	organizationType: organizationType,

	// References to Convex entities (one will be set based on type)
	treaterId: v.optional(v.id("treaters")),
	generatorId: v.optional(v.id("generators")),
	haulerId: v.optional(v.id("haulers")),

	// Parent organization hierarchy (for generators/haulers under a treater)
	// Undefined for treaters (top-level), contains parent treater's betterAuthOrgId for child orgs
	parentBetterAuthOrgId: v.optional(v.string()),

	createdAt: v.number(),
})
	.index("by_better_auth_org", ["betterAuthOrgId"])
	.index("by_treater", ["treaterId"])
	.index("by_generator", ["generatorId"])
	.index("by_hauler", ["haulerId"])
	.index("by_parent_org", ["parentBetterAuthOrgId"]);
