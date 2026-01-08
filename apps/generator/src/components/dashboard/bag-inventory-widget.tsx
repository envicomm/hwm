import { QrCode, ShoppingCart, Printer, AlertTriangle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	GlassCard,
	GlassCardHeader,
	GlassCardTitle,
	GlassCardContent,
	GlassCardFooter,
} from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

type QrMode = "pre_manufactured" | "hospital_generated" | "both";

interface BagDistribution {
	id: string;
	quantity: number;
	shippedAt: number;
	receivedAt?: number;
	status: "pending" | "shipped" | "received" | "partial";
}

interface BagInventoryWidgetProps {
	availableBags: number;
	qrMode: QrMode;
	lowStockThreshold?: number;
	recentDistributions?: BagDistribution[];
	className?: string;
	animate?: boolean;
	animationDelay?: number;
}

const qrModeLabels: Record<QrMode, string> = {
	pre_manufactured: "Pre-manufactured",
	hospital_generated: "Hospital Generated",
	both: "Both Options",
};

const qrModeDescriptions: Record<QrMode, string> = {
	pre_manufactured: "Order QR-tagged bags from supplier",
	hospital_generated: "Print and attach your own QR codes",
	both: "Order or generate QR codes as needed",
};

function formatRelativeDate(timestamp: number): string {
	const now = Date.now();
	const diff = now - timestamp;
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));

	if (days === 0) return "Today";
	if (days === 1) return "Yesterday";
	if (days < 7) return `${days} days ago`;
	if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
	return `${Math.floor(days / 30)} months ago`;
}

export function BagInventoryWidget({
	availableBags,
	qrMode,
	lowStockThreshold = 20,
	recentDistributions = [],
	className,
	animate = false,
	animationDelay,
}: BagInventoryWidgetProps) {
	const isLowStock = availableBags <= lowStockThreshold;
	const isCritical = availableBags <= lowStockThreshold / 2;
	const canOrder = qrMode === "pre_manufactured" || qrMode === "both";
	const canGenerate = qrMode === "hospital_generated" || qrMode === "both";

	const getStockStatus = () => {
		if (isCritical) return { label: "Critical", variant: "destructive" as const };
		if (isLowStock) return { label: "Low Stock", variant: "secondary" as const };
		return { label: "In Stock", variant: "outline" as const };
	};

	const stockStatus = getStockStatus();

	return (
		<GlassCard
			variant="elevated"
			animate={animate}
			animationDelay={animationDelay}
			className={cn("flex flex-col", className)}
		>
			<GlassCardHeader>
				<div className="flex items-center justify-between">
					<GlassCardTitle className="flex items-center gap-2">
						<QrCode className="h-4 w-4" />
						QR Bag Inventory
					</GlassCardTitle>
					<Badge
						variant={stockStatus.variant}
						className={cn(
							isCritical && "pulse-alert bg-red-500/10 text-red-500 border-red-500/20",
						)}
					>
						{isLowStock && <AlertTriangle className="h-3 w-3 mr-1" />}
						{stockStatus.label}
					</Badge>
				</div>
			</GlassCardHeader>

			<GlassCardContent className="flex-1 space-y-4">
				{/* Main count */}
				<div className="text-center py-2">
					<p
						className={cn(
							"text-4xl font-bold tabular-nums",
							isCritical && "text-red-500",
							isLowStock && !isCritical && "text-amber-500",
						)}
					>
						{availableBags}
					</p>
					<p className="text-sm text-muted-foreground">bags available</p>
				</div>

				{/* Progress bar */}
				<div className="space-y-1.5">
					<div className="flex justify-between text-xs text-muted-foreground">
						<span>Inventory Level</span>
						<span>{Math.min(availableBags, 100)}%</span>
					</div>
					<div className="h-2 rounded-full bg-muted/50 overflow-hidden">
						<div
							className={cn(
								"h-full rounded-full transition-all duration-500",
								isCritical && "bg-red-500",
								isLowStock && !isCritical && "bg-amber-500",
								!isLowStock && "bg-primary",
							)}
							style={{ width: `${Math.min(availableBags, 100)}%` }}
						/>
					</div>
				</div>

				{/* QR Mode info */}
				<div className="rounded-md bg-muted/30 p-2.5 space-y-1">
					<p className="text-xs font-medium">{qrModeLabels[qrMode]}</p>
					<p className="text-[10px] text-muted-foreground">
						{qrModeDescriptions[qrMode]}
					</p>
				</div>

				{/* Recent distributions */}
				{recentDistributions.length > 0 && (
					<div className="space-y-2">
						<p className="text-xs font-medium text-muted-foreground">
							Recent Shipments
						</p>
						<div className="space-y-1.5">
							{recentDistributions.slice(0, 3).map((dist) => (
								<div
									key={dist.id}
									className="flex items-center justify-between text-xs"
								>
									<span className="flex items-center gap-1.5">
										<Package className="h-3 w-3 text-muted-foreground" />
										{dist.quantity} bags
									</span>
									<span className="text-muted-foreground">
										{formatRelativeDate(dist.shippedAt)}
									</span>
								</div>
							))}
						</div>
					</div>
				)}
			</GlassCardContent>

			{isLowStock && (
				<GlassCardFooter className="flex gap-2 justify-center">
					{canOrder && (
						<Button size="sm" variant={isCritical ? "default" : "outline"}>
							<ShoppingCart className="h-4 w-4 mr-1.5" />
							Request Bags
						</Button>
					)}
					{canGenerate && (
						<Button size="sm" variant="outline">
							<Printer className="h-4 w-4 mr-1.5" />
							Generate QR
						</Button>
					)}
				</GlassCardFooter>
			)}
		</GlassCard>
	);
}
