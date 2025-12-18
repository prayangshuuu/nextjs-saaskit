import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, apiHandler } from "@/lib/api-guards";
import { decryptSecret } from "@/lib/settings-service";

export const GET = apiHandler(async (request: NextRequest) => {
  await requireAdmin(request);

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId");

  const settings = await prisma.systemSetting.findMany({
    where: {
      organizationId: organizationId || null,
    },
    orderBy: {
      key: "asc",
    },
  });

  // Mask secret values
  const maskedSettings = settings.map((setting) => ({
    id: setting.id,
    key: setting.key,
    value: setting.isSecret ? "***" : setting.value,
    type: setting.type,
    isSecret: setting.isSecret,
    organizationId: setting.organizationId,
    description: setting.description,
    updatedAt: setting.updatedAt,
    updatedBy: setting.updatedBy,
  }));

  return NextResponse.json({ settings: maskedSettings });
});

