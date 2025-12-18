import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, apiHandler } from "@/lib/api-guards";

export const GET = apiHandler(async (request: NextRequest) => {
  await requireAdmin(request);

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId");

  const templates = await prisma.emailTemplate.findMany({
    where: {
      organizationId: organizationId || null,
    },
    orderBy: {
      key: "asc",
    },
  });

  return NextResponse.json({ templates });
});

