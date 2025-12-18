import { NextRequest, NextResponse } from "next/server";
import { getTenantFromRequest } from "./tenant";
import { trackUsage } from "./usage-tracking";
import { enforceLimit } from "./plan-limits";

export function withUsageTracking(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const organizationId = getTenantFromRequest(request);

    // Enforce API request limits before processing
    if (organizationId && request.nextUrl.pathname.startsWith("/api/v1")) {
      const limitCheck = await enforceLimit(request, "api_requests", 1);
      if (!limitCheck.allowed && limitCheck.response) {
        return limitCheck.response;
      }
    }

    const response = await handler(request);

    // Track API requests if organization context exists
    if (organizationId && request.nextUrl.pathname.startsWith("/api/v1")) {
      try {
        await trackUsage({
          organizationId,
          metric: "api_requests",
          value: 1,
          metadata: {
            path: request.nextUrl.pathname,
            method: request.method,
            statusCode: response.status,
          },
        });
      } catch (error) {
        // Don't fail request if usage tracking fails
        console.error("Usage tracking failed:", error);
      }
    }

    return response;
  };
}

