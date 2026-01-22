// Auth client
export {
	createHwmAuthClient,
	type HwmAuthClient,
	type HwmOrganization,
	type OrganizationType,
	type Session,
	type User,
} from "./client";

// Routing helpers
export {
	APP_URLS,
	getAppUrlForOrgType,
	getCurrentAppOrgType,
	getCurrentAppOrgTypeSSR,
	shouldRedirectToApp,
	buildAuthCallbackUrl,
	buildInvitationAcceptUrl,
	isRoutingExemptPath,
} from "./routing";
