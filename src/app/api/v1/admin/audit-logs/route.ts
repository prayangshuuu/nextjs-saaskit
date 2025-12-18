import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, apiHandler } from "@/lib/api-guards";

export const GET = apiHandler(async (request: NextRequest) => {
  await requireAdmin(request);

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const organizationId = searchParams.get("organizationId");
  const action = searchParams.get("action");
  const entity = searchParams.get("entity");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  const where: any = {};

  if (userId) {
    where.actorId = userId;
  }

  if (organizationId) {
    where.organizationId = organizationId;
  }

  if (action) {
    where.action = {
      contains: action,
      mode: "insensitive",
    };
  }

  if (entity) {
    where.entity = entity;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  // Get actor user info
  const actorIds = [...new Set(logs.map((log) => log.actorId))];
  const actors = await prisma.user.findMany({
    where: {
      id: { in: actorIds },
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  const actorMap = new Map(actors.map((actor) => [actor.id, actor]));

  const logsWithActors = logs.map((log) => ({
    id: log.id,
    actor: actorMap.get(log.actorId) || { id: log.actorId, email: null, name: null },
    organization: log.organization,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId,
    metadata: log.metadata,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    createdAt: log.createdAt,
  }));

  return NextResponse.json({
    logs: logsWithActors,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

