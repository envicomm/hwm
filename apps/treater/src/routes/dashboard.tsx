import { useState, useEffect } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatsOverview } from "@/components/dashboard/stats-overview";
import { GeneratorsOverview } from "@/components/dashboard/generators-overview";
import { WasteStatusChart } from "@/components/dashboard/waste-status-chart";
import { StorageAlerts } from "@/components/dashboard/storage-alerts";
import { AddGeneratorWizard } from "@/components/dashboard/add-generator-wizard";
import { useAuth } from "@/contexts/auth-context";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const auth = localStorage.getItem("hwm-treater-auth");
      if (!auth) {
        throw redirect({ to: "/" });
      }
    }
  },
  component: DashboardPage,
});

function DashboardPage() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Guard against browser back button after logout
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: "/", replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleAddGenerator = () => {
    setIsWizardOpen(true);
  };

  const handleWizardClose = () => {
    setIsWizardOpen(false);
  };

  const handleWizardSubmit = (data: any) => {
    console.log("New generator data:", data);
  };

  // Show nothing while checking auth to prevent flash of content
  if (isLoading || !isAuthenticated) {
    return null;
  }

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
