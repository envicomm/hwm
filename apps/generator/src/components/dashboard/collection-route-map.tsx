import { useRef, useEffect, useState } from "react";
import Map, { Marker, Source, Layer, type MapRef } from "react-map-gl/mapbox";
import {
	Truck,
	MapPin,
	Clock,
	Navigation,
	AlertCircle,
} from "lucide-react";
import {
	GlassCard,
	GlassCardHeader,
	GlassCardTitle,
	GlassCardContent,
} from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import "mapbox-gl/dist/mapbox-gl.css";

interface Location {
	lat: number;
	lng: number;
}

interface RouteStop {
	id: string;
	name: string;
	location: Location;
	order: number;
	isCurrentGenerator?: boolean;
}

interface CollectionRouteMapProps {
	generatorLocation: Location;
	routeStops?: RouteStop[];
	driverLocation?: Location;
	estimatedArrival?: Date;
	currentStopIndex?: number;
	hasActiveCollection?: boolean;
	className?: string;
	animate?: boolean;
	animationDelay?: number;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// Teal-themed map style
const mapStyle = "mapbox://styles/mapbox/light-v11";

function formatETA(date: Date): string {
	const now = new Date();
	const diff = date.getTime() - now.getTime();
	const minutes = Math.floor(diff / (1000 * 60));

	if (minutes < 0) return "Arriving now";
	if (minutes < 60) return `${minutes} min`;
	const hours = Math.floor(minutes / 60);
	const remainingMins = minutes % 60;
	return `${hours}h ${remainingMins}m`;
}

function NoActiveCollection() {
	return (
		<div className="h-full flex flex-col items-center justify-center text-center p-4">
			<div className="rounded-full bg-muted/50 p-3 mb-3">
				<Truck className="h-6 w-6 text-muted-foreground" />
			</div>
			<p className="text-sm font-medium text-muted-foreground">
				No Active Collection
			</p>
			<p className="text-xs text-muted-foreground/70 mt-1">
				A map will appear when a collection is scheduled
			</p>
		</div>
	);
}

function NoMapToken() {
	return (
		<div className="h-full flex flex-col items-center justify-center text-center p-4">
			<div className="rounded-full bg-amber-500/10 p-3 mb-3">
				<AlertCircle className="h-6 w-6 text-amber-500" />
			</div>
			<p className="text-sm font-medium text-muted-foreground">
				Map Not Configured
			</p>
			<p className="text-xs text-muted-foreground/70 mt-1">
				Add VITE_MAPBOX_ACCESS_TOKEN to enable maps
			</p>
		</div>
	);
}

export function CollectionRouteMap({
	generatorLocation,
	routeStops = [],
	driverLocation,
	estimatedArrival,
	currentStopIndex = 0,
	hasActiveCollection = false,
	className,
	animate = false,
	animationDelay,
}: CollectionRouteMapProps) {
	const mapRef = useRef<MapRef>(null);
	const [mapLoaded, setMapLoaded] = useState(false);

	// Calculate bounds to fit all points
	useEffect(() => {
		if (!mapRef.current || !mapLoaded || !hasActiveCollection) return;

		const points: Location[] = [generatorLocation];
		if (driverLocation) points.push(driverLocation);
		routeStops.forEach((stop) => points.push(stop.location));

		if (points.length > 1) {
			const lngs = points.map((p) => p.lng);
			const lats = points.map((p) => p.lat);

			mapRef.current.fitBounds(
				[
					[Math.min(...lngs) - 0.01, Math.min(...lats) - 0.01],
					[Math.max(...lngs) + 0.01, Math.max(...lats) + 0.01],
				],
				{ padding: 40, duration: 1000 },
			);
		}
	}, [
		mapLoaded,
		hasActiveCollection,
		generatorLocation,
		driverLocation,
		routeStops,
	]);

	// Generate route line GeoJSON
	const routeGeoJSON = {
		type: "Feature" as const,
		properties: {},
		geometry: {
			type: "LineString" as const,
			coordinates: [
				...(driverLocation ? [[driverLocation.lng, driverLocation.lat]] : []),
				...routeStops
					.sort((a, b) => a.order - b.order)
					.map((stop) => [stop.location.lng, stop.location.lat]),
			],
		},
	};

	// Find current generator in route
	const generatorStop = routeStops.find((s) => s.isCurrentGenerator);
	const generatorRouteOrder = generatorStop?.order ?? 0;

	return (
		<GlassCard
			variant="elevated"
			animate={animate}
			animationDelay={animationDelay}
			className={cn("flex flex-col overflow-hidden p-0", className)}
		>
			<GlassCardHeader className="pb-2 px-4 pt-4">
				<div className="flex items-center justify-between">
					<GlassCardTitle className="flex items-center gap-2">
						<Navigation className="h-4 w-4" />
						Collection Route
					</GlassCardTitle>
					{hasActiveCollection && estimatedArrival && (
						<Badge variant="outline" className="gap-1">
							<Clock className="h-3 w-3" />
							ETA: {formatETA(estimatedArrival)}
						</Badge>
					)}
				</div>
			</GlassCardHeader>

			<GlassCardContent className="flex-1 min-h-[200px] relative">
				{!MAPBOX_TOKEN ? (
					<NoMapToken />
				) : !hasActiveCollection ? (
					<NoActiveCollection />
				) : (
					<Map
						ref={mapRef}
						mapboxAccessToken={MAPBOX_TOKEN}
						initialViewState={{
							longitude: generatorLocation.lng,
							latitude: generatorLocation.lat,
							zoom: 12,
						}}
						style={{ width: "100%", height: "100%" }}
						mapStyle={mapStyle}
						onLoad={() => setMapLoaded(true)}
						attributionControl={false}
					>
						{/* Route line */}
						{routeStops.length > 0 && (
							<Source id="route" type="geojson" data={routeGeoJSON}>
								<Layer
									id="route-line"
									type="line"
									paint={{
										"line-color": "#14b8a6",
										"line-width": 3,
										"line-opacity": 0.8,
										"line-dasharray": [2, 1],
									}}
								/>
							</Source>
						)}

						{/* Route stop markers */}
						{routeStops.map((stop) => (
							<Marker
								key={stop.id}
								longitude={stop.location.lng}
								latitude={stop.location.lat}
								anchor="bottom"
							>
								<div
									className={cn(
										"relative flex flex-col items-center",
										stop.order < currentStopIndex && "opacity-50",
									)}
								>
									<div
										className={cn(
											"rounded-full p-1.5 shadow-lg",
											stop.isCurrentGenerator
												? "bg-primary text-primary-foreground"
												: "bg-white text-muted-foreground border border-border",
										)}
									>
										<MapPin className="h-4 w-4" />
									</div>
									{stop.isCurrentGenerator && (
										<span className="absolute -bottom-5 text-[10px] font-medium bg-primary text-primary-foreground px-1.5 py-0.5 rounded whitespace-nowrap">
											Your Facility
										</span>
									)}
									{!stop.isCurrentGenerator && (
										<span className="absolute -bottom-4 text-[9px] text-muted-foreground whitespace-nowrap">
											Stop {stop.order + 1}
										</span>
									)}
								</div>
							</Marker>
						))}

						{/* Driver marker */}
						{driverLocation && (
							<Marker
								longitude={driverLocation.lng}
								latitude={driverLocation.lat}
								anchor="center"
							>
								<div className="relative">
									<div className="absolute inset-0 bg-primary/30 rounded-full animate-ping" />
									<div className="relative rounded-full bg-primary p-2 shadow-lg">
										<Truck className="h-4 w-4 text-primary-foreground" />
									</div>
								</div>
							</Marker>
						)}
					</Map>
				)}
			</GlassCardContent>

			{/* Route info footer */}
			{hasActiveCollection && routeStops.length > 0 && (
				<div className="px-4 py-2.5 border-t border-border/50 bg-muted/30 shrink-0">
					<div className="flex items-center justify-between text-xs">
						<span className="text-muted-foreground">
							{routeStops.length} stops on route
						</span>
						<span className="font-medium">
							You are stop #{generatorRouteOrder + 1}
						</span>
					</div>
				</div>
			)}
		</GlassCard>
	);
}
