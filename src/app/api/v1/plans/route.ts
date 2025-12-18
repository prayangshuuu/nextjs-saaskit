import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-guards";

export const GET = apiHandler(async (request: NextRequest) => {
  // Public endpoint - show only active plans
  const plans = await prisma.plan.findMany({
    where: {
      active: true,
    },
    orderBy: [
      { interval: "asc" },
      { price: "asc" },
    ],
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      interval: true,
      features: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ plans });
});

