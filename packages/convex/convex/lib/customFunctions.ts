import {
	customQuery,
	customMutation,
	customCtx,
} from "convex-helpers/server/customFunctions";
import { query, mutation } from "../_generated/server";
import {
	resolveUserContext,
	requireUserContext,
	type UserContext,
} from "./userContext";
import { createAuditLogger, type AuditLogger } from "./audit";

/**
 * Protected query - injects user context into handler
 * Throws UNAUTHORIZED if user is not authenticated
 *
 * Usage:
 * export const myQuery = protectedQuery({
 *   args: { ... },
 *   handler: async (ctx, args) => {
 *     // ctx.user is available with full UserContext
 *     if (ctx.user.orgType !== "treater") {
 *       throw new ConvexError("Only treaters can access this");
 *     }
 *     return ctx.db.query("generators")...
 *   },
 * });
 */
export const protectedQuery = customQuery(
	query,
	customCtx(async (ctx) => {
		const user = await requireUserContext(ctx);
		return { user };
	})
);

/**
 * Protected mutation - injects user context and audit logger into handler
 * Throws UNAUTHORIZED if user is not authenticated
 *
 * Usage:
 * export const myMutation = protectedMutation({
 *   args: { ... },
 *   handler: async (ctx, args) => {
 *     // ctx.user is available with full UserContext
 *     // ctx.audit is available for logging sensitive actions
 *     requirePermission(ctx.user.orgRole, "generator", "create");
 *     const generatorId = await ctx.db.insert("generators", ...);
 *     await ctx.audit("generator.created", "generators", generatorId);
 *     return generatorId;
 *   },
 * });
 */
export const protectedMutation = customMutation(
	mutation,
	customCtx(async (ctx) => {
		const user = await requireUserContext(ctx);
		const audit = createAuditLogger(ctx, user);
		return { user, audit };
	})
);

/**
 * Optional auth query - injects user context if authenticated, null otherwise
 * Does NOT throw for unauthenticated requests
 *
 * Usage:
 * export const publicQuery = optionalAuthQuery({
 *   args: { ... },
 *   handler: async (ctx, args) => {
 *     if (ctx.user) {
 *       // Authenticated path
 *     } else {
 *       // Public path
 *     }
 *   },
 * });
 */
export const optionalAuthQuery = customQuery(
	query,
	customCtx(async (ctx) => {
		const user = await resolveUserContext(ctx);
		return { user };
	})
);

/**
 * Optional auth mutation - injects user context if authenticated, null otherwise
 * Does NOT throw for unauthenticated requests
 *
 * Usage:
 * export const publicMutation = optionalAuthMutation({
 *   args: { ... },
 *   handler: async (ctx, args) => {
 *     if (ctx.user) {
 *       // Authenticated path
 *     } else {
 *       // Public path
 *     }
 *   },
 * });
 */
export const optionalAuthMutation = customMutation(
	mutation,
	customCtx(async (ctx) => {
		const user = await resolveUserContext(ctx);
		return { user };
	})
);

// Re-export types for convenience
export type { UserContext, AuditLogger };
