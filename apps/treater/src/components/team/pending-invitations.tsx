import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { X } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface PendingInvitationsProps {
	organizationId: string;
}

export function PendingInvitations({ organizationId }: PendingInvitationsProps) {
	const queryClient = useQueryClient();

	const { data: invitationsResult, isLoading } = useQuery({
		queryKey: ["org-invitations", organizationId],
		queryFn: async () => {
			const result = await authClient.organization.listInvitations({
				query: {
					organizationId,
				},
			});
			return result.data;
		},
		enabled: !!organizationId,
	});

	// Filter to only pending invitations
	// invitationsResult is an array of invitations (not { invitations: [...] })
	const invitations =
		invitationsResult?.filter((inv) => inv.status === "pending") ?? [];

	async function handleCancel(invitationId: string) {
		try {
			await authClient.organization.cancelInvitation({
				invitationId,
			});
			toast.success("Invitation cancelled");
			queryClient.invalidateQueries({
				queryKey: ["org-invitations", organizationId],
			});
		} catch (error) {
			console.error("Failed to cancel invitation:", error);
			toast.error("Failed to cancel invitation");
		}
	}

	if (isLoading) {
		return (
			<div className="space-y-2">
				<Skeleton className="h-12 w-full" />
				<Skeleton className="h-12 w-full" />
			</div>
		);
	}

	if (invitations.length === 0) {
		return (
			<div className="text-center py-4 text-muted-foreground">
				No pending invitations
			</div>
		);
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Email</TableHead>
					<TableHead>Role</TableHead>
					<TableHead>Expires</TableHead>
					<TableHead className="text-right">Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{invitations.map((invitation) => (
					<TableRow key={invitation.id}>
						<TableCell>{invitation.email}</TableCell>
						<TableCell>
							<Badge variant="outline">
								{invitation.role.charAt(0).toUpperCase() +
									invitation.role.slice(1)}
							</Badge>
						</TableCell>
						<TableCell className="text-muted-foreground">
							{formatDistanceToNow(new Date(invitation.expiresAt), {
								addSuffix: true,
							})}
						</TableCell>
						<TableCell className="text-right">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => handleCancel(invitation.id)}
							>
								<X className="h-4 w-4" />
								<span className="sr-only">Cancel invitation</span>
							</Button>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
