import { prisma } from "./prisma";
import { getUsage, UsageMetric } from "./usage-tracking";
import { getTenantFromRequest } from "./tenant";
import { NextRequest, NextResponse } from "next/server";

export interface PlanLimits {
  api_requests?: number;
  active_users?: number;
  storage_bytes?: number;
  compute_seconds?: number;
  [key: string]: number | undefined;
}

export async function getOrganizationPlanLimits(
  organizationId: string
): Promise<PlanLimits | null> {
  // Get active subscription for organization
  const subscription = await prisma.subscription.findFirst({
    where: {
      organizationId,
      status: "ACTIVE",
    },
    include: {
      plan: true,
    },
  });

  if (!subscription || !subscription.plan.limits) {
    return null;
  }

  return subscription.plan.limits as PlanLimits;
}

export async function checkLimit(
  organizationId: string,
  metric: UsageMetric,
  value: number = 1
): Promise<{ allowed: boolean; current: number; limit: number | null }> {
  const limits = await getOrganizationPlanLimits(organizationId);
  const limit = limits?.[metric];

  if (limit === undefined || limit === null) {
    // No limit set, allow
    return { allowed: true, current: 0, limit: null };
  }

  const current = await getUsage(organizationId, metric);
  const newTotal = current + value;

  return {
    allowed: newTotal <= limit,
    current,
    limit,
  };
}

export async function enforceLimit(
  request: NextRequest,
  metric: UsageMetric,
  value: number = 1
): Promise<{ allowed: boolean; response?: NextResponse }> {
  const organizationId = getTenantFromRequest(request);

  if (!organizationId) {
    // No organization context, allow (might be user-level request)
    return { allowed: true };
  }

  const limitCheck = await checkLimit(organizationId, metric, value);

  if (!limitCheck.allowed) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: "Plan limit exceeded",
          metric,
          current: limitCheck.current,
          limit: limitCheck.limit,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limitCheck.limit?.toString() || "0",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(), // Next billing cycle
          },
        }
      ),
    };
  }

  return { allowed: true };
}

