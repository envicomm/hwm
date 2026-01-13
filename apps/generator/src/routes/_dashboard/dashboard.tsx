import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { api, Id } from "@hwm/convex";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { WasteBagsTable } from "@/components/dashboard/waste-bags-table";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { BagInventoryWidget } from "@/components/dashboard/bag-inventory-widget";
import { CollectionRouteMap } from "@/components/dashboard/collection-route-map";
import { InsightsStats } from "@/components/dashboard/insights-stats";
import { AddWasteBagWizard } from "@/components/dashboard/add-waste-bag-wizard";
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
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const storageStats = getStorageStats(mockWasteBags);
  const createWasteBag = useMutation(api.wasteBags.create);

  // Query latest waste bags from Convex
  const wasteBags = useQuery(api.wasteBags.getLatest, { limit: 10 });

  const handleWasteBagSubmit = async (data: any) => {
    try {
      // FOR TESTING
      const generatorId =
        "js7f6y749bvmr94r2jjtmt88r17z4mf0" as Id<"generators">;

      const wasteBagId = await createWasteBag({
        generatorId,
        qrCode: data.qrCode,
        qrSource: data.qrSource,
        wasteType: data.wasteType,
        weightKg: data.weightKg ? parseFloat(data.weightKg) : undefined,
        description: data.description || undefined,
        imageUrl: data.imageUrl || undefined,
      });

      console.log("Waste bag created successfully:", wasteBagId);
    } catch (error) {
      console.error("Failed to create waste bag:", error);
      throw error; // Re-throw so the wizard can handle it
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your waste management activity
        </p>
      </div>

      {/* Row 1: Actionable Stats - Storage Capacity, 7-Day Waste Trend */}
      <div className="animate-fade-in-up stagger-1">
        <InsightsStats
          bags={mockWasteBags}
          maxKg={mockGenerator.maxStorageCapacityKg}
          currentKg={storageStats.currentKg}
          currentBags={storageStats.currentBags}
          maxBags={mockGenerator.maxBagCount}
          alertThreshold={mockGenerator.storageAlertThreshold}
        />
      </div>

      {/* Row 2: Key Widgets - QR Bag Inventory, Collection Route Map */}
      <div className="grid gap-4 md:grid-cols-3">
        <BagInventoryWidget
          availableBags={mockBagInventory.availableBags}
          qrMode={mockGenerator.qrMode}
          lowStockThreshold={20}
          recentDistributions={mockBagInventory.recentDistributions}
          animate
          animationDelay={0.2}
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
          animationDelay={0.3}
        />
      </div>

      {/* Row 3: Activity Timeline + Recent Waste Bags Table */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="animate-fade-in-up stagger-5">
          <ActivityTimeline
            bags={mockWasteBags}
            requests={mockCollectionRequests}
          />
        </div>
        <Card className="lg:col-span-2 animate-fade-in-up stagger-6 card-interactive">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="space-y-1.5">
              <CardTitle>Recent Waste Bags</CardTitle>
              <CardDescription>
                Your most recent waste bag entries
              </CardDescription>
            </div>
            <Button className="mt-2" onClick={() => setIsWizardOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Waste Bag
            </Button>
          </CardHeader>
          <CardContent>
            <WasteBagsTable bags={wasteBags ?? []} />
          </CardContent>
        </Card>
      </div>

      <AddWasteBagWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSubmit={handleWasteBagSubmit}
      />
    </div>
  );
}
