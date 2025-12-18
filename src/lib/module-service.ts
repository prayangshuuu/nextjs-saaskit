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

// Cache for module states (5 minute TTL)
const moduleCache = new Map<string, { enabled: boolean; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export type ModuleScope = "GLOBAL" | "PUBLIC" | "AUTH" | "ADMIN";

export interface ModuleContext {
  userId?: string;
  organizationId?: string;
  isAdmin?: boolean;
}

/**
 * Check if a module is enabled
 * 
 * @param key - Module key (e.g., "landing", "pricing", "billing")
 * @param context - Optional context (user, org, admin status)
 * @returns true if module is enabled, false otherwise
 */
export async function isModuleEnabled(
  key: string,
  context?: ModuleContext
): Promise<boolean> {
  // Check cache first
  const cacheKey = key;
  const cached = moduleCache.get(cacheKey);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.enabled;
  }

  // Fetch from database
  const module = await prisma.systemModule.findUnique({
    where: { key },
  });

  if (!module) {
    // Module doesn't exist - default to disabled for safety
    moduleCache.set(cacheKey, { enabled: false, timestamp: now });
    return false;
  }

  // Check scope-based access
  if (context) {
    // ADMIN scope requires admin user
    if (module.scope === "ADMIN" && !context.isAdmin) {
      moduleCache.set(cacheKey, { enabled: false, timestamp: now });
      return false;
    }

    // AUTH scope requires authenticated user
    if (module.scope === "AUTH" && !context.userId) {
      moduleCache.set(cacheKey, { enabled: false, timestamp: now });
      return false;
    }
  } else {
    // No context provided - only allow PUBLIC and GLOBAL modules
    if (module.scope !== "PUBLIC" && module.scope !== "GLOBAL") {
      moduleCache.set(cacheKey, { enabled: false, timestamp: now });
      return false;
    }
  }

  // Cache and return
  moduleCache.set(cacheKey, { enabled: module.enabled, timestamp: now });
  return module.enabled;
}

/**
 * Get module details
 */
export async function getModule(key: string) {
  return prisma.systemModule.findUnique({
    where: { key },
  });
}

/**
 * Get all modules
 */
export async function getAllModules() {
  return prisma.systemModule.findMany({
    orderBy: { key: "asc" },
  });
}

/**
 * Update module state
 */
export async function updateModule(
  key: string,
  enabled: boolean,
  updatedBy?: string
) {
  // Invalidate cache
  moduleCache.delete(key);

  return prisma.systemModule.update({
    where: { key },
    data: {
      enabled,
      updatedBy,
      updatedAt: new Date(),
    },
  });
}

/**
 * Clear module cache (useful after admin updates)
 */
export function clearModuleCache() {
  moduleCache.clear();
}

/**
 * Clear cache for specific module
 */
export function clearModuleCacheFor(key: string) {
  moduleCache.delete(key);
}
