import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@hwm/convex";
import { authClient } from "@/lib/auth";
import type { Id } from "@hwm/convex";

/**
 * Hook to get the current user's active treater organization.
 * Combines Better Auth's active organization with Convex organization links.
 *
 * @returns { treaterId, isLoading, error }
 */
export function useActiveTreater() {
	// Get active organization from Better Auth
	const { data: activeOrg, isPending: orgPending } = authClient.useActiveOrganization();

	// Resolve to organization link via Convex
	const {
		data: orgLink,
		isPending: linkPending,
		error: linkError,
	} = useQuery({
		...convexQuery(api.organizationLinks.queries.getByBetterAuthOrgId, {
			betterAuthOrgId: activeOrg?.id ?? "",
		}),
		enabled: !!activeOrg?.id,
	});

	// Compute derived state
	const isLoading = orgPending || (!!activeOrg?.id && linkPending);

	// Validate organization type is treater
	const isTreater = orgLink?.organizationType === "treater";
	const treaterId = isTreater ? orgLink.treaterId : undefined;

	return {
		treaterId: treaterId as Id<"treaters"> | undefined,
		organizationName: activeOrg?.name,
		isLoading,
		error: linkError,
		// For debugging/display
		orgLink,
		activeOrg,
	};
}
