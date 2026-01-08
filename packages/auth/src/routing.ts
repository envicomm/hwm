import type { OrganizationType } from "./client";

// App URLs for different environments
export const APP_URLS = {
	development: {
		treater: "http://localhost:3002",
		generator: "http://localhost:3001",
		hauler: "http://localhost:3003",
	},
	production: {
		treater: "https://treater.hwm.app",
		generator: "https://generator.hwm.app",
		hauler: "https://trucking.hwm.app",
	},
} as const;

// Get the current environment
function getEnvironment(): "development" | "production" {
	if (typeof window === "undefined") return "development";
	return window.location.hostname === "localhost" ? "development" : "production";
}

// Get the app URL for a specific organization type
export function getAppUrlForOrgType(
	orgType: OrganizationType | undefined | null
): string | null {
	if (!orgType) return null;

	const env = getEnvironment();
	const urls = APP_URLS[env];

	return urls[orgType] ?? null;
}

// Get the organization type for the current app based on URL/port
export function getCurrentAppOrgType(): OrganizationType {
	if (typeof window === "undefined") return "generator"; // Default for SSR

	const hostname = window.location.hostname;
	const port = window.location.port;

	// Development: Check by port
	if (hostname === "localhost") {
		switch (port) {
			case "3001":
				return "generator";
			case "3002":
				return "treater";
			case "3003":
				return "hauler";
			default:
				return "generator";
		}
	}

	// Production: Check by subdomain
	if (hostname.includes("treater")) return "treater";
	if (hostname.includes("generator")) return "generator";
	if (hostname.includes("trucking") || hostname.includes("hauler"))
		return "hauler";

	return "generator"; // Default fallback
}

// Check if user should be redirected to a different app
export function shouldRedirectToApp(
	userOrgType: OrganizationType | undefined | null,
	currentAppOrgType: OrganizationType
): string | null {
	if (!userOrgType) return null;
	if (userOrgType === currentAppOrgType) return null;

	return getAppUrlForOrgType(userOrgType);
}

// Build callback URL for auth redirects
export function buildAuthCallbackUrl(path = "/dashboard"): string {
	if (typeof window === "undefined") return path;
	return `${window.location.origin}${path}`;
}

// Build invitation acceptance URL
export function buildInvitationAcceptUrl(
	orgType: OrganizationType,
	token: string
): string {
	const env = getEnvironment();
	const baseUrl = APP_URLS[env][orgType];
	return `${baseUrl}/accept-invitation?token=${token}`;
}
