"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth";
import { getAppUrlForOrgType, getCurrentAppOrgType } from "@hwm/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Building2 } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  metadata?: {
    organizationType?: string;
  };
}

export function OrganizationSwitcher() {
  const { data: session, isPending } = authClient.useSession();
  const [switching, setSwitching] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  // Get active organization from session (using type casting as needed)
  const activeOrg = (session?.user as any)?.activeOrganization as Organization | undefined;

  // Fetch user's organizations
  useEffect(() => {
    async function fetchOrganizations() {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      try {
        // Try to get organizations from session first
        const userOrgs = (session.user as any)?.organizations as Organization[] | undefined;

        if (userOrgs && Array.isArray(userOrgs)) {
          setOrganizations(userOrgs);
        } else {
          // Fallback: fetch via API if not in session
          const result = await authClient.organization.list();
          setOrganizations(result.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch organizations:", error);
        setOrganizations([]);
      } finally {
        setLoading(false);
      }
    }

    fetchOrganizations();
  }, [session]);

  // Single org or no orgs - just show name, no dropdown
  if ((!isPending && !loading) && organizations.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>{activeOrg?.name || "No Organization"}</span>
      </div>
    );
  }

  const handleSwitch = async (org: Organization) => {
    if (org.id === activeOrg?.id) return; // Already active

    setSwitching(true);
    try {
      // Set new active organization
      await authClient.organization.setActive({
        organizationId: org.id,
      });

      // Check if we need to redirect to different app
      const newOrgType = org.metadata?.organizationType;
      const currentAppType = getCurrentAppOrgType();

      if (newOrgType && newOrgType !== currentAppType) {
        const targetUrl = getAppUrlForOrgType(newOrgType as "treater" | "generator" | "hauler");
        if (targetUrl) {
          window.location.href = `${targetUrl}/dashboard`;
          return;
        }
      }

      // Same app type - just refresh to update context
      window.location.reload();
    } catch (error) {
      console.error("Failed to switch organization:", error);
    } finally {
      setSwitching(false);
    }
  };

  if (isPending || loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={switching}>
        <Button variant="ghost" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <span className="max-w-[200px] truncate">{activeOrg?.name || "Select Organization"}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px]">
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleSwitch(org)}
            className={org.id === activeOrg?.id ? "bg-accent" : ""}
          >
            <span className="truncate">{org.name}</span>
            {org.metadata?.organizationType && (
              <span className="ml-auto text-xs text-muted-foreground capitalize">
                {org.metadata.organizationType}
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
