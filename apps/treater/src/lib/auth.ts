import { createHwmAuthClient } from "@hwm/auth";

// Get the Convex site URL from environment
const CONVEX_SITE_URL =
	(import.meta as any).env.VITE_CONVEX_SITE_URL ||
	(import.meta as any).env.VITE_CONVEX_URL;

if (!CONVEX_SITE_URL && typeof window !== "undefined") {
	console.warn("Missing VITE_CONVEX_SITE_URL environment variable");
}

// Create the auth client for this app
export const authClient = createHwmAuthClient(CONVEX_SITE_URL || "");

// Export commonly used hooks and utilities from the auth client
export const {
	signIn,
	signUp,
	signOut,
	useSession,
	getSession,
	organization,
} = authClient;
