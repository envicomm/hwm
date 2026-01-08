import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { organization, admin } from "better-auth/plugins";
import { betterAuth } from "better-auth";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";

// Site URLs for trusted origins
const siteUrl = process.env.SITE_URL ?? "http://localhost:3002";
const isProduction = process.env.NODE_ENV === "production";

// Trusted origins for CORS
const trustedOrigins = isProduction
	? [
			siteUrl,
			"https://generator.hwm.app",
			"https://treater.hwm.app",
			"https://trucking.hwm.app",
		]
	: [
			siteUrl,
			"http://localhost:3001", // generator app
			"http://localhost:3002", // treater app
			"http://localhost:3003", // trucking app
		];

// Component client for integrating Convex with Better Auth
// @ts-expect-error - betterAuth component will be available after running convex dev
export const authComponent = createClient<DataModel>(components.betterAuth);

// Create the Better Auth instance with all plugins
export const createAuth = (ctx: GenericCtx<DataModel>) => {
	return betterAuth({
		baseURL: siteUrl,
		trustedOrigins,
		database: authComponent.adapter(ctx),

		// Rate limiting to prevent brute force attacks
		rateLimit: {
			enabled: true,
			window: 60, // 1 minute window
			max: 10, // 10 requests per minute default
			customRules: {
				"/sign-in/email": {
					window: 60,
					max: 5, // 5 login attempts per minute
				},
				"/sign-up/email": {
					window: 300, // 5 minutes
					max: 3, // 3 signups per 5 minutes
				},
				"/reset-password/*": {
					window: 300,
					max: 3, // 3 password reset attempts per 5 minutes
				},
			},
		},

		// Email/password authentication
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true, // Always require email verification for security
			async sendResetPassword({ user, url }) {
				const apiKey = process.env.RESEND_API_KEY;
				if (!apiKey) {
					console.error("RESEND_API_KEY is not configured");
					return;
				}

				const userName = user.name || "there";
				const html = `
					<!DOCTYPE html>
					<html>
					<head>
						<meta charset="utf-8">
						<title>Reset your password</title>
					</head>
					<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
						<h1 style="color: #0f766e;">Reset your password</h1>
						<p>Hi ${userName},</p>
						<p>We received a request to reset your password. Click the button below to choose a new password:</p>
						<p style="margin: 30px 0;">
							<a href="${url}" style="background-color: #0f766e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
								Reset Password
							</a>
						</p>
						<p style="color: #666; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email.</p>
						<p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
					</body>
					</html>
				`;

				try {
					const response = await fetch("https://api.resend.com/emails", {
						method: "POST",
						headers: {
							Authorization: `Bearer ${apiKey}`,
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							from: process.env.RESEND_FROM_EMAIL ?? "noreply@hwm.app",
							to: user.email,
							subject: "Reset your password - HWM",
							html,
						}),
					});

					if (!response.ok) {
						const error = await response.text();
						console.error(`Failed to send password reset email: ${error}`);
					}
				} catch (error) {
					console.error("Error sending password reset email:", error);
				}
			},
		},

		// Email verification configuration
		emailVerification: {
			sendOnSignUp: true,
			async sendVerificationEmail({ user, url }) {
				const apiKey = process.env.RESEND_API_KEY;
				if (!apiKey) {
					console.error("RESEND_API_KEY is not configured");
					return;
				}

				const userName = user.name || "there";
				const html = `
					<!DOCTYPE html>
					<html>
					<head>
						<meta charset="utf-8">
						<title>Verify your email</title>
					</head>
					<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
						<h1 style="color: #0f766e;">Verify your email address</h1>
						<p>Hi ${userName},</p>
						<p>Thanks for signing up for HWM (Hospital Waste Management). Please verify your email address by clicking the button below:</p>
						<p style="margin: 30px 0;">
							<a href="${url}" style="background-color: #0f766e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
								Verify Email Address
							</a>
						</p>
						<p style="color: #666; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
						<p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
					</body>
					</html>
				`;

				try {
					const response = await fetch("https://api.resend.com/emails", {
						method: "POST",
						headers: {
							Authorization: `Bearer ${apiKey}`,
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							from: process.env.RESEND_FROM_EMAIL ?? "noreply@hwm.app",
							to: user.email,
							subject: "Verify your email address - HWM",
							html,
						}),
					});

					if (!response.ok) {
						const error = await response.text();
						console.error(`Failed to send verification email: ${error}`);
					}
				} catch (error) {
					console.error("Error sending verification email:", error);
				}
			},
		},

		plugins: [
			// Cross-domain plugin for multi-app sessions
			crossDomain({ siteUrl }),

			// Convex plugin for Convex compatibility
			convex({ authConfig }),

			// Organization plugin for multi-tenant support
			organization({
				// Allow treaters to create organizations
				allowUserToCreateOrganization: true,

				// Maximum organizations a user can own
				organizationLimit: 100,

				// Send invitation email
				async sendInvitationEmail(data) {
					const { email, organization: org, inviter } = data;

					// Use Resend API directly since we can't call actions from here
					const apiKey = process.env.RESEND_API_KEY;
					if (!apiKey) {
						console.error("RESEND_API_KEY is not configured");
						return;
					}

					const orgMeta = org.metadata as
						| { organizationType?: string }
						| undefined;
					const orgType = orgMeta?.organizationType || "organization";
					const orgTypeName =
						orgType === "treater"
							? "Treatment Facility"
							: orgType === "generator"
								? "Hospital"
								: "Trucking Partner";

					const inviterName = inviter.user.name || inviter.user.email;

					// Build invitation URL
					const invitationUrl = `${siteUrl}/accept-invitation?token=${data.id}`;

					const html = `
						<!DOCTYPE html>
						<html>
						<head>
							<meta charset="utf-8">
							<title>Join ${org.name}</title>
						</head>
						<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
							<h1 style="color: #0f766e;">You've been invited!</h1>
							<p><strong>${inviterName}</strong> has invited you to join <strong>${org.name}</strong> on HWM (Hospital Waste Management).</p>
							<p>Organization type: <strong>${orgTypeName}</strong></p>
							<p style="margin: 30px 0;">
								<a href="${invitationUrl}" style="background-color: #0f766e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
									Accept Invitation
								</a>
							</p>
							<p style="color: #666; font-size: 14px;">If you didn't expect this invitation, you can safely ignore this email.</p>
						</body>
						</html>
					`;

					try {
						const response = await fetch("https://api.resend.com/emails", {
							method: "POST",
							headers: {
								Authorization: `Bearer ${apiKey}`,
								"Content-Type": "application/json",
							},
							body: JSON.stringify({
								from: process.env.RESEND_FROM_EMAIL ?? "noreply@hwm.app",
								to: email,
								subject: `Join ${org.name} on HWM`,
								html,
							}),
						});

						if (!response.ok) {
							const error = await response.text();
							console.error(`Failed to send invitation email: ${error}`);
						}
					} catch (error) {
						console.error("Error sending invitation email:", error);
					}
				},
			}),

			// Admin plugin for user management, ban, impersonation
			admin({
				defaultRole: "user",
				adminRoles: ["admin"],
			}),
		],
	});
};

// Query to get the current authenticated user
export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		return authComponent.getAuthUser(ctx);
	},
});
