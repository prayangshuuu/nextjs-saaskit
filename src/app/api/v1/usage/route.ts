import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiHandler } from "@/lib/api-guards";
import { getTenantFromRequest } from "@/lib/tenant";
import { getAllUsage, getUsage } from "@/lib/usage-tracking";
import { getOrganizationPlanLimits } from "@/lib/plan-limits";

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);
  const organizationId = getTenantFromRequest(request);

  if (!organizationId) {
    return NextResponse.json(
      { error: "Organization context required" },
      { status: 400 }
    );
  }

  // Verify user is member of organization
  const member = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId: user.userId,
      },
    },
  });

  if (!member) {
    return NextResponse.json(
      { error: "Not a member of this organization" },
      { status: 403 }
    );
  }

  // Get current usage
  const currentUsage = await getAllUsage(organizationId);

  // Get plan limits
  const limits = await getOrganizationPlanLimits(organizationId);

  // Calculate usage percentages
  const usageWithLimits: Record<string, {
    current: number;
    limit: number | null;
    percentage: number;
  }> = {};

  for (const [metric, value] of Object.entries(currentUsage)) {
    const limit = limits?.[metric as keyof typeof limits];
    usageWithLimits[metric] = {
      current: value,
      limit: limit || null,
      percentage: limit ? Math.min((value / limit) * 100, 100) : 0,
    };
  }

  return NextResponse.json({
    usage: usageWithLimits,
    limits: limits || {},
  });
});

