/**
 * Prisma Client
 * 
 * MIT License
 * Copyright (c) 2025 Prayangshu Biswas
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Prisma middleware for tenant isolation
prisma.$use(async (params, next) => {
  // Get tenant context from request (set by middleware)
  const tenantId = (globalThis as any).__tenantId;

  if (tenantId && params.model) {
    // Enforce tenant isolation for multi-tenant models
    const tenantAwareModels = [
      "Subscription",
      "Invoice",
      "ApiKey",
      "UsageRecord",
      "AuditLog",
    ];

    if (tenantAwareModels.includes(params.model)) {
      if (params.action === "findMany" || params.action === "findFirst") {
        params.args = params.args || {};
        params.args.where = {
          ...params.args.where,
          organizationId: tenantId,
        };
      } else if (params.action === "create") {
        params.args = params.args || {};
        params.args.data = {
          ...params.args.data,
          organizationId: tenantId,
        };
      } else if (params.action === "update" || params.action === "updateMany") {
        params.args = params.args || {};
        params.args.where = {
          ...params.args.where,
          organizationId: tenantId,
        };
      } else if (params.action === "delete" || params.action === "deleteMany") {
        params.args = params.args || {};
        params.args.where = {
          ...params.args.where,
          organizationId: tenantId,
        };
      }
    }
  }

  return next(params);
});
