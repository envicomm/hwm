import type { MutationCtx } from "../_generated/server";
import type { UserContext } from "./userContext";

/**
 * Audit event types - categorized by domain
 * Format: {domain}.{action}
 */
export type AuditEvent =
	// Team/member events
	| "team.member_invited"
	| "team.member_removed"
	| "team.role_changed"
	// Generator events
	| "generator.created"
	| "generator.updated"
	| "generator.deleted"
	// Hauler events
	| "hauler.created"
	| "hauler.updated"
	| "hauler.deleted"
	| "hauler.partnership_created"
	| "hauler.partnership_reactivated"
	| "hauler.partnership_removed"
	// Waste bag events
	| "wasteBag.created"
	| "wasteBag.status_changed"
	| "wasteBag.deleted"
	// Treatment events
	| "treatment.started"
	| "treatment.completed"
	// Disposal events
	| "disposal.batch_created"
	| "disposal.completed"
	// Organization events
	| "organization.settings_updated";

/**
 * Audit logger bound to user context
 * Call this in mutations to log sensitive actions
 */
export type AuditLogger = (
	event: AuditEvent,
	resourceType: string,
	resourceId?: string,
	metadata?: Record<string, unknown>
) => Promise<void>;

/**
 * Create an audit logger bound to user context and mutation context
 *
 * Usage in mutation:
 * const audit = createAuditLogger(ctx, ctx.user);
 * await audit("generator.created", "generators", generatorId);
 */
export function createAuditLogger(
	ctx: MutationCtx,
	user: UserContext
): AuditLogger {
	return async function log(
		event: AuditEvent,
		resourceType: string,
		resourceId?: string,
		metadata?: Record<string, unknown>
	): Promise<void> {
		await ctx.db.insert("auditLogs", {
			event,
			actorId: user.userId,
			actorEmail: user.email,
			actorName: user.name,
			organizationId: user.orgId,
			organizationType: user.orgType,
			resourceType,
			resourceId,
			metadata,
			timestamp: Date.now(),
		});
	};
}
