import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, apiHandler, getAuthenticatedUser } from "@/lib/api-guards";
import { setSetting, SettingType, decryptSecret } from "@/lib/settings-service";

const updateSettingSchema = z.object({
  value: z.any(),
  type: z.enum(["string", "number", "boolean", "json"]),
  isSecret: z.boolean().optional(),
  description: z.string().optional(),
  organizationId: z.string().nullable().optional(),
});

export const GET = apiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) => {
  await requireAdmin(request);
  const { key } = await params;
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId");

  const setting = await prisma.systemSetting.findUnique({
    where: {
      organizationId_key: {
        organizationId: organizationId || null,
        key: decodeURIComponent(key),
      },
    },
  });

  if (!setting) {
    return NextResponse.json(
      { error: "Setting not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    setting: {
      id: setting.id,
      key: setting.key,
      value: setting.isSecret ? "***" : setting.value,
      type: setting.type,
      isSecret: setting.isSecret,
      organizationId: setting.organizationId,
      description: setting.description,
      updatedAt: setting.updatedAt,
      updatedBy: setting.updatedBy,
    },
  });
});

export const PUT = apiHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ key: string }> }
  ) => {
    await requireAdmin(request);
    const { key } = await params;
    const user = await getAuthenticatedUser(request);

    const body = await request.json();
    const data = updateSettingSchema.parse(body);

    await setSetting(
      decodeURIComponent(key),
      data.value,
      data.type as SettingType,
      {
        organizationId: data.organizationId ?? null,
        isSecret: data.isSecret ?? false,
        description: data.description,
        updatedBy: user?.userId,
      }
    );

    return NextResponse.json({ message: "Setting updated successfully" });
  },
  {
    action: "setting.updated",
    entity: "SystemSetting",
  }
);

