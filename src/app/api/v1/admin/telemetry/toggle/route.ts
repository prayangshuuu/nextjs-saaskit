import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, apiHandler, getAuthenticatedUser } from "@/lib/api-guards";
import { setSetting } from "@/lib/settings-service";
import { getTenantFromRequest } from "@/lib/tenant";

export const PUT = apiHandler(async (request: NextRequest) => {
  await requireAdmin(request);
  const organizationId = getTenantFromRequest(request);
  const user = await getAuthenticatedUser(request);

  const body = await request.json();
  const { enabled } = body;

  await setSetting(
    "telemetry.enabled",
    Boolean(enabled),
    "boolean",
    {
      organizationId,
      description: "Enable or disable telemetry collection",
      updatedBy: user?.userId,
    }
  );

  return NextResponse.json({ enabled: Boolean(enabled) });
});

