import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, apiHandler } from "@/lib/api-guards";

export const GET = apiHandler(async (request: NextRequest) => {
  await requireAdmin(request);

  const providers = await prisma.paymentProvider.findMany({
    orderBy: { type: "asc" },
    select: {
      id: true,
      type: true,
      enabled: true,
      testMode: true,
      config: true,
      createdAt: true,
      updatedAt: true,
      // Don't expose sensitive keys in list view
    },
  });

  return NextResponse.json({ providers });
});

