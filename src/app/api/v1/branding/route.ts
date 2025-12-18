import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-guards";
import { getBrandingConfig, generateBrandingCSS } from "@/lib/branding";
import { getTenantFromRequest } from "@/lib/tenant";

export const GET = apiHandler(async (request: NextRequest) => {
  const organizationId = getTenantFromRequest(request);
  const config = await getBrandingConfig(organizationId);

  return NextResponse.json({
    branding: config,
    css: generateBrandingCSS(config),
  });
});

