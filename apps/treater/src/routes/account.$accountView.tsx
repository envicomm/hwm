import { AccountView } from "@daveyplate/better-auth-ui";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSession } from "@/lib/auth";
import "@daveyplate/better-auth-ui/css";

export const Route = createFileRoute("/account/$accountView")({
	beforeLoad: async () => {
		const { data: session } = await getSession();
		if (!session?.user) {
			throw redirect({ to: "/auth/$authView", params: { authView: "sign-in" } });
		}
	},
	component: AccountPage,
});

function AccountPage() {
	const { accountView } = Route.useParams();

	return (
		<main className="container mx-auto p-4 md:p-6">
			<AccountView pathname={accountView} />
		</main>
	);
}
