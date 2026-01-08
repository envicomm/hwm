import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
} from "@/components/ui/glass-card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getWeeklyActivityData } from "@/lib/mock-data";

export function WeeklyActivityChart() {
  const data = getWeeklyActivityData();

  return (
    <GlassCard variant="elevated" animate animationDelay={0.7} className="p-5">
      <GlassCardHeader className="pb-4">
        <GlassCardTitle>Weekly Activity</GlassCardTitle>
        <GlassCardDescription>
          Collections and disposals over the past 7 days
        </GlassCardDescription>
      </GlassCardHeader>
      <GlassCardContent>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={4}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="rgba(0,0,0,0.06)"
              />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 12 }}
              />
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
                verticalAlign="top"
                align="right"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground capitalize">
                    {value}
                  </span>
                )}
              />
              <Bar
                dataKey="collections"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                dataKey="disposals"
                fill="#8b5cf6"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
