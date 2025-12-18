import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, apiHandler } from "@/lib/api-guards";
import { getAllModules, updateModule, clearModuleCacheFor } from "@/lib/module-service";
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

  const modules = await getAllModules();

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
      // Cannot disable admin module (hard rule)
      if (data.key === "admin") {
        return NextResponse.json(
          { error: "Cannot disable admin module. This is a critical system module." },
          { status: 400 }
        );
      }

      // Cannot disable auth if dashboard is enabled
      if (data.key === "auth") {
        const { isModuleEnabled } = await import("@/lib/module-service");
        const dashboardEnabled = await isModuleEnabled("dashboard", { organizationId });
        if (dashboardEnabled) {
          return NextResponse.json(
            { error: "Cannot disable auth module while dashboard is enabled. Users need authentication to access the dashboard." },
            { status: 400 }
          );
        }
      }

      // Cannot disable rest_api if api_docs is enabled
      if (data.key === "rest_api") {
        const { isModuleEnabled } = await import("@/lib/module-service");
        const apiDocsEnabled = await isModuleEnabled("api_docs", { organizationId });
        if (apiDocsEnabled) {
          return NextResponse.json(
            { error: "Cannot disable REST API module while API docs are enabled. Disable API docs first." },
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
            { error: "Cannot disable dashboard module while users exist. Please remove all users first." },
            { status: 400 }
          );
        }
      }

      // Cannot disable auth if dashboard is enabled (already checked above, but ensure consistency)
      if (data.key === "auth") {
        const { isModuleEnabled } = await import("@/lib/module-service");
        const dashboardEnabled = await isModuleEnabled("dashboard");
        if (dashboardEnabled) {
          return NextResponse.json(
            { error: "Cannot disable auth module while dashboard is enabled. Users need authentication to access the dashboard." },
            { status: 400 }
          );
        }
      }
    }

    const updated = await updateModule(
      data.key,
      data.enabled ?? true,
      user?.userId
    );

    // Clear module cache after update
    clearModuleCacheFor(data.key);

    return NextResponse.json({ module: updated });
  },
  {
    action: "module.update",
    entity: "SystemModule",
  }
);

