import { useRef, useEffect, useState } from "react";
import Map, { Marker, type MapRef } from "react-map-gl/mapbox";
import { Truck, MapPin, AlertCircle, Users } from "lucide-react";
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
} from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  mockDrivers,
  mockCollectionRequests,
  driverStatusColors,
} from "@/lib/mock-data";
import "mapbox-gl/dist/mapbox-gl.css";

interface FleetMapWidgetProps {
  className?: string;
  animate?: boolean;
  animationDelay?: number;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// Light map style
const mapStyle = "mapbox://styles/mapbox/light-v11";

// Mock driver locations (Metro Manila area)
const driverLocations: Record<string, { lat: number; lng: number }> = {
  drv_001: { lat: 14.5547, lng: 121.0244 }, // Makati
  drv_002: { lat: 14.5995, lng: 120.9842 }, // Manila
  drv_003: { lat: 14.6507, lng: 121.0495 }, // Quezon City
  drv_004: { lat: 14.5176, lng: 121.0509 }, // Taguig
};

// Treatment facility (destination)
const treatmentFacility = {
  name: "Metro Manila Treatment Facility",
  lat: 14.5831,
  lng: 121.0615,
};

function NoActiveDrivers() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-4">
      <div className="rounded-full bg-muted/50 p-3 mb-3">
        <Users className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">
        No Active Drivers
      </p>
      <p className="text-xs text-muted-foreground/70 mt-1">
        Drivers will appear on the map when on route
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

export function FleetMapWidget({
  className,
  animate = false,
  animationDelay,
}: FleetMapWidgetProps) {
  const mapRef = useRef<MapRef>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Get active drivers (on_route or returning)
  const activeDrivers = mockDrivers.filter(
    (d) => d.status === "on_route" || d.status === "returning"
  );

  // Get active collections count
  const activeCollections = mockCollectionRequests.filter(
    (r) => r.status === "in_progress" || r.status === "assigned"
  ).length;

  // Fit bounds to show all drivers
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || activeDrivers.length === 0) return;

    const points: Array<{ lat: number; lng: number }> = activeDrivers
      .filter((d) => driverLocations[d.id])
      .map((d) => driverLocations[d.id])
      .filter((p): p is { lat: number; lng: number } => p !== undefined);

    // Add treatment facility
    points.push({ lat: treatmentFacility.lat, lng: treatmentFacility.lng });

    if (points.length > 1) {
      const lngs = points.map((p) => p.lng);
      const lats = points.map((p) => p.lat);

      mapRef.current.fitBounds(
        [
          [Math.min(...lngs) - 0.02, Math.min(...lats) - 0.02],
          [Math.max(...lngs) + 0.02, Math.max(...lats) + 0.02],
        ],
        { padding: 40, duration: 1000 }
      );
    }
  }, [mapLoaded, activeDrivers]);

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
            <MapPin className="h-4 w-4" />
            Fleet Tracking
          </GlassCardTitle>
          {activeDrivers.length > 0 && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Truck className="h-3 w-3" />
              {activeDrivers.length} active
            </Badge>
          )}
        </div>
      </GlassCardHeader>

      <GlassCardContent className="relative h-[350px]">
        {!MAPBOX_TOKEN ? (
          <NoMapToken />
        ) : activeDrivers.length === 0 ? (
          <NoActiveDrivers />
        ) : (
          <Map
            ref={mapRef}
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={{
              longitude: 121.0244,
              latitude: 14.5547,
              zoom: 11,
            }}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            mapStyle={mapStyle}
            onLoad={() => setMapLoaded(true)}
            attributionControl={false}
          >
            {/* Treatment Facility Marker */}
            <Marker
              longitude={treatmentFacility.lng}
              latitude={treatmentFacility.lat}
              anchor="bottom"
            >
              <div className="flex flex-col items-center">
                <div className="rounded-full bg-emerald-500 p-2 shadow-lg">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
                <span className="mt-1 text-[9px] font-medium text-muted-foreground bg-white/80 px-1.5 py-0.5 rounded">
                  Facility
                </span>
              </div>
            </Marker>

            {/* Driver Markers */}
            {activeDrivers.map((driver) => {
              const location = driverLocations[driver.id];
              if (!location) return null;

              return (
                <Marker
                  key={driver.id}
                  longitude={location.lng}
                  latitude={location.lat}
                  anchor="center"
                >
                  <div className="relative group">
                    {/* Pulse animation */}
                    <div
                      className="absolute inset-0 rounded-full tracking-pulse"
                      style={{
                        backgroundColor: `${driverStatusColors[driver.status]}40`,
                      }}
                    />
                    {/* Driver icon */}
                    <div
                      className="relative rounded-full p-2 shadow-lg"
                      style={{
                        backgroundColor: driverStatusColors[driver.status],
                      }}
                    >
                      <Truck className="h-4 w-4 text-white" />
                    </div>
                    {/* Tooltip on hover */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="glass-elevated rounded px-2 py-1 text-[10px] whitespace-nowrap shadow-lg">
                        <span className="font-medium">{driver.name}</span>
                      </div>
                    </div>
                  </div>
                </Marker>
              );
            })}
          </Map>
        )}
      </GlassCardContent>

      {/* Footer with stats */}
      {activeDrivers.length > 0 && (
        <div className="px-4 py-2.5 border-t border-border/50 bg-muted/30 shrink-0">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {activeCollections} active pickups
            </span>
            <span className="font-medium text-primary">Live tracking</span>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
