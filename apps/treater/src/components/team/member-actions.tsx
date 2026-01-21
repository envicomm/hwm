import { useState } from "react";
import { authClient } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, UserMinus, Shield, User } from "lucide-react";
import { toast } from "sonner";

interface Member {
	id: string;
	role: string;
	user: {
		id: string;
		name: string | null;
		email: string;
	};
}

interface MemberActionsProps {
	member: Member;
	organizationId: string;
	onUpdate: () => void;
}

export function MemberActions({
	member,
	organizationId,
	onUpdate,
}: MemberActionsProps) {
	const [showRemoveDialog, setShowRemoveDialog] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);

	async function handleRoleChange(newRole: "admin" | "member") {
		if (newRole === member.role) return;

		setIsUpdating(true);
		try {
			await authClient.organization.updateMemberRole({
				memberId: member.id,
				role: newRole,
				organizationId,
			});
			toast.success(
				`Updated ${member.user.name || member.user.email} to ${newRole}`
			);
			onUpdate();
		} catch (error) {
			console.error("Failed to update role:", error);
			toast.error("Failed to update member role");
		} finally {
			setIsUpdating(false);
		}
	}

	async function handleRemove() {
		setIsUpdating(true);
		try {
			await authClient.organization.removeMember({
				memberIdOrEmail: member.id,
				organizationId,
			});
			toast.success(
				`Removed ${member.user.name || member.user.email} from organization`
			);
			setShowRemoveDialog(false);
			onUpdate();
		} catch (error) {
			console.error("Failed to remove member:", error);
			toast.error("Failed to remove member");
		} finally {
			setIsUpdating(false);
		}
	}

	// Can't modify owner role or remove owner
	if (member.role === "owner") {
		return <span className="text-sm text-muted-foreground">Owner</span>;
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="sm" disabled={isUpdating}>
						<MoreHorizontal className="h-4 w-4" />
						<span className="sr-only">Open menu</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuLabel>Change Role</DropdownMenuLabel>
					<DropdownMenuItem
						onClick={() => handleRoleChange("admin")}
						disabled={member.role === "admin"}
					>
						<Shield className="mr-2 h-4 w-4" />
						Make Admin
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={() => handleRoleChange("member")}
						disabled={member.role === "member"}
					>
						<User className="mr-2 h-4 w-4" />
						Make Member
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						onClick={() => setShowRemoveDialog(true)}
						className="text-red-600"
					>
						<UserMinus className="mr-2 h-4 w-4" />
						Remove from Team
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remove team member?</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to remove{" "}
							{member.user.name || member.user.email} from your organization?
							They will lose access to all organization resources.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleRemove}
							disabled={isUpdating}
							className="bg-red-600 hover:bg-red-700"
						>
							{isUpdating ? "Removing..." : "Remove"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
