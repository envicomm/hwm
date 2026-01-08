import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WasteBagsTable } from "@/components/dashboard/waste-bags-table";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { BagInventoryWidget } from "@/components/dashboard/bag-inventory-widget";
import { CollectionRouteMap } from "@/components/dashboard/collection-route-map";
import { InsightsStats } from "@/components/dashboard/insights-stats";
import {
  mockWasteBags,
  mockCollectionRequests,
  mockGenerator,
  mockBagInventory,
  mockCollectionRoute,
  getStorageStats,
} from "@/lib/mock-data";

export const Route = createFileRoute("/_dashboard/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const storageStats = getStorageStats(mockWasteBags);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your waste management activity
        </p>
      </div>

      {/* Row 1: Key Widgets - Inventory, Route Map */}
      <div className="grid gap-4 md:grid-cols-3">
        <BagInventoryWidget
          availableBags={mockBagInventory.availableBags}
          qrMode={mockGenerator.qrMode}
          lowStockThreshold={20}
          recentDistributions={mockBagInventory.recentDistributions}
          animate
          animationDelay={0.1}
        />
        <CollectionRouteMap
          generatorLocation={mockGenerator.location}
          routeStops={mockCollectionRoute.stops}
          driverLocation={mockCollectionRoute.driverLocation ?? undefined}
          estimatedArrival={mockCollectionRoute.estimatedArrival ?? undefined}
          currentStopIndex={mockCollectionRoute.currentStopIndex}
          hasActiveCollection={mockCollectionRoute.hasActiveCollection}
          className="md:col-span-2"
          animate
          animationDelay={0.2}
        />
      </div>

      {/* Row 2: Actionable Stats */}
      <div className="animate-fade-in-up stagger-4">
        <InsightsStats
          bags={mockWasteBags}
          maxKg={mockGenerator.maxStorageCapacityKg}
          currentKg={storageStats.currentKg}
          currentBags={storageStats.currentBags}
          maxBags={mockGenerator.maxBagCount}
          alertThreshold={mockGenerator.storageAlertThreshold}
        />
      </div>

      {/* Row 3: Activity Timeline + Recent Waste Bags Table */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="animate-fade-in-up stagger-5">
          <ActivityTimeline bags={mockWasteBags} requests={mockCollectionRequests} />
        </div>
        <Card className="lg:col-span-2 animate-fade-in-up stagger-6 card-interactive">
          <CardHeader>
            <CardTitle>Recent Waste Bags</CardTitle>
            <CardDescription>
              Your most recent waste bag entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WasteBagsTable bags={mockWasteBags.slice(0, 10)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
