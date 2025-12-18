import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, apiHandler } from "@/lib/api-guards";
import { getAllUsage } from "@/lib/usage-tracking";
import { getOrganizationPlanLimits } from "@/lib/plan-limits";

export const GET = apiHandler(async (request: NextRequest) => {
  await requireAdmin(request);

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId");

  if (organizationId) {
    // Get usage for specific organization
    const usage = await getAllUsage(organizationId);
    const limits = await getOrganizationPlanLimits(organizationId);

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    return NextResponse.json({
      organization: org,
      usage,
      limits: limits || {},
    });
  }

  // Get usage for all organizations
  const organizations = await prisma.organization.findMany({
    include: {
      _count: {
        select: {
          members: true,
        },
      },
    },
  });

  const usageData = await Promise.all(
    organizations.map(async (org) => {
      const usage = await getAllUsage(org.id);
      const limits = await getOrganizationPlanLimits(org.id);

      return {
        organization: {
          id: org.id,
          name: org.name,
          slug: org.slug,
          memberCount: org._count.members,
        },
        usage,
        limits: limits || {},
      };
    })
  );

  return NextResponse.json({ organizations: usageData });
});

