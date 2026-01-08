import {
  GlassCard,
  GlassCardContent,
} from "@/components/ui/glass-card";
import {
  Package,
  Trash2,
  Users,
  CheckCircle2,
} from "lucide-react";
import {
  getActiveCollections,
  getPendingDisposals,
  getActiveDriverCount,
  getTotalCompletedToday,
} from "@/lib/mock-data";

const stats = [
  {
    label: "Active Collections",
    value: getActiveCollections(),
    icon: Package,
    description: "In progress pickups",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    label: "Pending Disposals",
    value: getPendingDisposals(),
    icon: Trash2,
    description: "Awaiting transport",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    label: "Active Drivers",
    value: getActiveDriverCount(),
    icon: Users,
    description: "Currently on route",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    label: "Completed Today",
    value: getTotalCompletedToday(),
    icon: CheckCircle2,
    description: "Successful pickups",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
];

export function StatsOverview() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <GlassCard
          key={stat.label}
          variant="elevated"
          animate
          animationDelay={0.1 * (index + 1)}
          className="p-5"
        >
          <GlassCardContent className="pt-0">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </div>
              <div className={`p-2.5 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      ))}
    </div>
  );
}
