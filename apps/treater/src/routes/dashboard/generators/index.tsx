import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/generators/")({
	beforeLoad: () => {
		// Redirect to main dashboard - generator list is on dashboard
		throw redirect({ to: "/dashboard" });
	},
	component: () => null,
});
