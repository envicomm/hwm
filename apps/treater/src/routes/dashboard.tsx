import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatsOverview } from "@/components/dashboard/stats-overview";
import { GeneratorsOverview } from "@/components/dashboard/generators-overview";
import { HaulersOverview } from "@/components/dashboard/haulers-overview";
import { WasteStatusChart } from "@/components/dashboard/waste-status-chart";
import { StorageAlerts } from "@/components/dashboard/storage-alerts";
import { AddGeneratorWizard } from "@/components/dashboard/add-generator-wizard";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async ({ context }) => {
    // Redirect to sign-in if not authenticated
    if (!context.isAuthenticated) {
      throw redirect({ to: "/auth/$authView", params: { authView: "sign-in" } });
    }
  },
  component: DashboardPage,
});

function DashboardPage() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const handleAddGenerator = () => {
    setIsWizardOpen(true);
  };

  const handleWizardClose = () => {
    setIsWizardOpen(false);
  };

  const handleWizardSubmit = (data: any) => {
    console.log("New generator data:", data);
  };

  const handleAddHauler = () => {
    // TODO: Implement hauler wizard in future phase
    console.log("Add hauler clicked");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Stats Overview */}
        <StatsOverview />

        {/* Charts and Alerts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <WasteStatusChart />
          <StorageAlerts />
        </div>

        {/* Generators Section */}
        <GeneratorsOverview onAddGenerator={handleAddGenerator} />

        {/* Haulers Section */}
        <HaulersOverview onAddHauler={handleAddHauler} />

        {/* Add Generator Wizard Modal */}
        <AddGeneratorWizard
          isOpen={isWizardOpen}
          onClose={handleWizardClose}
          onSubmit={handleWizardSubmit}
        />
      </div>
    </DashboardLayout>
  );
}
