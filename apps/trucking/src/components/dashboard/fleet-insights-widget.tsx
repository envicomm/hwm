import { useMemo, useState } from "react";
import { Activity, Package } from "lucide-react";
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
} from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import {
  getWeeklyActivityData,
  getPendingDisposals,
  getActiveCollections,
} from "@/lib/mock-data";

interface FleetInsightsWidgetProps {
  className?: string;
  animate?: boolean;
  animationDelay?: number;
}

// Mini sparkline chart
function MiniSparkline({
  data,
}: {
  data: Array<{ day: string; collections: number; disposals: number }>;
}) {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  // Get max value for scaling
  const maxValue = useMemo(() => {
    let max = 0;
    for (const day of data) {
      if (day.collections > max) max = day.collections;
      if (day.disposals > max) max = day.disposals;
    }
    return Math.max(max, 1);
  }, [data]);

  // Chart dimensions
  const width = 200;
  const height = 44;
  const padding = 4;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Generate paths
  const collectionsPath = useMemo(() => {
    const points = data.map((day, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y =
        padding + chartHeight - (day.collections / maxValue) * chartHeight;
      return `${x},${y}`;
    });
    return `M ${points.join(" L ")}`;
  }, [data, maxValue, chartWidth, chartHeight]);

  const disposalsPath = useMemo(() => {
    const points = data.map((day, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y =
        padding + chartHeight - (day.disposals / maxValue) * chartHeight;
      return `${x},${y}`;
    });
    return `M ${points.join(" L ")}`;
  }, [data, maxValue, chartWidth, chartHeight]);

  const hoveredDayData = hoveredDay !== null ? data[hoveredDay] : null;

  return (
    <div className="space-y-1">
      <div
        className="relative"
        onMouseLeave={() => setHoveredDay(null)}
      >
        <svg width={width} height={height} className="overflow-visible">
          {/* Grid lines */}
          {[0, 0.5, 1].map((ratio) => (
            <line
              key={ratio}
              x1={padding}
              y1={padding + chartHeight * (1 - ratio)}
              x2={padding + chartWidth}
              y2={padding + chartHeight * (1 - ratio)}
              stroke="currentColor"
              strokeOpacity={0.05}
              strokeWidth={1}
            />
          ))}

          {/* Collections line - amber */}
          <path
            d={collectionsPath}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-opacity"
          />

          {/* Disposals line - emerald */}
          <path
            d={disposalsPath}
            fill="none"
            stroke="#10b981"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="4,2"
            className="transition-opacity"
          />

          {/* Hover areas */}
          {data.map((_, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            return (
              <g key={index}>
                <rect
                  x={x - chartWidth / data.length / 2}
                  y={0}
                  width={chartWidth / data.length}
                  height={height}
                  fill="transparent"
                  onMouseEnter={() => setHoveredDay(index)}
                />
                {hoveredDay === index && (
                  <line
                    x1={x}
                    y1={padding}
                    x2={x}
                    y2={padding + chartHeight}
                    stroke="currentColor"
                    strokeOpacity={0.15}
                    strokeWidth={1}
                    strokeDasharray="2,2"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {hoveredDayData && (
          <div className="absolute -top-1 left-0 right-0 flex justify-center pointer-events-none z-10">
            <div className="glass-subtle rounded px-2 py-1 text-[10px] shadow-sm">
              <span className="font-medium">{hoveredDayData.day}</span>
              <span className="text-amber-600 ml-2">
                {hoveredDayData.collections} col
              </span>
              <span className="text-emerald-600 ml-2">
                {hoveredDayData.disposals} disp
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-4">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="w-3 h-0.5 rounded bg-amber-500" />
          <span>Collections</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="w-3 h-0.5 rounded bg-emerald-500 border-dashed" />
          <span>Disposals</span>
        </div>
      </div>
    </div>
  );
}

export function FleetInsightsWidget({
  className,
  animate = false,
  animationDelay,
}: FleetInsightsWidgetProps) {
  const weeklyData = useMemo(() => getWeeklyActivityData(), []);
  const activeCollections = getActiveCollections();
  const pendingDisposals = getPendingDisposals();

  return (
    <div className={cn("grid gap-3 md:grid-cols-2", className)}>
      {/* Active Operations Card */}
      <GlassCard
        variant="elevated"
        animate={animate}
        animationDelay={animationDelay}
        className="p-3"
      >
        <GlassCardHeader className="pb-1">
          <GlassCardTitle className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Active Operations
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-semibold tabular-nums">
              {activeCollections}
            </span>
            <span className="text-xs text-muted-foreground">in progress</span>
          </div>

          {/* Mini progress indicators */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Collections</span>
              <span className="font-medium">{activeCollections}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{ width: `${Math.min(activeCollections * 10, 100)}%` }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Pending Disposals</span>
              <span className="font-medium">{pendingDisposals}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-violet-500 transition-all duration-500"
                style={{ width: `${Math.min(pendingDisposals * 15, 100)}%` }}
              />
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Weekly Trend Chart */}
      <GlassCard
        variant="elevated"
        animate={animate}
        animationDelay={animationDelay ? animationDelay + 0.1 : undefined}
        className="p-3"
      >
        <GlassCardHeader className="pb-1">
          <GlassCardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            7-Day Activity
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <MiniSparkline data={weeklyData} />
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
