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
  mockCollectionRequests,
  collectionStatusColors,
  type CollectionRequestStatus,
} from "@/lib/mock-data";
import { Package } from "lucide-react";

const statusLabels: Record<CollectionRequestStatus, string> = {
  pending: "Pending",
  assigned: "Assigned",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

function formatDate(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CollectionRequestsTable() {
  // Show only recent/active requests
  const recentRequests = mockCollectionRequests
    .filter((r) => r.status !== "cancelled")
    .slice(0, 6);

  return (
    <GlassCard variant="elevated" animate animationDelay={0.9} className="p-5">
      <GlassCardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          <GlassCardTitle>Recent Collection Requests</GlassCardTitle>
        </div>
        <GlassCardDescription>
          Latest pickup requests from generators
        </GlassCardDescription>
      </GlassCardHeader>
      <GlassCardContent>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs">Generator</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Driver</TableHead>
              <TableHead className="text-xs">Scheduled</TableHead>
              <TableHead className="text-xs text-right">Bags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium text-sm">
                  {request.generatorName}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-2"
                    style={{
                      backgroundColor: `${collectionStatusColors[request.status]}20`,
                      color: collectionStatusColors[request.status],
                    }}
                  >
                    {statusLabels[request.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {request.driverName || "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(request.requestedPickupDate)}
                </TableCell>
                <TableCell className="text-sm text-right font-medium">
                  {request.estimatedBagCount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </GlassCardContent>
    </GlassCard>
  );
}
