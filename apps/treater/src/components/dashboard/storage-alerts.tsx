import { AlertTriangle, Building2, TrendingUp } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/glass-card";
import { getGeneratorsNearCapacity, getStorageUtilization } from "@/lib/mock-data";

export function StorageAlerts() {
  const alertGenerators = getGeneratorsNearCapacity().slice(0, 5);

  if (alertGenerators.length === 0) {
    return (
      <GlassCard animate animationDelay={0.4} className="p-5">
        <GlassCardHeader className="pb-4">
          <GlassCardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            Storage Alerts
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 mb-3">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-emerald-600">All Clear</p>
            <p className="text-xs text-muted-foreground mt-1">
              No generators approaching capacity
            </p>
          </div>
        </GlassCardContent>
      </GlassCard>
    );
  }

  return (
    <GlassCard animate animationDelay={0.4} className="p-5">
      <GlassCardHeader className="pb-4">
        <GlassCardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Storage Alerts
        </GlassCardTitle>
        <p className="text-xs text-muted-foreground">
          {alertGenerators.length} generator{alertGenerators.length !== 1 ? "s" : ""} near capacity
        </p>
      </GlassCardHeader>
      <GlassCardContent className="space-y-3">
        {alertGenerators.map((generator, index) => {
          const utilization = getStorageUtilization(generator);
          const isCritical = utilization >= 95;

          return (
            <div
              key={generator.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isCritical
                  ? "bg-red-50 dark:bg-red-950/20"
                  : "bg-amber-50 dark:bg-amber-950/20"
              }`}
              style={{
                animationDelay: `${0.1 * (index + 1)}s`,
              }}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  isCritical ? "bg-red-100 dark:bg-red-900/30" : "bg-amber-100 dark:bg-amber-900/30"
                }`}
              >
                <Building2
                  className={`h-4 w-4 ${isCritical ? "text-red-600" : "text-amber-600"}`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{generator.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isCritical ? "bg-red-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${Math.min(utilization, 100)}%` }}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-medium tabular-nums ${
                      isCritical ? "text-red-600" : "text-amber-600"
                    }`}
                  >
                    {utilization}%
                  </span>
                </div>
              </div>
              {isCritical && (
                <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse-alert shrink-0" />
              )}
            </div>
          );
        })}
      </GlassCardContent>
    </GlassCard>
  );
}
