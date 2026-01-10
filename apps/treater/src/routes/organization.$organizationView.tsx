import { OrganizationView } from "@daveyplate/better-auth-ui";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSession } from "@/lib/auth-client";
import "@daveyplate/better-auth-ui/css";

export const Route = createFileRoute("/organization/$organizationView")({
	beforeLoad: async () => {
		const { data: session } = await getSession();
		if (!session?.user) {
			throw redirect({ to: "/auth/$authView", params: { authView: "sign-in" } });
		}
	},
	component: OrganizationPage,
});

function OrganizationPage() {
	const { organizationView } = Route.useParams();

	return (
		<main className="container mx-auto p-4 md:p-6">
			<OrganizationView pathname={organizationView} />
		</main>
	);
}
