import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/haulers/")({
	beforeLoad: () => {
		// Redirect to main dashboard - hauler list is on dashboard
		throw redirect({ to: "/dashboard" });
	},
	component: () => null,
});
