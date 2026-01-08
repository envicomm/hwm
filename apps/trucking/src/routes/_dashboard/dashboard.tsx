import { createFileRoute } from "@tanstack/react-router";
import { FleetMapWidget } from "@/components/dashboard/fleet-map-widget";
import { FleetInsightsWidget } from "@/components/dashboard/fleet-insights-widget";
import { DriverStatusWidget } from "@/components/dashboard/driver-status-widget";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { RecentActivityTable } from "@/components/dashboard/recent-activity-table";

export const Route = createFileRoute("/_dashboard/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-semibold tracking-tight">Fleet Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor collections, disposals, and driver assignments in real-time
        </p>
      </div>

      {/* Fleet Map */}
      <FleetMapWidget
        animate
        animationDelay={0.1}
      />

      {/* Row 2: Driver Status + Fleet Insights */}
      <div className="grid gap-4 lg:grid-cols-3">
        <DriverStatusWidget animate animationDelay={0.4} />
        <FleetInsightsWidget
          className="lg:col-span-2"
          animate
          animationDelay={0.5}
        />
      </div>

      {/* Row 3: Activity Timeline + Recent Operations Table */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ActivityTimeline animate animationDelay={0.6} />
        <RecentActivityTable
          className="lg:col-span-2"
          animate
          animationDelay={0.7}
        />
      </div>
    </div>
  );
}
