import { QueryClient } from "@tanstack/react-query";
import { createRouter, Link } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProvider } from "convex/react";
import { routeTree } from "./routeTree.gen";
import { AuthProvider } from "./contexts/auth-context";

export function getRouter() {
  const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL!;
  if (!CONVEX_URL) {
    console.error("Missing VITE_CONVEX_URL environment variable");
  }

  const convexQueryClient = new ConvexQueryClient(CONVEX_URL);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
    },
  });
  convexQueryClient.connect(queryClient);

  const router = createRouter({
    routeTree,
    defaultPreload: "intent",
    context: { queryClient },
    scrollRestoration: true,
    defaultNotFoundComponent: () => (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-gray-400">Page not found</p>
        <Link to="/" className="text-blue-400 hover:underline">
          Go home
        </Link>
      </div>
    ),
    Wrap: ({ children }) => (
      <ConvexProvider client={convexQueryClient.convexClient}>
        <AuthProvider>{children}</AuthProvider>
      </ConvexProvider>
    ),
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
