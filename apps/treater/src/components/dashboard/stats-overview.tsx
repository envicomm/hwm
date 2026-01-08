import { Building2, Package, Clock, FlaskConical } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import {
  mockGenerators,
  getTotalWasteBags,
  getPendingRequestCount,
  getTotalTreatedThisMonth,
} from "@/lib/mock-data";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  delay: number;
}

function StatCard({ title, value, description, icon: Icon, delay }: StatCardProps) {
  return (
    <GlassCard animate animationDelay={delay} className="p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </GlassCard>
  );
}

export function StatsOverview() {
  const activeGenerators = mockGenerators.filter((g) => g.isActive).length;
  const totalBags = getTotalWasteBags();
  const pendingRequests = getPendingRequestCount();
  const treatedThisMonth = getTotalTreatedThisMonth();

  const stats = [
    {
      title: "Total Generators",
      value: activeGenerators,
      description: `${mockGenerators.length - activeGenerators} inactive`,
      icon: Building2,
    },
    {
      title: "Total Waste Bags",
      value: totalBags.toLocaleString(),
      description: "Across all generators",
      icon: Package,
    },
    {
      title: "Pending Requests",
      value: pendingRequests,
      description: "Awaiting collection",
      icon: Clock,
    },
    {
      title: "Treated This Month",
      value: treatedThisMonth,
      description: "Bags processed",
      icon: FlaskConical,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          description={stat.description}
          icon={stat.icon}
          delay={0.1 * (index + 1)}
        />
      ))}
    </div>
  );
}
