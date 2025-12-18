"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
  memberCount: number;
}

export function OrganizationSwitcher() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrganizations();
    loadActiveOrganization();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch("/api/v1/organizations");
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations || []);
      }
    } catch (error) {
      console.error("Failed to fetch organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveOrganization = () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("activeOrganizationId");
      if (stored) {
        // Will be set after organizations load
      }
    }
  };

  const handleSwitch = async (orgId: string) => {
    try {
      // Set in localStorage
      localStorage.setItem("activeOrganizationId", orgId);
      
      // Set cookie for server-side access
      await fetch("/api/v1/organizations/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: orgId }),
      });

      const org = organizations.find((o) => o.id === orgId);
      setActiveOrg(org || null);

      // Refresh page to apply tenant context
      router.refresh();
    } catch (error) {
      console.error("Failed to switch organization:", error);
    }
  };

  useEffect(() => {
    if (organizations.length > 0) {
      const storedId = localStorage.getItem("activeOrganizationId");
      if (storedId) {
        const org = organizations.find((o) => o.id === storedId);
        if (org) {
          setActiveOrg(org);
        } else {
          // Fallback to first organization
          setActiveOrg(organizations[0]);
          handleSwitch(organizations[0].id);
        }
      } else if (organizations.length > 0) {
        // Set first organization as active
        setActiveOrg(organizations[0]);
        handleSwitch(organizations[0].id);
      }
    }
  }, [organizations]);

  if (loading || organizations.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Building2 className="h-4 w-4" />
          <span className="max-w-[150px] truncate">
            {activeOrg?.name || "Select Organization"}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleSwitch(org.id)}
            className="flex items-center justify-between"
          >
            <div className="flex flex-col">
              <span className="font-medium">{org.name}</span>
              <span className="text-xs text-muted-foreground">{org.role}</span>
            </div>
            {activeOrg?.id === org.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

