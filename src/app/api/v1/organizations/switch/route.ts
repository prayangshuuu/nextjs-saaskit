import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, apiHandler } from "@/lib/api-guards";
import { requireOrganizationAccess } from "@/lib/organization-guards";

const switchSchema = z.object({
  organizationId: z.string(),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);
  const body = await request.json();
  const { organizationId } = switchSchema.parse(body);

  // Verify user is a member of this organization
  await requireOrganizationAccess(request, organizationId);

  const response = NextResponse.json({
    message: "Organization switched successfully",
    organizationId,
  });

  // Set cookie for server-side access
  response.cookies.set("activeOrganizationId", organizationId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
});

