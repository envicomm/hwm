import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/glass-card";
import { getStatusChartData } from "@/lib/mock-data";

export function WasteStatusChart() {
  const data = getStatusChartData();
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <GlassCard animate animationDelay={0.3} className="p-5">
      <GlassCardHeader className="pb-4">
        <GlassCardTitle className="text-sm font-semibold text-foreground">
          Waste Status Distribution
        </GlassCardTitle>
        <p className="text-xs text-muted-foreground">
          {total} total bags across all generators
        </p>
      </GlassCardHeader>
      <GlassCardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const percentage = ((data.value / total) * 100).toFixed(1);
                    return (
                      <div className="glass-elevated rounded-lg px-3 py-2 shadow-lg">
                        <p className="text-xs font-medium">{data.name}</p>
                        <p className="text-sm font-bold tabular-nums">
                          {data.value} bags ({percentage}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={60}
                content={({ payload }) => (
                  <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
                    {payload?.map((entry, index) => (
                      <div
                        key={`legend-${index}`}
                        className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
                      >
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span>{entry.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
