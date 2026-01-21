import { QueryClient } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useRouter,
} from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import { getToken } from "@/lib/auth-server";
import { authClient } from "@/lib/auth";
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
  beforeLoad: async ({ context }) => {
    const token = await getAuth();
    // Set server auth if token exists and we're on the server
    if (token && context.convexQueryClient?.serverHttpClient) {
      context.convexQueryClient.serverHttpClient.setAuth(token);
    }
    return { isAuthenticated: !!token, token };
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "HWM Treater" },
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

  // Guard: If no convex client, render without auth provider (shouldn't happen in practice)
  if (!convexClient) {
    return (
      <html lang="en">
        <head>
          <HeadContent />
        </head>
        <body className="min-h-screen antialiased">
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
      <body className="min-h-screen antialiased">
        <ConvexBetterAuthProvider
          client={convexClient}
          authClient={authClient}
          initialToken={token}
        >
          <Outlet />
        </ConvexBetterAuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
