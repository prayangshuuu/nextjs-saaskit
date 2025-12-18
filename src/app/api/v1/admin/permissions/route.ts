import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, apiHandler } from "@/lib/api-guards";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async (request: NextRequest) => {
  await requireAdmin(request);

  const permissions = await prisma.permission.findMany({
    orderBy: [{ resource: "asc" }, { action: "asc" }],
  });

  return NextResponse.json({ permissions });
});

