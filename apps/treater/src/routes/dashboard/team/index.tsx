import { createFileRoute, redirect } from "@tanstack/react-router";
import { useActiveTreater } from "@/hooks/use-active-treater";
import { useAuth } from "@/contexts/auth-context";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberList } from "@/components/team/member-list";
import { InviteMemberForm } from "@/components/team/invite-member-form";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/dashboard/team/")({
	beforeLoad: async ({ context }) => {
		if (!context.isAuthenticated) {
			throw redirect({ to: "/auth/$authView", params: { authView: "sign-in" } });
		}
	},
	component: TeamPage,
});

function TeamPage() {
	const { user } = useAuth();
	const { treaterId, isLoading: treaterLoading, activeOrg } = useActiveTreater();
	const queryClient = useQueryClient();

	// Handle invite success by refreshing member list
	function handleInviteSuccess() {
		if (activeOrg?.id) {
			queryClient.invalidateQueries({ queryKey: ["org-members", activeOrg.id] });
			queryClient.invalidateQueries({
				queryKey: ["org-invitations", activeOrg.id],
			});
		}
	}

	if (treaterLoading) {
		return (
			<div className="container py-6 space-y-6">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	if (!treaterId || !activeOrg?.id) {
		return (
			<div className="container py-6">
				<Card>
					<CardContent className="py-8">
						<p className="text-center text-muted-foreground">
							No organization selected. Please select an organization first.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container py-6 space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Team Management</h1>
				<p className="text-muted-foreground">
					Manage your organization's team members and invitations
				</p>
			</div>

			<Tabs defaultValue="members" className="space-y-4">
				<TabsList>
					<TabsTrigger value="members">Team Members</TabsTrigger>
					<TabsTrigger value="invite">Invite Member</TabsTrigger>
				</TabsList>

				<TabsContent value="members">
					<Card>
						<CardHeader>
							<CardTitle>Team Members</CardTitle>
							<CardDescription>
								People who have access to {activeOrg.name}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<MemberList
								organizationId={activeOrg.id}
								currentUserId={user?.id}
							/>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="invite">
					<Card>
						<CardHeader>
							<CardTitle>Invite Team Member</CardTitle>
							<CardDescription>
								Send an invitation to join {activeOrg.name}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<InviteMemberForm
								treaterId={treaterId}
								onSuccess={handleInviteSuccess}
							/>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
