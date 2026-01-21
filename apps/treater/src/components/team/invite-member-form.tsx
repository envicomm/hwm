import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@hwm/convex";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Id } from "@hwm/convex";

interface InviteMemberFormProps {
	treaterId: Id<"treaters">;
	onSuccess?: () => void;
}

export function InviteMemberForm({
	treaterId,
	onSuccess,
}: InviteMemberFormProps) {
	const [email, setEmail] = useState("");
	const [role, setRole] = useState<"admin" | "member">("member");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const inviteToTreater = useMutation(api.teams.index.inviteToTreater);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		if (!email.trim()) {
			toast.error("Please enter an email address");
			return;
		}

		setIsSubmitting(true);

		try {
			await inviteToTreater({
				treaterId,
				email: email.trim(),
				role,
			});

			toast.success(`Invitation sent to ${email}`);
			setEmail("");
			setRole("member");
			onSuccess?.();
		} catch (error) {
			console.error("Failed to send invitation:", error);
			toast.error(
				error instanceof Error ? error.message : "Failed to send invitation"
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="grid gap-4 sm:grid-cols-[1fr,auto,auto]">
				<div className="space-y-2">
					<Label htmlFor="email">Email address</Label>
					<Input
						id="email"
						type="email"
						placeholder="colleague@example.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						disabled={isSubmitting}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="role">Role</Label>
					<Select
						value={role}
						onValueChange={(v) => setRole(v as "admin" | "member")}
					>
						<SelectTrigger id="role" className="w-[120px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="admin">Admin</SelectItem>
							<SelectItem value="member">Member</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="flex items-end">
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? "Sending..." : "Send Invite"}
					</Button>
				</div>
			</div>
			<p className="text-sm text-muted-foreground">
				The invited user will receive an email with a link to join your
				organization.
			</p>
		</form>
	);
}
