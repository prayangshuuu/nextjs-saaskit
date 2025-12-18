import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiHandler } from "@/lib/api-guards";
import { getTenantFromRequest } from "@/lib/tenant";

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);
  const organizationId = getTenantFromRequest(request);

  const { searchParams } = new URL(request.url);
  const read = searchParams.get("read");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: any = {
    userId: user.userId,
  };

  if (organizationId) {
    where.organizationId = organizationId;
  }

  if (read !== null) {
    where.read = read === "true";
  }

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });

  const unreadCount = await prisma.notification.count({
    where: {
      ...where,
      read: false,
    },
  });

  return NextResponse.json({
    notifications,
    unreadCount,
  });
});

