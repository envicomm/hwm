import { Users, CircleDot } from "lucide-react";
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
} from "@/components/ui/glass-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  mockDrivers,
  driverStatusColors,
  getActiveDriverCount,
  getAvailableDriverCount,
  type DriverStatus,
} from "@/lib/mock-data";

interface DriverStatusWidgetProps {
  className?: string;
  animate?: boolean;
  animationDelay?: number;
}

const statusLabels: Record<DriverStatus, string> = {
  available: "Available",
  on_route: "On Route",
  returning: "Returning",
  off_duty: "Off Duty",
};

function formatLastUpdated(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function DriverStatusWidget({
  className,
  animate = false,
  animationDelay,
}: DriverStatusWidgetProps) {
  const activeCount = getActiveDriverCount();
  const availableCount = getAvailableDriverCount();
  const totalDrivers = mockDrivers.length;
  const onDutyCount = mockDrivers.filter((d) => d.status !== "off_duty").length;

  // Group drivers by status
  const driversByStatus = mockDrivers.reduce(
    (acc, driver) => {
      if (!acc[driver.status]) acc[driver.status] = [];
      acc[driver.status].push(driver);
      return acc;
    },
    {} as Record<DriverStatus, typeof mockDrivers>
  );

  return (
    <GlassCard
      variant="elevated"
      animate={animate}
      animationDelay={animationDelay}
      className={cn("flex flex-col h-full", className)}
    >
      <GlassCardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <GlassCardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Driver Status
          </GlassCardTitle>
          <span className="text-xs text-muted-foreground">
            {onDutyCount}/{totalDrivers} on duty
          </span>
        </div>
      </GlassCardHeader>

      <GlassCardContent className="space-y-4 flex-1 flex flex-col">
        {/* Primary metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Active</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-semibold tabular-nums text-blue-600">
                {activeCount}
              </span>
              <span className="text-xs text-muted-foreground">drivers</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Available</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-semibold tabular-nums text-emerald-600">
                {availableCount}
              </span>
              <span className="text-xs text-muted-foreground">drivers</span>
            </div>
          </div>
        </div>

        {/* Status breakdown */}
        <div className="flex gap-2">
          {(["on_route", "returning", "available", "off_duty"] as DriverStatus[]).map(
            (status) => {
              const count = driversByStatus[status]?.length || 0;
              if (count === 0 && status === "off_duty") return null;
              return (
                <div
                  key={status}
                  className="flex items-center gap-1.5 text-[10px]"
                >
                  <CircleDot
                    className="h-3 w-3"
                    style={{ color: driverStatusColors[status] }}
                  />
                  <span className="text-muted-foreground">
                    {count} {statusLabels[status].toLowerCase()}
                  </span>
                </div>
              );
            }
          )}
        </div>

        {/* Driver list */}
        <div className="space-y-1.5 flex-1 overflow-y-auto">
          {mockDrivers
            .filter((d) => d.status !== "off_duty")
            .slice(0, 5)
            .map((driver) => (
              <div
                key={driver.id}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/40 transition-colors"
              >
                <div className="relative">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-[9px] bg-muted">
                      {driver.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {/* Status indicator dot */}
                  <span
                    className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-800"
                    style={{ backgroundColor: driverStatusColors[driver.status] }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium truncate">{driver.name}</p>
                    <span
                      className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: `${driverStatusColors[driver.status]}15`,
                        color: driverStatusColors[driver.status],
                      }}
                    >
                      {statusLabels[driver.status]}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {driver.vehiclePlate} • {driver.completedToday} completed • {formatLastUpdated(driver.lastUpdated)}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
