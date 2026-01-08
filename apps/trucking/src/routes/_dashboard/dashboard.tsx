import { createFileRoute } from "@tanstack/react-router";
import { FleetMapWidget } from "@/components/dashboard/fleet-map-widget";
import {
  ActiveOperationsCard,
  SevenDayActivityCard,
} from "@/components/dashboard/fleet-insights-widget";
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

      {/* Row 1: Fleet Map (3/5) + Driver Status (2/5) */}
      <div className="grid gap-4 lg:grid-cols-5">
        <FleetMapWidget
          className="lg:col-span-3"
          animate
          animationDelay={0.1}
        />
        <DriverStatusWidget
          className="lg:col-span-2"
          animate
          animationDelay={0.2}
        />
      </div>

      {/* Row 2: Stacked Cards (2/5) + Recent Operations Table (3/5) */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Left: Stacked cards - Active Ops (1/5), 7-Day (1/5), Recent Activity (3/5) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <ActiveOperationsCard
            className="flex-[1]"
            animate
            animationDelay={0.3}
          />
          <SevenDayActivityCard
            className="flex-[1]"
            animate
            animationDelay={0.4}
          />
          <ActivityTimeline
            className="flex-[3]"
            animate
            animationDelay={0.5}
          />
        </div>
        {/* Right: Recent Operations table */}
        <RecentActivityTable
          className="lg:col-span-3"
          animate
          animationDelay={0.6}
        />
      </div>
    </div>
  );
}
