import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    if (context.isAuthenticated) {
      throw redirect({ to: "/dashboard" });
    } else {
      throw redirect({ to: "/auth/$authView", params: { authView: "sign-in" } });
    }
  },
  component: () => null, // Never renders due to redirects
});