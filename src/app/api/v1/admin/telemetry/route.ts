import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, apiHandler } from "@/lib/api-guards";
import { getTelemetryStats, clearTelemetryData, isTelemetryEnabled } from "@/lib/telemetry";
import { getBooleanSetting, setSetting } from "@/lib/settings-service";
import { getTenantFromRequest } from "@/lib/tenant";

export const GET = apiHandler(async (request: NextRequest) => {
  await requireAdmin(request);
  const organizationId = getTenantFromRequest(request);

  const enabled = await isTelemetryEnabled(organizationId);
  const stats = await getTelemetryStats(organizationId);

  return NextResponse.json({
    enabled,
    stats,
    dataCollected: [
      "Feature usage events",
      "Error events (anonymized)",
      "App version",
      "Event timestamps",
    ],
    dataNotCollected: [
      "Personal information (PII)",
      "User emails or IDs",
      "Passwords or tokens",
      "Organization data",
      "Sensitive metadata",
    ],
  });
});

export const DELETE = apiHandler(async (request: NextRequest) => {
  await requireAdmin(request);
  await clearTelemetryData();
  return NextResponse.json({ message: "Telemetry data cleared" });
});

