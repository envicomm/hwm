import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
} from "@/components/ui/glass-card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { getCollectionsByStatus, collectionStatusColors } from "@/lib/mock-data";

const statusLabels: Record<string, string> = {
  pending: "Pending",
  assigned: "Assigned",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function CollectionsByStatusChart() {
  const counts = getCollectionsByStatus();

  const data = Object.entries(counts)
    .filter(([_, value]) => value > 0)
    .map(([status, value]) => ({
      name: statusLabels[status],
      value,
      color: collectionStatusColors[status as keyof typeof collectionStatusColors],
    }));

  return (
    <GlassCard variant="elevated" animate animationDelay={0.5} className="p-5">
      <GlassCardHeader className="pb-4">
        <GlassCardTitle>Collections by Status</GlassCardTitle>
        <GlassCardDescription>
          Distribution of collection requests
        </GlassCardDescription>
      </GlassCardHeader>
      <GlassCardContent>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "8px",
                  border: "1px solid rgba(0, 0, 0, 0.1)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                }}
                itemStyle={{ color: "#1f2937" }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
