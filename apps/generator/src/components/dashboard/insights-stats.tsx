import { useMemo, useState } from "react";
import { Package, Activity } from "lucide-react";
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
} from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import type { MockWasteBag, WasteType } from "@/lib/mock-data";
import {
  getWeeklyWasteTypeData,
  typeLabels,
} from "@/lib/mock-data";

interface InsightsStatsProps {
  bags: MockWasteBag[];
  maxKg: number;
  currentKg: number;
  currentBags?: number;
  maxBags?: number;
  alertThreshold?: number;
}

// Waste type colors matching the design system
const wasteTypeColors: Record<WasteType, string> = {
  infectious: "#ef4444", // red
  sharps: "#f97316", // orange
  pharmaceutical: "#22c55e", // green
  pathological: "#8b5cf6", // purple
  chemical: "#3b82f6", // blue
};

const wasteTypeColorsLight: Record<WasteType, string> = {
  infectious: "bg-red-500",
  sharps: "bg-orange-500",
  pharmaceutical: "bg-green-500",
  pathological: "bg-violet-500",
  chemical: "bg-blue-500",
};

// Mini line chart component
function MiniLineChart({
  data,
}: {
  data: ReturnType<typeof getWeeklyWasteTypeData>;
}) {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [hoveredType, setHoveredType] = useState<WasteType | null>(null);

  const wasteTypes: WasteType[] = [
    "infectious",
    "sharps",
    "pharmaceutical",
    "pathological",
    "chemical",
  ];

  // Get max value for scaling
  const maxValue = useMemo(() => {
    let max = 0;
    for (const day of data) {
      for (const type of wasteTypes) {
        if (day[type] > max) max = day[type];
      }
    }
    return Math.max(max, 1); // At least 1 to avoid division by zero
  }, [data]);

  // Chart dimensions (viewBox coordinates, SVG scales to container)
  const viewBoxWidth = 200;
  const viewBoxHeight = 48;
  const padding = 4;
  const chartWidth = viewBoxWidth - padding * 2;
  const chartHeight = viewBoxHeight - padding * 2;

  // Generate path for each waste type
  const paths = useMemo(() => {
    return wasteTypes.map((type) => {
      const points = data.map((day, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const y =
          padding + chartHeight - (day[type] / maxValue) * chartHeight;
        return `${x},${y}`;
      });
      return {
        type,
        d: `M ${points.join(" L ")}`,
      };
    });
  }, [data, maxValue, chartWidth, chartHeight]);

  // Calculate totals for each type (for legend)
  const typeTotals = useMemo(() => {
    const totals: Record<WasteType, number> = {
      infectious: 0,
      sharps: 0,
      pharmaceutical: 0,
      pathological: 0,
      chemical: 0,
    };
    for (const day of data) {
      for (const type of wasteTypes) {
        totals[type] += day[type];
      }
    }
    // Sort by total, descending
    return wasteTypes
      .map((type) => ({ type, total: totals[type] }))
      .filter((t) => t.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [data]);

  // Get hovered day data
  const hoveredDayData = hoveredDay !== null ? data[hoveredDay] : null;

  return (
    <div className="w-full space-y-2">
      {/* Chart */}
      <div
        className="relative w-full"
        onMouseLeave={() => {
          setHoveredDay(null);
          setHoveredType(null);
        }}
      >
        <svg
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          preserveAspectRatio="none"
          className="w-full h-12 overflow-visible"
        >
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

          {/* Lines for each waste type */}
          {paths.map(({ type, d }) => (
            <path
              key={type}
              d={d}
              fill="none"
              stroke={wasteTypeColors[type]}
              strokeWidth={hoveredType === type || hoveredType === null ? 1.5 : 0.5}
              strokeOpacity={hoveredType === type || hoveredType === null ? 0.8 : 0.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-150"
            />
          ))}

          {/* Hover points */}
          {data.map((day, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            return (
              <g key={day.date}>
                {/* Invisible hit area */}
                <rect
                  x={x - chartWidth / data.length / 2}
                  y={0}
                  width={chartWidth / data.length}
                  height={viewBoxHeight}
                  fill="transparent"
                  onMouseEnter={() => setHoveredDay(index)}
                />
                {/* Vertical line indicator */}
                {hoveredDay === index && (
                  <line
                    x1={x}
                    y1={padding}
                    x2={x}
                    y2={padding + chartHeight}
                    stroke="currentColor"
                    strokeOpacity={0.1}
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
              <span className="font-medium">{hoveredDayData.date}</span>
              <span className="text-muted-foreground ml-1.5">
                {wasteTypes.reduce((sum, type) => sum + hoveredDayData[type], 0)} bags
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Dot legends */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {typeTotals.slice(0, 4).map(({ type }) => (
          <button
            key={type}
            type="button"
            className={cn(
              "flex items-center gap-1 text-[10px] text-muted-foreground transition-opacity",
              hoveredType && hoveredType !== type && "opacity-40"
            )}
            onMouseEnter={() => setHoveredType(type)}
            onMouseLeave={() => setHoveredType(null)}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                wasteTypeColorsLight[type]
              )}
            />
            <span className="capitalize">{typeLabels[type].slice(0, 4)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function InsightsStats({
  bags,
  maxKg,
  currentKg,
  currentBags = 5,
  maxBags = 50,
  alertThreshold = 80,
}: InsightsStatsProps) {
  const weeklyTypeData = useMemo(() => getWeeklyWasteTypeData(bags, 7), [bags]);

  // Storage capacity calculations
  const percentageKg = Math.round((currentKg / maxKg) * 100);
  const percentageBags = Math.round((currentBags / maxBags) * 100);
  const mainPercentage = Math.max(percentageKg, percentageBags);
  const isAlert = mainPercentage >= alertThreshold;
  const isCritical = mainPercentage >= 90;

  const getProgressColor = () => {
    if (isCritical) return "bg-red-500";
    if (isAlert) return "bg-amber-500";
    return "bg-primary";
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Storage Capacity (replacing Storage Runway) */}
      <GlassCard variant="elevated">
        <GlassCardHeader className="pb-2">
          <GlassCardTitle className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Storage Capacity
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="space-y-2">
          {/* Main percentage display */}
          <div className="flex items-baseline justify-between">
            <span
              className={cn(
                "text-3xl font-semibold tabular-nums",
                isCritical && "text-red-500",
                isAlert && !isCritical && "text-amber-500"
              )}
            >
              {mainPercentage}%
            </span>
            <span className="text-xs text-muted-foreground">
              {currentKg.toFixed(1)}/{maxKg}kg
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                getProgressColor()
              )}
              style={{ width: `${Math.min(mainPercentage, 100)}%` }}
            />
          </div>

          {/* Bag count */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {currentBags} of {maxBags} bags
            </span>
            <span>{100 - mainPercentage}% available</span>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Weekly Waste Type Trend (replacing Avg Pickup Time) */}
      <GlassCard variant="elevated">
        <GlassCardHeader className="pb-2">
          <GlassCardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            7-Day Waste Trend
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <MiniLineChart data={weeklyTypeData} />
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
