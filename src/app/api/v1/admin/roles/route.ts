import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, apiHandler } from "@/lib/api-guards";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async (request: NextRequest) => {
  await requireAdmin(request);

  const roles = await prisma.role.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ roles });
});

