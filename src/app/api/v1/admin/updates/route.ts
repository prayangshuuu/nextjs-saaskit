import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, apiHandler, getAuthenticatedUser } from "@/lib/api-guards";
import { getUpdateNotice, shouldShowUpdateNotice, getCurrentVersion } from "@/lib/updates";
import { setSetting } from "@/lib/settings-service";
import { getTenantFromRequest } from "@/lib/tenant";
import { z } from "zod";

const updateNoticeSchema = z.object({
  version: z.string(),
  changelog: z.string(),
  date: z.string(),
  important: z.boolean().optional(),
});

export const GET = apiHandler(async (request: NextRequest) => {
  await requireAdmin(request);
  const organizationId = getTenantFromRequest(request);

  const currentVersion = await getCurrentVersion(organizationId);
  const notice = await getUpdateNotice(organizationId);
  const shouldShow = await shouldShowUpdateNotice(organizationId);

  return NextResponse.json({
    currentVersion,
    notice,
    shouldShow,
  });
});

export const PUT = apiHandler(async (request: NextRequest) => {
  await requireAdmin(request);
  const organizationId = getTenantFromRequest(request);
  const user = await getAuthenticatedUser(request);

  const body = await request.json();
  const data = updateNoticeSchema.parse(body);

  await setSetting(
    "app.updateNotice",
    {
      version: data.version,
      changelog: data.changelog,
      date: data.date,
      important: data.important ?? false,
    },
    "json",
    {
      organizationId,
      description: "Update notice for admins",
      updatedBy: user?.userId,
    }
  );

  return NextResponse.json({ message: "Update notice set" });
});

export const DELETE = apiHandler(async (request: NextRequest) => {
  await requireAdmin(request);
  const organizationId = getTenantFromRequest(request);

  await setSetting(
    "app.updateNotice",
    null,
    "json",
    {
      organizationId,
      description: "Clear update notice",
    }
  );

  return NextResponse.json({ message: "Update notice cleared" });
});

