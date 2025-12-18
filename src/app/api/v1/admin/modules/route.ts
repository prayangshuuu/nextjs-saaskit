import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, apiHandler } from "@/lib/api-guards";
import { getAllModules, updateModule, clearModuleCache } from "@/lib/module-service";
import { getTenantFromRequest } from "@/lib/tenant";
import { z } from "zod";

const updateModuleSchema = z.object({
  key: z.string(),
  enabled: z.boolean().optional(),
  description: z.string().optional(),
  scope: z.enum(["GLOBAL", "PUBLIC", "AUTH", "ADMIN"]).optional(),
});

// Get all modules
export const GET = apiHandler(async (request: NextRequest) => {
  await requireAdmin(request);
  const organizationId = getTenantFromRequest(request);

  const modules = await getAllModules(organizationId);

  return NextResponse.json({ modules });
});

// Update module
export const PUT = apiHandler(
  async (request: NextRequest) => {
    await requireAdmin(request);
    const organizationId = getTenantFromRequest(request);
    const body = await request.json();
    const data = updateModuleSchema.parse(body);

    // Get authenticated user for updatedBy
    const { getAuthenticatedUser } = await import("@/lib/api-guards");
    const user = await getAuthenticatedUser(request);

    // Check dependency rules
    if (data.enabled === false) {
      // Cannot disable admin module
      if (data.key === "admin") {
        return NextResponse.json(
          { error: "Cannot disable admin module" },
          { status: 400 }
        );
      }

      // Cannot disable auth if dashboard is enabled
      if (data.key === "auth") {
        const dashboardModule = await import("@/lib/module-service").then((m) =>
          m.isModuleEnabled("dashboard", { organizationId })
        );
        if (dashboardModule) {
          return NextResponse.json(
            { error: "Cannot disable auth module while dashboard is enabled" },
            { status: 400 }
          );
        }
      }

      // Cannot disable dashboard if users exist
      if (data.key === "dashboard") {
        const { prisma } = await import("@/lib/prisma");
        const userCount = await prisma.user.count();
        if (userCount > 0) {
          return NextResponse.json(
            { error: "Cannot disable dashboard module while users exist" },
            { status: 400 }
          );
        }
      }
    }

    const updated = await updateModule(
      data.key,
      {
        enabled: data.enabled,
        description: data.description,
        scope: data.scope,
      },
      organizationId,
      user?.userId
    );

    // Clear module cache after update
    clearModuleCache(data.key);

    return NextResponse.json({ module: updated });
  },
  {
    action: "module.update",
    entity: "SystemModule",
  }
);

