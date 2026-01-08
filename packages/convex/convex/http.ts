import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";

const http = httpRouter();

// Environment-based CORS configuration
const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = isProduction
	? [
			process.env.SITE_URL ?? "https://treater.hwm.app",
			"https://generator.hwm.app",
			"https://treater.hwm.app",
			"https://trucking.hwm.app",
		]
	: [
			"http://localhost:3001", // generator app
			"http://localhost:3002", // treater app
			"http://localhost:3003", // trucking app
		];

// Register Better Auth routes with CORS for all app origins
authComponent.registerRoutes(http, createAuth, {
	cors: {
		allowedOrigins,
		allowedHeaders: ["Content-Type", "Authorization"],
	},
});

export default http;
