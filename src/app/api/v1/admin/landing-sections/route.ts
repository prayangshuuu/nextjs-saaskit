import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, apiHandler } from "@/lib/api-guards";
import { getModule, updateModule } from "@/lib/module-service";
import { LANDING_SECTIONS, LandingSectionKey } from "@/lib/landing-sections";
import { z } from "zod";

const updateSectionSchema = z.object({
  section: z.enum(["hero", "features", "pricing", "testimonials", "faq", "call_to_action"]),
  enabled: z.boolean(),
});

// Get landing page sections configuration
export const GET = apiHandler(async (request: NextRequest) => {
  await requireAdmin(request);

  const landingModule = await getModule("landing");
  const sectionStates = (landingModule?.metadata as Record<string, boolean>) || {};

  const sections = LANDING_SECTIONS.map((section) => ({
    key: section.key,
    enabled: sectionStates[section.key] !== false, // Default to enabled if not explicitly set
    description: section.description,
    moduleDependency: section.moduleDependency,
    defaultEnabled: section.defaultEnabled,
  }));

  return NextResponse.json({ sections });
});

// Update landing page section state
export const PUT = apiHandler(
  async (request: NextRequest) => {
    await requireAdmin(request);
    const body = await request.json();
    const { section, enabled } = updateSectionSchema.parse(body);

    // Get current landing module
    const landingModule = await getModule("landing");
    if (!landingModule) {
      return NextResponse.json(
        { error: "Landing module not found" },
        { status: 404 }
      );
    }

    // Update metadata with section state
    const currentMetadata = (landingModule.metadata as Record<string, boolean>) || {};
    const updatedMetadata = {
      ...currentMetadata,
      [section]: enabled,
    };

    // Update module metadata
    const { prisma } = await import("@/lib/prisma");
    const { getAuthenticatedUser } = await import("@/lib/api-guards");
    const user = await getAuthenticatedUser(request);

    const updated = await prisma.systemModule.update({
      where: { key: "landing" },
      data: {
        metadata: updatedMetadata,
        updatedBy: user?.userId,
        updatedAt: new Date(),
      },
    });

    // Clear module cache
    const { clearModuleCacheFor } = await import("@/lib/module-service");
    clearModuleCacheFor("landing");

    return NextResponse.json({ 
      section: {
        key: section,
        enabled,
      },
      module: updated,
    });
  },
  {
    action: "landing.section.update",
    entity: "LandingPageSection",
  }
);

