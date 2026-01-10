/// <reference types="vite/client" />
import {
	Outlet,
	createRootRouteWithContext,
	HeadContent,
	Scripts,
	useRouteContext,
} from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import type { QueryClient } from "@tanstack/react-query";
import "../styles.css";
import { authClient } from "@/lib/auth-client";
import { getToken } from "@/lib/auth-server";

// Server function to get auth token from cookies
const getAuth = createServerFn({ method: "GET" }).handler(async () => {
	return await getToken();
});

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient;
	convexQueryClient: ConvexQueryClient;
}>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "HWM Generator" },
		],
		links: [{ rel: "icon", href: "/favicon.ico" }],
	}),
	beforeLoad: async (ctx) => {
		const token = await getAuth();

		if (token) {
			ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
		}

		return {
			isAuthenticated: !!token,
			token,
		};
	},
	component: RootComponent,
});

function RootComponent() {
	const context = useRouteContext({ from: Route.id });

	return (
		<ConvexBetterAuthProvider
			client={context.convexQueryClient.convexClient}
			authClient={authClient}
			initialToken={context.token}
		>
			<RootDocument>
				<Outlet />
			</RootDocument>
		</ConvexBetterAuthProvider>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body className="min-h-screen bg-background text-foreground">
				{children}
				<Scripts />
			</body>
		</html>
	);
}
