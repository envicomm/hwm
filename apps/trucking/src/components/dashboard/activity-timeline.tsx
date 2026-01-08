import { useMemo } from "react";
import {
  Package,
  Truck,
  CheckCircle,
  Trash2,
  UserCheck,
  PlayCircle,
} from "lucide-react";
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
} from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { getRecentActivities, type ActivityType } from "@/lib/mock-data";

interface ActivityTimelineProps {
  className?: string;
  animate?: boolean;
  animationDelay?: number;
}

function getActivityIcon(type: ActivityType) {
  switch (type) {
    case "collection_assigned":
      return Package;
    case "collection_started":
      return PlayCircle;
    case "collection_completed":
      return CheckCircle;
    case "disposal_started":
      return Truck;
    case "disposal_completed":
      return Trash2;
    case "driver_available":
      return UserCheck;
    default:
      return Package;
  }
}

function getActivityColor(type: ActivityType) {
  switch (type) {
    case "collection_assigned":
      return "bg-blue-50 text-blue-600 dark:bg-blue-500/10";
    case "collection_started":
      return "bg-amber-50 text-amber-600 dark:bg-amber-500/10";
    case "collection_completed":
      return "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10";
    case "disposal_started":
      return "bg-violet-50 text-violet-600 dark:bg-violet-500/10";
    case "disposal_completed":
      return "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10";
    case "driver_available":
      return "bg-teal-50 text-teal-600 dark:bg-teal-500/10";
    default:
      return "bg-slate-100 text-slate-600 dark:bg-slate-500/10";
  }
}

function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return "Just now";
  }
  if (diffMins < 60) {
    return `${diffMins}m ago`;
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

export function ActivityTimeline({
  className,
  animate = false,
  animationDelay,
}: ActivityTimelineProps) {
  const activities = useMemo(() => getRecentActivities(6), []);

  return (
    <GlassCard
      variant="elevated"
      animate={animate}
      animationDelay={animationDelay}
      className={cn("flex flex-col", className)}
    >
      <GlassCardHeader className="pb-3">
        <GlassCardTitle className="text-base font-medium">
          Recent Activity
        </GlassCardTitle>
      </GlassCardHeader>
      <GlassCardContent className="flex-1 overflow-y-auto">
        <div className="space-y-0">
          {activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const colorClass = getActivityColor(activity.type);
            const isLast = index === activities.length - 1;

            return (
              <div key={activity.id} className="relative flex gap-3 pb-4">
                {/* Connector line */}
                {!isLast && (
                  <div className="absolute left-[15px] top-8 h-[calc(100%-16px)] w-px bg-border/60" />
                )}
                {/* Icon */}
                <div
                  className={cn(
                    "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    colorClass
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                {/* Content */}
                <div className="flex-1 pt-0.5 min-w-0">
                  <p className="text-sm leading-tight truncate">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                    {activity.driverName && (
                      <>
                        <span className="text-muted-foreground/50">•</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {activity.driverName}
                        </span>
                      </>
                    )}
                  </div>
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
      </GlassCardContent>
    </GlassCard>
  );
}
