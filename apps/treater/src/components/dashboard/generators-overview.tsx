import { useState } from "react";
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  QrCode,
  AlertTriangle,
  CheckCircle2,
  Search,
  Plus,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  mockGenerators,
  qrModeLabels,
  getStorageUtilization,
  formatRelativeTime,
  type MockGenerator,
} from "@/lib/mock-data";

interface GeneratorCardProps {
  generator: MockGenerator;
  delay: number;
  onViewDetails: (generator: MockGenerator) => void;
}

function GeneratorCard({ generator, delay, onViewDetails }: GeneratorCardProps) {
  const utilization = getStorageUtilization(generator);
  const isNearCapacity = utilization >= generator.storageAlertThreshold;
  const isCritical = utilization >= 95;

  return (
    <GlassCard
      animate
      animationDelay={delay}
      interactive
      className="p-5 space-y-4"
      onClick={() => onViewDetails(generator)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">{generator.name}</h3>
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              {generator.address.split(",").slice(1, 2).join(",").trim()}
            </p>
          </div>
        </div>
        <Badge
          variant={generator.isActive ? "default" : "secondary"}
          className="shrink-0 text-[10px]"
        >
          {generator.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground truncate">
          <Mail className="h-3 w-3 shrink-0" />
          <span className="truncate">{generator.contactEmail.split("@")[0]}@...</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground truncate">
          <Phone className="h-3 w-3 shrink-0" />
          <span className="truncate">{generator.contactPhone.slice(-8)}</span>
        </div>
      </div>

      {/* Storage Capacity Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Storage Capacity</span>
          <span
            className={`font-medium tabular-nums ${
              isCritical
                ? "text-red-600"
                : isNearCapacity
                  ? "text-amber-600"
                  : "text-foreground"
            }`}
          >
            {utilization}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCritical
                ? "bg-red-500"
                : isNearCapacity
                  ? "bg-amber-500"
                  : "bg-primary"
            }`}
            style={{ width: `${Math.min(utilization, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>
            {generator.currentStorageKg.toFixed(1)} / {generator.maxStorageCapacityKg} kg
          </span>
          <span>
            {generator.currentBagCount} / {generator.maxBagCount} bags
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs">
            <QrCode className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">{qrModeLabels[generator.qrMode]}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {isNearCapacity ? (
            <div className="flex items-center gap-1 text-amber-600">
              <AlertTriangle className="h-3 w-3" />
              <span>Near capacity</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              <span>Normal</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>
          {generator.pendingBags} pending | {generator.treatedBags} treated
        </span>
        <span>{formatRelativeTime(generator.lastActivityAt)}</span>
      </div>
    </GlassCard>
  );
}

interface GeneratorsOverviewProps {
  onAddGenerator: () => void;
}

export function GeneratorsOverview({ onAddGenerator }: GeneratorsOverviewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const filteredGenerators = mockGenerators.filter((generator) => {
    const matchesSearch =
      generator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      generator.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      generator.facilityCode?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "active" && generator.isActive) ||
      (filter === "inactive" && !generator.isActive);

    return matchesSearch && matchesFilter;
  });

  const handleViewDetails = (generator: MockGenerator) => {
    console.log("View details for:", generator.name);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Generators</h2>
          <p className="text-sm text-muted-foreground">
            Hospitals and facilities you manage
          </p>
        </div>
        <Button onClick={onAddGenerator} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Generator
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search generators..."
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
        {filteredGenerators.map((generator, index) => (
          <GeneratorCard
            key={generator.id}
            generator={generator}
            delay={0.05 * (index + 1)}
            onViewDetails={handleViewDetails}
          />
        ))}
      </div>

      {filteredGenerators.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-sm text-muted-foreground">No generators found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting your search or filter
          </p>
        </div>
      )}
    </div>
  );
}
