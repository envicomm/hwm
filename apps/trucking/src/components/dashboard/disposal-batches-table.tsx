import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
} from "@/components/ui/glass-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  mockDisposalBatches,
  disposalStatusColors,
  type DisposalBatchStatus,
} from "@/lib/mock-data";
import { Trash2 } from "lucide-react";

const statusLabels: Record<DisposalBatchStatus, string> = {
  aggregating: "Aggregating",
  sealed: "Sealed",
  disposal_requested: "Requested",
  in_transit: "In Transit",
  disposed: "Disposed",
};

export function DisposalBatchesTable() {
  // Show pending and in-transit batches first
  const activeBatches = mockDisposalBatches
    .filter((b) => b.status !== "disposed")
    .slice(0, 5);

  return (
    <GlassCard variant="elevated" animate animationDelay={1.0} className="p-5">
      <GlassCardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-primary" />
          <GlassCardTitle>Pending Disposal Batches</GlassCardTitle>
        </div>
        <GlassCardDescription>
          Batches awaiting transport to disposal sites
        </GlassCardDescription>
      </GlassCardHeader>
      <GlassCardContent>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs">Batch #</TableHead>
              <TableHead className="text-xs">Treater</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs text-right">Weight (kg)</TableHead>
              <TableHead className="text-xs">Driver</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeBatches.map((batch) => (
              <TableRow key={batch.id}>
                <TableCell className="font-mono text-sm font-medium">
                  {batch.batchNumber}
                </TableCell>
                <TableCell className="text-sm">
                  {batch.treaterName}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-2"
                    style={{
                      backgroundColor: `${disposalStatusColors[batch.status]}20`,
                      color: disposalStatusColors[batch.status],
                    }}
                  >
                    {statusLabels[batch.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-right font-medium">
                  {batch.totalWeightKg.toLocaleString()}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {batch.driverName || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </GlassCardContent>
    </GlassCard>
  );
}
