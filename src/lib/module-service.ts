/**
 * Module Resolution Service
 * 
 * Central service for checking if system modules are enabled.
 * This is the SINGLE SOURCE OF TRUTH for module state.
 * 
 * MIT License
 * Copyright (c) 2025 Prayangshu Biswas
 */

import { prisma } from "./prisma";

// Cache for module states (in-memory, cleared on module updates)
const moduleCache = new Map<string, { enabled: boolean; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 60 seconds

interface ModuleContext {
  organizationId?: string | null;
  userId?: string;
  roleId?: string;
}

/**
 * Check if a module is enabled
 * 
 * @param key - Module key (e.g., "landing", "pricing", "billing")
 * @param context - Optional context (organizationId, userId, roleId)
 * @returns true if module is enabled, false otherwise
 */
export async function isModuleEnabled(
  key: string,
  context?: ModuleContext
): Promise<boolean> {
  const cacheKey = `${key}:${context?.organizationId || "global"}`;
  const cached = moduleCache.get(cacheKey);

  // Return cached value if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.enabled;
  }

  // Check org-specific module first (if organizationId provided)
  if (context?.organizationId) {
    const orgModule = await prisma.systemModule.findFirst({
      where: {
        key,
        organizationId: context.organizationId,
      },
    });

    if (orgModule) {
      moduleCache.set(cacheKey, {
        enabled: orgModule.enabled,
        timestamp: Date.now(),
      });
      return orgModule.enabled;
    }
  }

  // Fallback to global module
  const globalModule = await prisma.systemModule.findFirst({
    where: {
      key,
      organizationId: null,
    },
  });

  const enabled = globalModule?.enabled ?? false;

  // Cache the result
  moduleCache.set(cacheKey, {
    enabled,
    timestamp: Date.now(),
  });

  return enabled;
}

/**
 * Get module details
 */
export async function getModule(
  key: string,
  organizationId?: string | null
): Promise<{
  id: string;
  key: string;
  enabled: boolean;
  description: string | null;
  scope: string;
  organizationId: string | null;
} | null> {
  if (organizationId) {
    const orgModule = await prisma.systemModule.findFirst({
      where: {
        key,
        organizationId,
      },
    });

    if (orgModule) {
      return orgModule;
    }
  }

  return prisma.systemModule.findFirst({
    where: {
      key,
      organizationId: null,
    },
  });
}

/**
 * Get all modules (for admin UI)
 */
export async function getAllModules(organizationId?: string | null) {
  const where: any = {};

  if (organizationId !== undefined) {
    where.organizationId = organizationId;
  } else {
    // Get both global and org-specific
    return prisma.systemModule.findMany({
      orderBy: [
        { organizationId: "asc" },
        { key: "asc" },
      ],
    });
  }

  return prisma.systemModule.findMany({
    where,
    orderBy: { key: "asc" },
  });
}

/**
 * Update module state (admin only)
 */
export async function updateModule(
  key: string,
  data: {
    enabled?: boolean;
    description?: string;
    scope?: "GLOBAL" | "PUBLIC" | "AUTH" | "ADMIN";
  },
  organizationId?: string | null,
  updatedBy?: string
) {
  // Clear cache for this module
  moduleCache.delete(`${key}:${organizationId || "global"}`);

  const where: any = {
    key,
    organizationId: organizationId ?? null,
  };

  const existing = await prisma.systemModule.findFirst({ where });

  if (existing) {
    return prisma.systemModule.update({
      where: { id: existing.id },
      data: {
        ...data,
        updatedBy,
      },
    });
  } else {
    return prisma.systemModule.create({
      data: {
        key,
        organizationId: organizationId ?? null,
        enabled: data.enabled ?? true,
        description: data.description,
        scope: data.scope ?? "GLOBAL",
        updatedBy,
      },
    });
  }
}

/**
 * Clear module cache (call after module updates)
 */
export function clearModuleCache(key?: string) {
  if (key) {
    // Clear specific module cache
    for (const cacheKey of moduleCache.keys()) {
      if (cacheKey.startsWith(`${key}:`)) {
        moduleCache.delete(cacheKey);
      }
    }
  } else {
    // Clear all cache
    moduleCache.clear();
  }
}

/**
 * Batch check multiple modules
 */
export async function areModulesEnabled(
  keys: string[],
  context?: ModuleContext
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};

  await Promise.all(
    keys.map(async (key) => {
      results[key] = await isModuleEnabled(key, context);
    })
  );

  return results;
}

