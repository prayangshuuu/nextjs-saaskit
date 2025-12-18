import { prisma } from "./prisma";
import { getBooleanSetting } from "./settings-service";
import { isPrivateBuild, shouldEnableTelemetry } from "./private-build";

/**
 * Telemetry Service
 * 
 * Opt-in only, disabled by default.
 * Respects PRIVATE_BUILD flag.
 * No PII collected.
 */

export interface TelemetryEventData {
  event: string;
  metadata?: Record<string, any>;
  version?: string;
}

// Check if telemetry is enabled
export async function isTelemetryEnabled(organizationId?: string | null): Promise<boolean> {
  // Disabled in private builds
  if (!shouldEnableTelemetry()) {
    return false;
  }

  // Check admin setting (default: false)
  return getBooleanSetting("telemetry.enabled", false, organizationId);
}

// Track telemetry event (non-blocking)
export async function trackEvent(
  data: TelemetryEventData,
  organizationId?: string | null
): Promise<void> {
  try {
    // Check if telemetry is enabled
    const enabled = await isTelemetryEnabled(organizationId);
    if (!enabled) {
      return;
    }

    // Sanitize metadata (remove any potential PII)
    const sanitizedMetadata = sanitizeMetadata(data.metadata || {});

    // Store event asynchronously (non-blocking)
    await prisma.telemetryEvent.create({
      data: {
        event: data.event,
        metadata: sanitizedMetadata,
        version: data.version || process.env.npm_package_version || "0.1.0",
      },
    });
  } catch (error) {
    // Silently fail - telemetry should never break the app
    console.error("Telemetry tracking failed:", error);
  }
}

// Sanitize metadata to remove PII
function sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  const piiFields = ["email", "password", "token", "secret", "key", "id", "userId", "user_id"];

  for (const [key, value] of Object.entries(metadata)) {
    const lowerKey = key.toLowerCase();
    if (piiFields.some((field) => lowerKey.includes(field))) {
      continue; // Skip PII fields
    }
    sanitized[key] = value;
  }

  return sanitized;
}

// Get telemetry stats (admin only)
export async function getTelemetryStats(organizationId?: string | null) {
  const enabled = await isTelemetryEnabled(organizationId);
  if (!enabled) {
    return { enabled: false, count: 0, events: [] };
  }

  const count = await prisma.telemetryEvent.count();
  const recentEvents = await prisma.telemetryEvent.findMany({
    take: 100,
    orderBy: { timestamp: "desc" },
  });

  return {
    enabled: true,
    count,
    events: recentEvents,
  };
}

// Clear telemetry data (admin only)
export async function clearTelemetryData(): Promise<void> {
  await prisma.telemetryEvent.deleteMany({});
}

