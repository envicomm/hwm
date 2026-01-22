import { useQuery } from "@tanstack/react-query";
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
import { Skeleton } from "@/components/ui/skeleton";
import { MemberActions } from "./member-actions";
import { formatDistanceToNow } from "date-fns";

interface MemberListProps {
	organizationId: string;
	currentUserId?: string;
}

export function MemberList({ organizationId, currentUserId }: MemberListProps) {
	const {
		data: membersResult,
		isLoading,
		refetch,
	} = useQuery({
		queryKey: ["org-members", organizationId],
		queryFn: async () => {
			const result = await authClient.organization.listMembers({
				query: {
					organizationId,
					limit: 100,
					sortBy: "createdAt",
					sortDirection: "desc",
				},
			});
			return result.data;
		},
		enabled: !!organizationId,
	});

	const members = membersResult?.members ?? [];

	if (isLoading) {
		return (
			<div className="space-y-2">
				<Skeleton className="h-12 w-full" />
				<Skeleton className="h-12 w-full" />
				<Skeleton className="h-12 w-full" />
			</div>
		);
	}

	if (members.length === 0) {
		return (
			<div className="text-center py-8 text-muted-foreground">
				No team members yet. Invite someone to get started.
			</div>
		);
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead>Email</TableHead>
					<TableHead>Role</TableHead>
					<TableHead>Joined</TableHead>
					<TableHead className="text-right">Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{members.map((member) => (
					<TableRow key={member.id}>
						<TableCell className="font-medium">
							{member.user.name || "\u2014"}
							{member.user.id === currentUserId && (
								<Badge variant="outline" className="ml-2">
									You
								</Badge>
							)}
						</TableCell>
						<TableCell>{member.user.email}</TableCell>
						<TableCell>
							<RoleBadge role={member.role} />
						</TableCell>
						<TableCell className="text-muted-foreground">
							{formatDistanceToNow(new Date(member.createdAt), {
								addSuffix: true,
							})}
						</TableCell>
						<TableCell className="text-right">
							{member.user.id !== currentUserId && (
								<MemberActions
									member={member}
									organizationId={organizationId}
									onUpdate={refetch}
								/>
							)}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

function RoleBadge({ role }: { role: string }) {
	const variants: Record<string, "default" | "secondary" | "outline"> = {
		owner: "default",
		admin: "secondary",
		member: "outline",
	};

	return (
		<Badge variant={variants[role] || "outline"}>
			{role.charAt(0).toUpperCase() + role.slice(1)}
		</Badge>
	);
}
