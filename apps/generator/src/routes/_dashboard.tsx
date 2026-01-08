import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export const Route = createFileRoute("/_dashboard")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const authData = localStorage.getItem("hwm-generator-auth");
      if (!authData) {
        throw redirect({ to: "/" });
      }
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
