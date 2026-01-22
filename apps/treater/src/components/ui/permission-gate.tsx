import type { ReactNode } from "react";
import {
	usePermissions,
	type PermissionResource,
	type PermissionAction,
} from "@/hooks/usePermissions";

interface PermissionGateProps<R extends PermissionResource> {
	/** The resource being protected */
	resource: R;
	/** The action being attempted */
	action: PermissionAction<R>;
	/** Content to render when permission is granted */
	children: ReactNode;
	/** Optional content to render when permission is denied (defaults to null) */
	fallback?: ReactNode;
}

/**
 * Conditionally renders children based on user's permission.
 *
 * @example
 * // Only owners can see delete button
 * <PermissionGate resource="generator" action="delete">
 *   <Button variant="destructive">Delete</Button>
 * </PermissionGate>
 *
 * @example
 * // With fallback for non-admins
 * <PermissionGate
 *   resource="team"
 *   action="invite"
 *   fallback={<span>Contact admin to invite members</span>}
 * >
 *   <InviteButton />
 * </PermissionGate>
 */
export function PermissionGate<R extends PermissionResource>({
	resource,
	action,
	children,
	fallback = null,
}: PermissionGateProps<R>) {
	const { can, isLoading } = usePermissions();

	// Don't render anything while loading permissions
	if (isLoading) return null;

	// Render children if permitted, fallback otherwise
	return can(resource, action) ? <>{children}</> : <>{fallback}</>;
}
