/**
 * Settings Service
 * 
 * MIT License
 * Copyright (c) 2025 Prayangshu Biswas
 */

import { prisma } from "./prisma";

// Simple in-memory cache (in production, use Redis)
const settingsCache = new Map<string, { value: any; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute

// Simple encryption/decryption (in production, use proper encryption library)
export function encryptSecret(value: string): string {
  // In production, use crypto.createCipheriv or a library like @aws-sdk/client-kms
  return Buffer.from(value).toString("base64");
}

export function decryptSecret(encrypted: string): string {
  return Buffer.from(encrypted, "base64").toString("utf-8");
}

export type SettingType = "string" | "number" | "boolean" | "json";

export interface SettingValue {
  value: any;
  type: SettingType;
  isSecret: boolean;
}

// Get setting with org → global fallback
export async function getSetting(
  key: string,
  organizationId?: string | null
): Promise<SettingValue | null> {
  const cacheKey = `${organizationId || "global"}:${key}`;
  const cached = settingsCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value;
  }

  // Try org-specific setting first
  if (organizationId) {
    const orgSetting = await prisma.systemSetting.findUnique({
      where: {
        organizationId_key: {
          organizationId,
          key,
        },
      },
    });

    if (orgSetting) {
      const result: SettingValue = {
        value: orgSetting.isSecret
          ? decryptSecret(orgSetting.value as string)
          : orgSetting.value,
        type: orgSetting.type as SettingType,
        isSecret: orgSetting.isSecret,
      };
      settingsCache.set(cacheKey, { value: result, timestamp: Date.now() });
      return result;
    }
  }

  // Fallback to global setting
  const globalSetting = await prisma.systemSetting.findUnique({
    where: {
      organizationId_key: {
        organizationId: null,
        key,
      },
    },
  });

  if (globalSetting) {
    const result: SettingValue = {
      value: globalSetting.isSecret
        ? decryptSecret(globalSetting.value as string)
        : globalSetting.value,
      type: globalSetting.type as SettingType,
      isSecret: globalSetting.isSecret,
    };
    settingsCache.set(cacheKey, { value: result, timestamp: Date.now() });
    return result;
  }

  return null;
}

// Type-safe getters
export async function getStringSetting(
  key: string,
  defaultValue: string,
  organizationId?: string | null
): Promise<string> {
  const setting = await getSetting(key, organizationId);
  if (setting && setting.type === "string") {
    return String(setting.value);
  }
  return defaultValue;
}

export async function getNumberSetting(
  key: string,
  defaultValue: number,
  organizationId?: string | null
): Promise<number> {
  const setting = await getSetting(key, organizationId);
  if (setting && setting.type === "number") {
    return Number(setting.value);
  }
  return defaultValue;
}

export async function getBooleanSetting(
  key: string,
  defaultValue: boolean,
  organizationId?: string | null
): Promise<boolean> {
  const setting = await getSetting(key, organizationId);
  if (setting && setting.type === "boolean") {
    return Boolean(setting.value);
  }
  return defaultValue;
}

export async function getJsonSetting<T>(
  key: string,
  defaultValue: T,
  organizationId?: string | null
): Promise<T> {
  const setting = await getSetting(key, organizationId);
  if (setting && setting.type === "json") {
    return setting.value as T;
  }
  return defaultValue;
}

// Set setting
export async function setSetting(
  key: string,
  value: any,
  type: SettingType,
  options: {
    organizationId?: string | null;
    isSecret?: boolean;
    description?: string;
    updatedBy?: string;
  } = {}
): Promise<void> {
  const { organizationId = null, isSecret = false, description, updatedBy } = options;

  // Validate value based on type
  let validatedValue: any = value;
  if (type === "number") {
    validatedValue = Number(value);
    if (isNaN(validatedValue)) {
      throw new Error(`Invalid number value for setting ${key}`);
    }
  } else if (type === "boolean") {
    validatedValue = Boolean(value);
  } else if (type === "json") {
    validatedValue = typeof value === "string" ? JSON.parse(value) : value;
  }

  // Encrypt if secret
  const finalValue = isSecret ? encryptSecret(String(validatedValue)) : validatedValue;

  await prisma.systemSetting.upsert({
    where: {
      organizationId_key: {
        organizationId,
        key,
      },
    },
    update: {
      value: finalValue,
      type,
      isSecret,
      description,
      updatedBy,
    },
    create: {
      key,
      value: finalValue,
      type,
      isSecret,
      organizationId,
      description,
      updatedBy,
    },
  });

  // Clear cache
  const cacheKey = `${organizationId || "global"}:${key}`;
  settingsCache.delete(cacheKey);
}

// Clear settings cache
export function clearSettingsCache(): void {
  settingsCache.clear();
}
