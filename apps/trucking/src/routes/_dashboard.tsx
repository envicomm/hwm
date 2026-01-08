import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

const AUTH_STORAGE_KEY = "hwm_trucking_auth";

export const Route = createFileRoute("/_dashboard")({
  beforeLoad: () => {
    // Check for auth token in localStorage
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) {
      throw redirect({ to: "/" });
    }
    try {
      const user = JSON.parse(stored);
      if (!user?.id) {
        throw redirect({ to: "/" });
      }
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      throw redirect({ to: "/" });
    }
  },
  component: DashboardLayoutRoute,
});

function DashboardLayoutRoute() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
