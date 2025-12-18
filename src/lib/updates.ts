import { getStringSetting, getJsonSetting } from "./settings-service";

export interface UpdateNotice {
  version: string;
  changelog: string;
  date: string;
  important: boolean;
}

/**
 * Update Notification System
 * 
 * Admin-only update notices.
 * Manual changelog entry.
 * No forced updates.
 */

// Get current app version
export async function getCurrentVersion(organizationId?: string | null): Promise<string> {
  return getStringSetting(
    "app.version",
    process.env.npm_package_version || "0.1.0",
    organizationId
  );
}

// Get update notice (if available)
export async function getUpdateNotice(organizationId?: string | null): Promise<UpdateNotice | null> {
  const notice = await getJsonSetting<UpdateNotice>(
    "app.updateNotice",
    null,
    organizationId
  );
  return notice;
}

// Check if update notice should be shown
export async function shouldShowUpdateNotice(organizationId?: string | null): Promise<boolean> {
  const notice = await getUpdateNotice(organizationId);
  if (!notice) return false;

  const currentVersion = await getCurrentVersion(organizationId);
  // Show notice if there's a newer version
  return compareVersions(notice.version, currentVersion) > 0;
}

// Simple version comparison (semantic versioning)
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split(".").map(Number);
  const parts2 = v2.split(".").map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }

  return 0;
}

