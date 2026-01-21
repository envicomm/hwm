import { convexBetterAuthReactStart } from "@convex-dev/better-auth/react-start";

/**
 * Server-side auth helpers for TanStack Start SSR
 *
 * Provides handlers and utilities for authentication in server contexts:
 * - handler: Request handler for auth proxy route
 * - getToken: Get auth token on server for SSR
 * - fetchAuthQuery/Mutation/Action: Server-side data fetching
 */
export const {
	handler,
	getToken,
	fetchAuthQuery,
	fetchAuthMutation,
	fetchAuthAction,
} = convexBetterAuthReactStart({
	convexUrl: process.env.VITE_CONVEX_URL!,
	convexSiteUrl: process.env.VITE_CONVEX_SITE_URL!,
});
