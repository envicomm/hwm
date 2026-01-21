import { json } from "@tanstack/react-start";
import { handler } from "@/lib/auth-server";

/**
 * Auth proxy route for Better Auth integration
 *
 * Handles all /api/auth/* requests (sign-in, sign-up, sign-out, etc.)
 * and forwards them to the Convex Better Auth endpoints.
 *
 * The $ in the filename is TanStack Router's catch-all pattern,
 * matching /api/auth/sign-in, /api/auth/sign-up, etc.
 */

export async function GET({ request }: { request: Request }) {
	return handler(request);
}

export async function POST({ request }: { request: Request }) {
	return handler(request);
}
