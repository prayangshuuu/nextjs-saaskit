import { prisma } from "./prisma";

// Simple in-memory cache
const flagCache = new Map<string, { enabled: boolean; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute

// Check if feature flag is enabled (org → global fallback)
export async function isFeatureEnabled(
  key: string,
  organizationId?: string | null
): Promise<boolean> {
  const cacheKey = `${organizationId || "global"}:${key}`;
  const cached = flagCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.enabled;
  }

  // Try org-specific flag first
  if (organizationId) {
    const orgFlag = await prisma.featureFlag.findUnique({
      where: {
        organizationId_key: {
          organizationId,
          key,
        },
      },
    });

    if (orgFlag) {
      flagCache.set(cacheKey, { enabled: orgFlag.enabled, timestamp: Date.now() });
      return orgFlag.enabled;
    }
  }

  // Fallback to global flag
  const globalFlag = await prisma.featureFlag.findUnique({
    where: {
      organizationId_key: {
        organizationId: null,
        key,
      },
    },
  });

  const enabled = globalFlag?.enabled ?? false;
  flagCache.set(cacheKey, { enabled, timestamp: Date.now() });
  return enabled;
}

// Set feature flag
export async function setFeatureFlag(
  key: string,
  enabled: boolean,
  options: {
    organizationId?: string | null;
    description?: string;
    updatedBy?: string;
  } = {}
): Promise<void> {
  const { organizationId = null, description, updatedBy } = options;

  await prisma.featureFlag.upsert({
    where: {
      organizationId_key: {
        organizationId,
        key,
      },
    },
    update: {
      enabled,
      description,
      updatedBy,
    },
    create: {
      key,
      enabled,
      organizationId,
      description,
      updatedBy,
    },
  });

  // Clear cache
  const cacheKey = `${organizationId || "global"}:${key}`;
  flagCache.delete(cacheKey);
}

// Clear feature flag cache
export function clearFeatureFlagCache(): void {
  flagCache.clear();
}

