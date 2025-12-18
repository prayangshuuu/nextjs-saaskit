import { getBooleanSetting, getStringSetting } from "./settings-service";

export async function isMaintenanceMode(organizationId?: string | null): Promise<boolean> {
  return getBooleanSetting("maintenance.enabled", false, organizationId);
}

export async function getMaintenanceMessage(organizationId?: string | null): Promise<string> {
  return getStringSetting(
    "maintenance.message",
    "We're currently performing maintenance. Please check back soon.",
    organizationId
  );
}

