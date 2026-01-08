import { useState } from "react";
import { Package, Trash2 } from "lucide-react";
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
} from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  mockCollectionRequests,
  mockDisposalBatches,
  collectionStatusColors,
  disposalStatusColors,
  type CollectionRequestStatus,
  type DisposalBatchStatus,
} from "@/lib/mock-data";

interface RecentActivityTableProps {
  className?: string;
  animate?: boolean;
  animationDelay?: number;
}

type TabValue = "collections" | "disposals";

const collectionStatusLabels: Record<CollectionRequestStatus, string> = {
  pending: "Pending",
  assigned: "Assigned",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const disposalStatusLabels: Record<DisposalBatchStatus, string> = {
  aggregating: "Aggregating",
  sealed: "Sealed",
  disposal_requested: "Requested",
  in_transit: "In Transit",
  disposed: "Disposed",
};

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function RecentActivityTable({
  className,
  animate = false,
  animationDelay,
}: RecentActivityTableProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("collections");

  // Get recent items
  const recentCollections = mockCollectionRequests
    .filter((r) => r.status !== "cancelled")
    .slice(0, 5);

  const recentDisposals = mockDisposalBatches.slice(0, 5);

  return (
    <GlassCard
      variant="elevated"
      animate={animate}
      animationDelay={animationDelay}
      className={cn("flex flex-col", className)}
    >
      <GlassCardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <GlassCardTitle className="text-base font-medium">
            Recent Operations
          </GlassCardTitle>
          {/* Tab switcher */}
          <div className="flex gap-1 p-0.5 rounded-lg bg-muted/50">
            <button
              type="button"
              onClick={() => setActiveTab("collections")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                activeTab === "collections"
                  ? "bg-white dark:bg-slate-800 shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Package className="h-3 w-3" />
              Collections
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("disposals")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                activeTab === "disposals"
                  ? "bg-white dark:bg-slate-800 shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Trash2 className="h-3 w-3" />
              Disposals
            </button>
          </div>
        </div>
      </GlassCardHeader>

      <GlassCardContent className="flex-1 overflow-auto">
        {activeTab === "collections" ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">Generator</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Driver</TableHead>
                <TableHead className="text-xs text-right">Bags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentCollections.map((request) => (
                <TableRow key={request.id} className="hover:bg-muted/30">
                  <TableCell className="py-2.5">
                    <div>
                      <p className="text-sm font-medium truncate max-w-[160px]">
                        {request.generatorName}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDate(request.requestedPickupDate)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5"
                      style={{
                        backgroundColor: `${collectionStatusColors[request.status]}15`,
                        color: collectionStatusColors[request.status],
                        borderColor: `${collectionStatusColors[request.status]}30`,
                      }}
                    >
                      {collectionStatusLabels[request.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2.5 text-xs text-muted-foreground">
                    {request.driverName || "—"}
                  </TableCell>
                  <TableCell className="py-2.5 text-xs text-right tabular-nums">
                    {request.estimatedBagCount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">Batch</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Driver</TableHead>
                <TableHead className="text-xs text-right">Weight</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentDisposals.map((batch) => (
                <TableRow key={batch.id} className="hover:bg-muted/30">
                  <TableCell className="py-2.5">
                    <div>
                      <p className="text-sm font-medium">{batch.batchNumber}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {batch.totalBagCount} bags
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5"
                      style={{
                        backgroundColor: `${disposalStatusColors[batch.status]}15`,
                        color: disposalStatusColors[batch.status],
                        borderColor: `${disposalStatusColors[batch.status]}30`,
                      }}
                    >
                      {disposalStatusLabels[batch.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2.5 text-xs text-muted-foreground">
                    {batch.driverName || "—"}
                  </TableCell>
                  <TableCell className="py-2.5 text-xs text-right tabular-nums">
                    {batch.totalWeightKg}kg
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </GlassCardContent>
    </GlassCard>
  );
}
