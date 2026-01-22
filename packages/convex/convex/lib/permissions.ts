import { ConvexError } from "convex/values";

/**
 * Organization roles from Better Auth
 * - owner: Full access, can delete org, manage billing
 * - admin: Can manage most settings, invite/remove members
 * - member: Basic access, can view and perform daily operations
 */
export type OrgRole = "owner" | "admin" | "member";

/**
 * Permission resource-action matrix
 * Maps resource -> action -> allowed org roles
 *
 * This is the single source of truth for authorization decisions.
 * All permission checks flow through this matrix.
 */
export const PERMISSIONS = {
	// Organization settings & billing
	organization: {
		update: ["owner", "admin"] as OrgRole[],
		delete: ["owner"] as OrgRole[],
		manageBilling: ["owner"] as OrgRole[],
	},
	// Team/member management
	team: {
		invite: ["owner", "admin"] as OrgRole[],
		remove: ["owner", "admin"] as OrgRole[],
		updateRole: ["owner", "admin"] as OrgRole[],
		listMembers: ["owner", "admin", "member"] as OrgRole[],
	},
	// Generator management (by treaters)
	generator: {
		create: ["owner", "admin"] as OrgRole[], // Treaters create generators
		update: ["owner", "admin"] as OrgRole[],
		delete: ["owner"] as OrgRole[],
		view: ["owner", "admin", "member"] as OrgRole[],
	},
	// Hauler management (by treaters)
	hauler: {
		create: ["owner", "admin"] as OrgRole[],
		update: ["owner", "admin"] as OrgRole[],
		delete: ["owner"] as OrgRole[],
		view: ["owner", "admin", "member"] as OrgRole[],
	},
	// Waste bag operations
	wasteBag: {
		create: ["owner", "admin", "member"] as OrgRole[], // Any member can create
		update: ["owner", "admin"] as OrgRole[],
		delete: ["owner"] as OrgRole[],
		view: ["owner", "admin", "member"] as OrgRole[],
	},
} as const;

// Type for valid resources
export type PermissionResource = keyof typeof PERMISSIONS;

// Type for actions on a resource
export type PermissionAction<R extends PermissionResource> =
	keyof (typeof PERMISSIONS)[R];

/**
 * Check if a user with given org role has permission for an action
 *
 * @param orgRole - The user's role in the organization
 * @param resource - The resource being accessed
 * @param action - The action being performed
 * @returns true if permitted, false otherwise
 *
 * @example
 * if (hasPermission("admin", "generator", "create")) {
 *   // Allow operation
 * }
 */
export function hasPermission<R extends PermissionResource>(
	orgRole: OrgRole,
	resource: R,
	action: PermissionAction<R>
): boolean {
	const resourcePerms = PERMISSIONS[resource];
	const allowedRoles = resourcePerms[
		action as keyof typeof resourcePerms
	] as readonly OrgRole[];
	return allowedRoles?.includes(orgRole) ?? false;
}

/**
 * Require permission or throw ConvexError
 * Use in mutations before sensitive operations
 *
 * @param orgRole - The user's role in the organization
 * @param resource - The resource being accessed
 * @param action - The action being performed
 * @throws ConvexError with code "FORBIDDEN" if not permitted
 *
 * @example
 * // In a mutation:
 * requirePermission(userOrgRole, "generator", "delete");
 * // If user lacks permission, ConvexError is thrown
 */
export function requirePermission<R extends PermissionResource>(
	orgRole: OrgRole,
	resource: R,
	action: PermissionAction<R>
): void {
	if (!hasPermission(orgRole, resource, action)) {
		throw new ConvexError({
			message: "Permission denied",
			code: "FORBIDDEN",
		});
	}
}
