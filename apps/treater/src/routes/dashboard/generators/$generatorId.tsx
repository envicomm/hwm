import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@hwm/convex";
import { useActiveTreater } from "@/hooks/use-active-treater";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Building2,
	MapPin,
	Mail,
	Phone,
	QrCode,
	ArrowLeft,
	Loader2,
	AlertTriangle,
} from "lucide-react";
import type { Id } from "@hwm/convex";

export const Route = createFileRoute("/dashboard/generators/$generatorId")({
	beforeLoad: async ({ context }) => {
		if (!context.isAuthenticated) {
			throw redirect({ to: "/auth/$authView", params: { authView: "sign-in" } });
		}
	},
	component: GeneratorDetailPage,
});

function GeneratorDetailPage() {
	const { generatorId } = Route.useParams();
	const { treaterId, isLoading: treaterLoading } = useActiveTreater();

	const {
		data: generator,
		isPending: generatorLoading,
		error,
	} = useQuery({
		...convexQuery(api.generators.index.getById, {
			generatorId: generatorId as Id<"generators">,
			treaterId: treaterId!,
		}),
		enabled: !!treaterId,
	});

	const { data: orgLink, isPending: linkLoading } = useQuery({
		...convexQuery(api.organizationLinks.index.getByGenerator, {
			generatorId: generatorId as Id<"generators">,
		}),
		enabled: !!generator,
	});

	const isLoading = treaterLoading || generatorLoading || linkLoading;

	if (isLoading) {
		return (
			<DashboardLayout>
				<div className="flex items-center justify-center py-12">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			</DashboardLayout>
		);
	}

	if (error) {
		return (
			<DashboardLayout>
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<AlertTriangle className="h-12 w-12 text-destructive mb-4" />
					<p className="text-sm font-medium">Access Denied</p>
					<p className="text-xs text-muted-foreground mt-1">{error.message}</p>
					<Link to="/dashboard">
						<Button variant="outline" className="mt-4">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Dashboard
						</Button>
					</Link>
				</div>
			</DashboardLayout>
		);
	}

	if (!generator) {
		return (
			<DashboardLayout>
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
					<p className="text-sm text-muted-foreground">Generator not found</p>
					<Link to="/dashboard">
						<Button variant="outline" className="mt-4">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Dashboard
						</Button>
					</Link>
				</div>
			</DashboardLayout>
		);
	}

	const qrModeLabels = {
		pre_manufactured: "Pre-manufactured QR",
		hospital_generated: "Hospital Generated QR",
		both: "Both QR Modes",
	};

	return (
		<DashboardLayout>
			<div className="space-y-6">
				{/* Header */}
				<div className="flex items-center gap-4">
					<Link to="/dashboard">
						<Button variant="ghost" size="icon">
							<ArrowLeft className="h-5 w-5" />
						</Button>
					</Link>
					<div className="flex-1">
						<div className="flex items-center gap-3">
							<h1 className="text-2xl font-semibold">{generator.name}</h1>
							<Badge variant={generator.isActive ? "default" : "secondary"}>
								{generator.isActive ? "Active" : "Inactive"}
							</Badge>
						</div>
						<p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
							<MapPin className="h-4 w-4" />
							{generator.address}
						</p>
					</div>
				</div>

				<div className="grid gap-6 lg:grid-cols-2">
					{/* Organization Info Card */}
					<GlassCard className="p-6">
						<h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
							<Building2 className="h-5 w-5" />
							Organization Details
						</h2>
						<dl className="space-y-3">
							<div className="flex justify-between">
								<dt className="text-sm text-muted-foreground">Facility Code</dt>
								<dd className="text-sm font-medium">
									{generator.facilityCode || "Not assigned"}
								</dd>
							</div>
							<div className="flex justify-between">
								<dt className="text-sm text-muted-foreground">QR Mode</dt>
								<dd className="text-sm font-medium">{qrModeLabels[generator.qrMode]}</dd>
							</div>
							<div className="flex justify-between">
								<dt className="text-sm text-muted-foreground">Created</dt>
								<dd className="text-sm font-medium">
									{new Date(generator.createdAt).toLocaleDateString()}
								</dd>
							</div>
							{orgLink && (
								<div className="flex justify-between">
									<dt className="text-sm text-muted-foreground">Organization ID</dt>
									<dd className="text-sm font-mono text-xs">{orgLink.betterAuthOrgId}</dd>
								</div>
							)}
						</dl>
					</GlassCard>

					{/* Contact Info Card */}
					<GlassCard className="p-6">
						<h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
							<Mail className="h-5 w-5" />
							Contact Information
						</h2>
						<dl className="space-y-3">
							<div className="flex justify-between items-center">
								<dt className="text-sm text-muted-foreground flex items-center gap-2">
									<Mail className="h-4 w-4" />
									Email
								</dt>
								<dd className="text-sm font-medium">{generator.contactEmail}</dd>
							</div>
							<div className="flex justify-between items-center">
								<dt className="text-sm text-muted-foreground flex items-center gap-2">
									<Phone className="h-4 w-4" />
									Phone
								</dt>
								<dd className="text-sm font-medium">{generator.contactPhone}</dd>
							</div>
						</dl>
					</GlassCard>

					{/* Storage Configuration Card */}
					<GlassCard className="p-6">
						<h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
							<QrCode className="h-5 w-5" />
							Storage Configuration
						</h2>
						<dl className="space-y-3">
							<div className="flex justify-between">
								<dt className="text-sm text-muted-foreground">Max Capacity (kg)</dt>
								<dd className="text-sm font-medium">
									{generator.maxStorageCapacityKg ?? "Not configured"}
								</dd>
							</div>
							<div className="flex justify-between">
								<dt className="text-sm text-muted-foreground">Max Bag Count</dt>
								<dd className="text-sm font-medium">
									{generator.maxBagCount ?? "Not configured"}
								</dd>
							</div>
							<div className="flex justify-between">
								<dt className="text-sm text-muted-foreground">Alert Threshold</dt>
								<dd className="text-sm font-medium">
									{generator.storageAlertThreshold
										? `${generator.storageAlertThreshold}%`
										: "Not configured"}
								</dd>
							</div>
						</dl>
					</GlassCard>

					{/* Location Card (if available) */}
					{generator.location && (
						<GlassCard className="p-6">
							<h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
								<MapPin className="h-5 w-5" />
								Location
							</h2>
							<dl className="space-y-3">
								<div className="flex justify-between">
									<dt className="text-sm text-muted-foreground">Latitude</dt>
									<dd className="text-sm font-mono">{generator.location.lat}</dd>
								</div>
								<div className="flex justify-between">
									<dt className="text-sm text-muted-foreground">Longitude</dt>
									<dd className="text-sm font-mono">{generator.location.lng}</dd>
								</div>
							</dl>
						</GlassCard>
					)}
				</div>
			</div>
		</DashboardLayout>
	);
}
