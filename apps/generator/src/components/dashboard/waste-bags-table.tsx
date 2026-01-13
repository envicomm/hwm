import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WasteStatus, WasteType } from "@/lib/mock-data";
import { statusLabels, typeLabels } from "@/lib/mock-data";
import { Doc } from "@hwm/convex";

interface WasteBagsTableProps {
  bags: Doc<"wasteBags">[];
}

function getStatusVariant(
  status: WasteStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "initialized":
    case "to_be_collected":
      return "outline";
    case "collected":
    case "treated":
      return "default";
    case "aggregated":
    case "disposal_requested":
    case "disposed":
      return "secondary";
    default:
      return "secondary";
  }
}

function getTypeClassName(type: WasteType): string {
  const classes: Record<WasteType, string> = {
    infectious: "bg-red-100 text-red-800 hover:bg-red-100",
    sharps: "bg-orange-100 text-orange-800 hover:bg-orange-100",
    pharmaceutical: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    pathological: "bg-purple-100 text-purple-800 hover:bg-purple-100",
    chemical: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  };
  return classes[type];
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
}

function formatWeight(weightKg: number | null): string {
  if (weightKg === null) return "-";
  return `${weightKg} kg`;
}

export function WasteBagsTable({ bags }: WasteBagsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>QR Code</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Weight</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bags.map((bag) => (
          <TableRow key={bag._id}>
            <TableCell className="font-mono text-xs">{bag.qrCode}</TableCell>
            <TableCell>
              <Badge
                variant="secondary"
                className={cn(
                  "font-normal",
                  getTypeClassName(bag.wasteType as WasteType)
                )}
              >
                {typeLabels[bag.wasteType as WasteType]}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(bag.status as WasteStatus)}>
                {statusLabels[bag.status as WasteStatus]}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatWeight(bag.weightKg ?? null)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(bag.createdAt)}
            </TableCell>
          </TableRow>
        ))}
        {bags.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={5}
              className="text-center text-muted-foreground"
            >
              No waste bags found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
