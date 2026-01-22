import { QueryClient } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useRouter,
  redirect,
} from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import { getToken } from "@/lib/auth-server";
import { authClient } from "@/lib/auth";
import { AuthProvider } from "@/contexts/auth-context";
import {
  shouldRedirectToApp,
  getCurrentAppOrgTypeSSR,
  isRoutingExemptPath,
  type OrganizationType,
} from "@hwm/auth";
import "../styles.css";

// Server function to get auth token
const getAuth = createServerFn({ method: "GET" }).handler(async () => {
  return await getToken();
});

// Router context type
interface RouterContext {
  queryClient: QueryClient;
  convexQueryClient: ConvexQueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ context, location }) => {
    const token = await getAuth();

    // Set server auth if token exists and we're on the server
    if (token && context.convexQueryClient?.serverHttpClient) {
      context.convexQueryClient.serverHttpClient.setAuth(token);
    }

    // Skip org-type routing for exempt paths (auth, accept-invitation)
    if (isRoutingExemptPath(location.pathname)) {
      return { isAuthenticated: !!token, token };
    }

    // If authenticated, check if user should be in a different app
    if (token) {
      try {
        // Get user session to check active organization
        const session = await authClient.getSession();
        const activeOrg = (session?.data?.user as any)?.activeOrganization;

        if (activeOrg) {
          // Get org type from metadata (set during org creation)
          const orgMeta = activeOrg.metadata as { organizationType?: string } | undefined;
          const userOrgType = orgMeta?.organizationType as OrganizationType | undefined;

          // Determine current app's expected org type (generator = 3001)
          const currentAppOrgType = getCurrentAppOrgTypeSSR("3001");

          // Check if redirect needed
          const redirectUrl = shouldRedirectToApp(userOrgType, currentAppOrgType);
          if (redirectUrl) {
            // Redirect to correct app, preserving path
            throw redirect({
              href: `${redirectUrl}${location.pathname}${location.search}`,
            });
          }
        }
      } catch (error) {
        // Don't fail auth on session check errors, just skip org-type routing
        if (error instanceof Error && error.message.includes('redirect')) {
          throw error; // Re-throw redirect errors
        }
        console.warn('Session check failed, skipping org-type routing:', error);
      }
    }

    return { isAuthenticated: !!token, token };
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "HWM Generator" },
    ],
    links: [{ rel: "icon", href: "/favicon.ico" }],
  }),
  component: RootComponent,
});

function RootComponent() {
  const { token } = Route.useRouteContext();
  const router = useRouter();
  const convexClient =
    router.options.context?.convexQueryClient?.convexClient ?? null;

  // Guard: If no convex client, render without Convex provider (shouldn't happen in practice)
  // Still wrap with AuthProvider for consistency, though useAuth will throw without Convex context
  if (!convexClient) {
    return (
      <html lang="en">
        <head>
          <HeadContent />
        </head>
        <body className="min-h-screen bg-background text-foreground">
          <Outlet />
          <Scripts />
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <ConvexBetterAuthProvider
          client={convexClient}
          authClient={authClient}
          initialToken={token}
        >
          <AuthProvider>
            <Outlet />
          </AuthProvider>
        </ConvexBetterAuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
