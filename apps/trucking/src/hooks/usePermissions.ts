import { authClient } from "@/lib/auth";

/**
 * Organization roles from Better Auth
 */
export type OrgRole = "owner" | "admin" | "member";

/**
 * Permission resource-action matrix (mirrors server-side PERMISSIONS)
 * Maps resource -> action -> allowed org roles
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
		create: ["owner", "admin"] as OrgRole[],
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
		create: ["owner", "admin", "member"] as OrgRole[],
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
 */
function hasPermission<R extends PermissionResource>(
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
 * Hook to check permissions for the current user
 *
 * @returns { orgRole, can, isOwner, isAdmin, isMember, isLoading }
 */
export function usePermissions() {
	const { data: member, isPending } = authClient.useActiveMember();

	const orgRole = (member?.role as OrgRole) ?? "member";

	/**
	 * Check if current user has permission for an action on a resource
	 */
	function can<R extends PermissionResource>(
		resource: R,
		action: PermissionAction<R>
	): boolean {
		if (isPending) return false;
		return hasPermission(orgRole, resource, action);
	}

	return {
		orgRole,
		can,
		isOwner: orgRole === "owner",
		isAdmin: orgRole === "admin",
		isMember: orgRole === "member",
		isLoading: isPending,
	};
}
