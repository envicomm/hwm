import { Package, AlertTriangle } from "lucide-react";
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
} from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

interface StorageCapacityWidgetProps {
  currentKg: number;
  maxKg: number;
  currentBags: number;
  maxBags: number;
  alertThreshold?: number;
  className?: string;
  animate?: boolean;
  animationDelay?: number;
}

export function StorageCapacityWidget({
  currentKg,
  maxKg,
  currentBags,
  maxBags,
  alertThreshold = 80,
  className,
  animate = false,
  animationDelay,
}: StorageCapacityWidgetProps) {
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

  const getStatusText = () => {
    if (isCritical) return "Critical";
    if (isAlert) return "Warning";
    return "Normal";
  };

  return (
    <GlassCard
      variant="elevated"
      animate={animate}
      animationDelay={animationDelay}
      className={cn("flex flex-col", className)}
    >
      <GlassCardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <GlassCardTitle className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4" />
            Storage Capacity
          </GlassCardTitle>
          {isAlert && (
            <span
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                isCritical ? "text-red-500" : "text-amber-500"
              )}
            >
              <AlertTriangle className="h-3 w-3" />
              {getStatusText()}
            </span>
          )}
        </div>
      </GlassCardHeader>

      <GlassCardContent className="space-y-3">
        {/* Main percentage display */}
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-semibold tabular-nums">
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
  );
}
