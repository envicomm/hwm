import { useMemo } from "react";
import {
  Package,
  Truck,
  FlaskConical,
  CheckCircle,
  FileText,
  MapPin,
  User,
  Scale,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  MockWasteBag,
  MockCollectionRequest,
  ActivityItem,
  WasteType,
} from "@/lib/mock-data";
import { getRecentActivity, typeLabels } from "@/lib/mock-data";

interface ActivityTimelineProps {
  bags: MockWasteBag[];
  requests: MockCollectionRequest[];
}

function getActivityIcon(type: ActivityItem["type"]) {
  switch (type) {
    case "bag_created":
      return Package;
    case "bag_collected":
      return Truck;
    case "bag_treated":
      return FlaskConical;
    case "bag_disposed":
      return CheckCircle;
    case "request_created":
      return FileText;
    default:
      return Package;
  }
}

function getAccentColor(type: ActivityItem["type"]) {
  switch (type) {
    case "bag_created":
      return "bg-slate-400";
    case "bag_collected":
      return "bg-amber-500";
    case "bag_treated":
      return "bg-teal-500";
    case "bag_disposed":
      return "bg-emerald-500";
    case "request_created":
      return "bg-blue-500";
    default:
      return "bg-slate-400";
  }
}

function getWasteTypeAccent(wasteType: WasteType) {
  switch (wasteType) {
    case "infectious":
      return "text-red-600 dark:text-red-400";
    case "sharps":
      return "text-amber-600 dark:text-amber-400";
    case "pharmaceutical":
      return "text-blue-600 dark:text-blue-400";
    case "pathological":
      return "text-purple-600 dark:text-purple-400";
    case "chemical":
      return "text-emerald-600 dark:text-emerald-400";
    default:
      return "text-muted-foreground";
  }
}

function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return diffMins <= 1 ? "Just now" : `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) {
    return "Yesterday";
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Get role display label
function getRoleLabel(role: "nurse" | "staff" | "driver" | "treater" | "system"): string {
  switch (role) {
    case "nurse":
      return "Nurse";
    case "staff":
      return "Staff";
    case "driver":
      return "Driver";
    case "treater":
      return "Treater";
    case "system":
      return "System";
    default:
      return role;
  }
}

export function ActivityTimeline({ bags, requests }: ActivityTimelineProps) {
  const activities = useMemo(
    () => getRecentActivity(bags, requests, 6),
    [bags, requests]
  );

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {activities.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No recent activity
          </p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

            <div className="space-y-4">
              {activities.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                const accentColor = getAccentColor(activity.type);
                const wasteTypeColor = activity.wasteType
                  ? getWasteTypeAccent(activity.wasteType)
                  : "";

                return (
                  <div key={activity.id} className="relative flex gap-3 group">
                    {/* Timeline dot */}
                    <div
                      className={cn(
                        "relative z-10 mt-1 h-[22px] w-[22px] rounded-full border-2 border-background flex items-center justify-center",
                        accentColor
                      )}
                    >
                      <Icon className="h-3 w-3 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {activity.description}
                        </p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTimestamp(activity.timestamp)}
                        </span>
                      </div>

                      {/* Primary metadata - waste type and weight */}
                      {(activity.wasteType || activity.weightKg) && (
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          {activity.wasteType && (
                            <span className={wasteTypeColor}>
                              {typeLabels[activity.wasteType]}
                            </span>
                          )}
                          {activity.weightKg && (
                            <span className="inline-flex items-center gap-0.5">
                              <Scale className="h-3 w-3" />
                              {activity.weightKg} kg
                            </span>
                          )}
                        </div>
                      )}

                      {/* Secondary metadata - location and updated by */}
                      {(activity.location || activity.updatedBy) && (
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          {activity.location && (
                            <span className="inline-flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" />
                              {activity.location}
                            </span>
                          )}
                          {activity.updatedBy && (
                            <span className="inline-flex items-center gap-0.5">
                              <User className="h-3 w-3" />
                              {activity.updatedBy.name}
                              <span className="text-muted-foreground/60">
                                ({getRoleLabel(activity.updatedBy.role)})
                              </span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
