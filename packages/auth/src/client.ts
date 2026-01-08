import { createAuthClient } from "better-auth/react";
import { convexClient, crossDomainClient } from "@convex-dev/better-auth/client/plugins";
import { organizationClient, adminClient } from "better-auth/client/plugins";

export type OrganizationType = "treater" | "generator" | "hauler";


export interface HwmOrganization {
	id: string;
	name: string;
	organizationType: OrganizationType;
	linkedEntityId: string;
	createdAt: Date;
	slug?: string;
	logo?: string;
	metadata?: Record<string, unknown>;
}

// Factory function to create the HWM auth client
export function createHwmAuthClient(convexSiteUrl: string) {
	return createAuthClient({
		baseURL: convexSiteUrl,
		plugins: [
			// Convex plugin for Convex compatibility
			convexClient(),

			// Cross-domain plugin for multi-app sessions
			crossDomainClient(),

			// Organization plugin with custom schema fields
			organizationClient(),

			// Admin plugin for user management, ban, impersonation
			adminClient(),
		],
	});
}

// Type export for the auth client
export type HwmAuthClient = ReturnType<typeof createHwmAuthClient>;

// Use $Infer for proper type inference (Better Auth recommended pattern)
export type Session = HwmAuthClient["$Infer"]["Session"];
export type User = Session["user"];
