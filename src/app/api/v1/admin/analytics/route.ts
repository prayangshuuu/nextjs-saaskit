import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, apiHandler } from "@/lib/api-guards";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async (request: NextRequest) => {
  await requireAdmin(request);

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Total users
  const totalUsers = await prisma.user.count();

  // Active users (users who logged in within last 30 days)
  const activeUsers = await prisma.user.count({
    where: {
      sessions: {
        some: {
          expiresAt: {
            gte: thirtyDaysAgo,
          },
        },
      },
    },
  });

  // New signups (last 7 days)
  const newSignups7Days = await prisma.user.count({
    where: {
      createdAt: {
        gte: sevenDaysAgo,
      },
    },
  });

  // New signups (last 30 days)
  const newSignups30Days = await prisma.user.count({
    where: {
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
  });

  // Users by role
  const usersByRole = await prisma.role.findMany({
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          users: true,
        },
      },
    },
  });

  // Total organizations
  const totalOrganizations = await prisma.organization.count();

  // Active subscriptions
  const activeSubscriptions = await prisma.subscription.count({
    where: {
      status: "ACTIVE",
    },
  });

  // Total revenue (from paid invoices)
  const revenueData = await prisma.invoice.aggregate({
    where: {
      status: "PAID",
    },
    _sum: {
      amount: true,
    },
  });

  return NextResponse.json({
    users: {
      total: totalUsers,
      active: activeUsers,
      newSignups7Days,
      newSignups30Days,
      byRole: usersByRole.map((role) => ({
        roleId: role.id,
        roleName: role.name,
        count: role._count.users,
      })),
    },
    organizations: {
      total: totalOrganizations,
    },
    subscriptions: {
      active: activeSubscriptions,
    },
    revenue: {
      total: revenueData._sum.amount || 0,
    },
  });
});

