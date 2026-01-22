import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api, type Doc } from "@hwm/convex";
import { useActiveTreater } from "@/hooks/use-active-treater";
import { usePermissions } from "@/hooks/usePermissions";
import {
	Truck,
	MapPin,
	Mail,
	Phone,
	Search,
	Plus,
	AlertTriangle,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface HaulerCardProps {
	hauler: Doc<"haulers">;
	delay: number;
	onViewDetails: (hauler: Doc<"haulers">) => void;
}

function HaulerCard({ hauler, delay, onViewDetails }: HaulerCardProps) {
	return (
		<GlassCard
			animate
			animationDelay={delay}
			interactive
			className="p-5 space-y-4"
			onClick={() => onViewDetails(hauler)}
		>
			{/* Header */}
			<div className="flex items-start justify-between gap-3">
				<div className="flex items-start gap-3 min-w-0">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
						<Truck className="h-5 w-5 text-primary" />
					</div>
					<div className="min-w-0">
						<h3 className="font-semibold text-sm truncate">{hauler.name}</h3>
						<p className="text-xs text-muted-foreground truncate flex items-center gap-1">
							<MapPin className="h-3 w-3 shrink-0" />
							{hauler.address.split(",").slice(0, 2).join(",").trim()}
						</p>
					</div>
				</div>
				<Badge
					variant={hauler.isActive ? "default" : "secondary"}
					className="shrink-0 text-[10px]"
				>
					{hauler.isActive ? "Active" : "Inactive"}
				</Badge>
			</div>

			{/* Contact Info */}
			<div className="grid grid-cols-2 gap-2 text-xs">
				<div className="flex items-center gap-1.5 text-muted-foreground truncate">
					<Mail className="h-3 w-3 shrink-0" />
					<span className="truncate">{hauler.contactEmail.split("@")[0]}@...</span>
				</div>
				<div className="flex items-center gap-1.5 text-muted-foreground truncate">
					<Phone className="h-3 w-3 shrink-0" />
					<span className="truncate">{hauler.contactPhone.slice(-8)}</span>
				</div>
			</div>

			{/* License Info */}
			<div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t">
				<span>License: {hauler.licenseNumber || "Not provided"}</span>
				<span>Since {new Date(hauler.createdAt).toLocaleDateString()}</span>
			</div>
		</GlassCard>
	);
}

function HaulersLoadingSkeleton() {
	return (
		<div className="space-y-4">
			<div className="h-8 w-48 bg-muted animate-pulse rounded" />
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{[1, 2, 3].map((i) => (
					<div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
				))}
			</div>
		</div>
	);
}

function HaulersErrorState({ error }: { error: Error }) {
	return (
		<div className="flex flex-col items-center justify-center py-12 text-center">
			<AlertTriangle className="h-12 w-12 text-destructive mb-4" />
			<p className="text-sm text-muted-foreground">Failed to load haulers</p>
			<p className="text-xs text-muted-foreground mt-1">{error.message}</p>
		</div>
	);
}

interface HaulersOverviewProps {
	onAddHauler?: () => void;
}

export function HaulersOverview({ onAddHauler }: HaulersOverviewProps) {
	const navigate = useNavigate();
	const { treaterId, isLoading: treaterLoading } = useActiveTreater();
	const { can } = usePermissions();
	const [searchQuery, setSearchQuery] = useState("");
	const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

	const canCreateHauler = can("hauler", "create");

	const {
		data: haulers,
		isPending: haulersLoading,
		error,
	} = useQuery({
		...convexQuery(api.haulers.index.getByTreater, {
			treaterId: treaterId!,
			includeInactive: true,
		}),
		enabled: !!treaterId,
	});

	const isLoading = treaterLoading || haulersLoading;

	const filteredHaulers = (haulers ?? []).filter((hauler) => {
		const matchesSearch =
			hauler.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			hauler.address.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesFilter =
			filter === "all" ||
			(filter === "active" && hauler.isActive) ||
			(filter === "inactive" && !hauler.isActive);

		return matchesSearch && matchesFilter;
	});

	const handleViewDetails = (hauler: Doc<"haulers">) => {
		navigate({
			to: "/dashboard/haulers/$haulerId",
			params: { haulerId: hauler._id },
		});
	};

	if (isLoading) {
		return <HaulersLoadingSkeleton />;
	}

	if (error) {
		return <HaulersErrorState error={error} />;
	}

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between gap-4">
				<div>
					<h2 className="text-lg font-semibold">Haulers</h2>
					<p className="text-sm text-muted-foreground">
						Trucking partners that collect waste
					</p>
				</div>
				{onAddHauler && canCreateHauler && (
					<Button onClick={onAddHauler} className="gap-2">
						<Plus className="h-4 w-4" />
						Add Hauler
					</Button>
				)}
			</div>

			{/* Filters */}
			<div className="flex items-center gap-3">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search haulers..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>
				<div className="flex items-center gap-1">
					{(["all", "active", "inactive"] as const).map((f) => (
						<Button
							key={f}
							variant={filter === f ? "default" : "ghost"}
							size="sm"
							onClick={() => setFilter(f)}
							className="text-xs"
						>
							{f.charAt(0).toUpperCase() + f.slice(1)}
						</Button>
					))}
				</div>
			</div>

			{/* Grid */}
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{filteredHaulers.map((hauler, index) => (
					<HaulerCard
						key={hauler._id}
						hauler={hauler}
						delay={0.05 * (index + 1)}
						onViewDetails={handleViewDetails}
					/>
				))}
			</div>

			{filteredHaulers.length === 0 && (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<Truck className="h-12 w-12 text-muted-foreground/50 mb-4" />
					<p className="text-sm text-muted-foreground">No haulers found</p>
					<p className="text-xs text-muted-foreground mt-1">
						{searchQuery || filter !== "all"
							? "Try adjusting your search or filter"
							: "Add a hauler to get started"}
					</p>
				</div>
			)}
		</div>
	);
}
