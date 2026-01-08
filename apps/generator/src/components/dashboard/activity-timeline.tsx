import { useMemo } from "react";
import { Package, Truck, FlaskConical, CheckCircle, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  MockWasteBag,
  MockCollectionRequest,
  ActivityItem,
} from "@/lib/mock-data";
import { getRecentActivity } from "@/lib/mock-data";

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

function getActivityColor(type: ActivityItem["type"]) {
  switch (type) {
    case "bag_created":
      return "bg-slate-100 text-slate-600";
    case "bag_collected":
      return "bg-amber-50 text-amber-600";
    case "bag_treated":
      return "bg-teal-50 text-teal-600";
    case "bag_disposed":
      return "bg-emerald-50 text-emerald-600";
    case "request_created":
      return "bg-blue-50 text-blue-600";
    default:
      return "bg-slate-100 text-slate-600";
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

export function ActivityTimeline({ bags, requests }: ActivityTimelineProps) {
  const activities = useMemo(
    () => getRecentActivity(bags, requests, 5),
    [bags, requests]
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="space-y-0">
          {activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const colorClass = getActivityColor(activity.type);
            const isLast = index === activities.length - 1;

            return (
              <div key={activity.id} className="relative flex gap-3 pb-4">
                {!isLast && (
                  <div className="absolute left-[15px] top-8 h-[calc(100%-16px)] w-px bg-border" />
                )}
                <div
                  className={cn(
                    "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    colorClass
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm leading-tight">{activity.description}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatTimestamp(activity.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
          {activities.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No recent activity
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
