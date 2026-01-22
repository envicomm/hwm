import { defineTable } from "convex/server";
import { v } from "convex/values";
import { organizationType } from "./organizationLinks";

/**
 * Audit log table for compliance tracking and security monitoring.
 * Captures who/what/when/where for sensitive actions across the platform.
 *
 * Use cases:
 * - DENR Philippines compliance reporting
 * - Security incident investigation
 * - User activity monitoring
 * - Change history tracking
 */
export const auditLogs = defineTable({
	// What happened
	event: v.string(), // e.g., "team.member_invited", "generator.created"

	// Who did it
	actorId: v.string(), // Better Auth user ID
	actorEmail: v.string(),
	actorName: v.optional(v.string()),

	// Where (organization context)
	organizationId: v.string(), // Better Auth org ID
	organizationType: organizationType,

	// What was affected
	resourceType: v.string(), // Table name: "generators", "haulers", "users"
	resourceId: v.optional(v.string()), // ID of affected resource

	// Additional context
	metadata: v.optional(v.any()), // Event-specific details

	// When
	timestamp: v.number(),
})
	.index("by_organization", ["organizationId", "timestamp"])
	.index("by_actor", ["actorId", "timestamp"])
	.index("by_resource", ["resourceType", "resourceId"])
	.index("by_event", ["event", "timestamp"]);
