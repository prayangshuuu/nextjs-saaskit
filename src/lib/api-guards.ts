import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "./jwt";
import { hasPermission, isAdmin, PermissionResource, PermissionAction } from "./rbac";
import { getTenantFromRequest, setTenantContext } from "./tenant";

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
    roleId: string;
  };
}

// Extract user from request token
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<{ userId: string; email: string; roleId: string } | null> {
  try {
    const token = request.cookies.get("accessToken")?.value;
    if (!token) return null;

    const payload = verifyAccessToken(token);
    return payload;
  } catch {
    return null;
  }
}

// Require authentication middleware
export async function requireAuth(
  request: NextRequest
): Promise<{ userId: string; email: string; roleId: string }> {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

// Require admin role
export async function requireAdmin(request: NextRequest): Promise<void> {
  const user = await requireAuth(request);
  const admin = await isAdmin(user.userId);
  if (!admin) {
    throw new Error("Forbidden: Admin access required");
  }
}

// Require specific permission
export async function requirePermission(
  request: NextRequest,
  resource: PermissionResource,
  action: PermissionAction
): Promise<void> {
  const user = await requireAuth(request);
  const hasPerm = await hasPermission(user.userId, resource, action);
  if (!hasPerm) {
    throw new Error(`Forbidden: ${action} ${resource} permission required`);
  }
}

// API error handler wrapper with tenant context, usage tracking, and audit logging
export function apiHandler(
  handler: (request: NextRequest) => Promise<NextResponse>,
  auditConfig?: {
    action: string;
    entity: string;
    skipLogging?: boolean;
  }
) {
  return withUsageTracking(async (request: NextRequest): Promise<NextResponse> => {
    let user: { userId: string; email: string; roleId: string } | null = null;
    let response: NextResponse;

    // Check maintenance mode (bypass for admin)
    try {
      const { isMaintenanceMode, getMaintenanceMessage } = await import("./maintenance");
      const tenantId = getTenantFromRequest(request);
      const maintenanceEnabled = await isMaintenanceMode(tenantId);

      if (maintenanceEnabled) {
        // Check if user is admin
        user = await getAuthenticatedUser(request);
        if (user) {
          const admin = await isAdmin(user.userId);
          if (!admin) {
            const message = await getMaintenanceMessage(tenantId);
            return NextResponse.json(
              { error: "Service temporarily unavailable", message },
              { status: 503 }
            );
          }
        } else {
          // Not authenticated, return maintenance
          const message = await getMaintenanceMessage(tenantId);
          return NextResponse.json(
            { error: "Service temporarily unavailable", message },
            { status: 503 }
          );
        }
      }
    } catch (error) {
      // If maintenance check fails, continue (fail open)
      console.error("Maintenance check failed:", error);
    }

    try {
      // Set tenant context from request
      const tenantId = getTenantFromRequest(request);
      setTenantContext(tenantId);

      // Get user for audit logging
      try {
        user = await getAuthenticatedUser(request);
      } catch {
        // User not authenticated, skip audit logging
      }

      response = await handler(request);

      // Audit log successful actions
      if (
        user &&
        auditConfig &&
        !auditConfig.skipLogging &&
        response.status < 400
      ) {
        const { ipAddress, userAgent } = getClientInfo(request);
        const tenantId = getTenantFromRequest(request);

        // Extract entity ID from response if available
        let entityId: string | undefined;
        try {
          const responseData = await response.clone().json();
          if (responseData.user?.id) entityId = responseData.user.id;
          if (responseData.organization?.id) entityId = responseData.organization.id;
          if (responseData.plan?.id) entityId = responseData.plan.id;
          if (responseData.subscription?.id) entityId = responseData.subscription.id;
        } catch {
          // Response might not be JSON, ignore
        }

        await createAuditLog({
          actorId: user.userId,
          organizationId: tenantId,
          action: auditConfig.action,
          entity: auditConfig.entity,
          entityId,
          metadata: maskSensitiveData({
            method: request.method,
            path: request.nextUrl.pathname,
            statusCode: response.status,
          }),
          ipAddress: ipAddress || undefined,
          userAgent: userAgent || undefined,
        });
      }

      // Clear tenant context after request
      setTenantContext(null);

      return response;
    } catch (error) {
      // Clear tenant context on error
      setTenantContext(null);

      // Audit log failed actions
      if (user && auditConfig && !auditConfig.skipLogging) {
        const { ipAddress, userAgent } = getClientInfo(request);
        const tenantId = getTenantFromRequest(request);

        await createAuditLog({
          actorId: user.userId,
          organizationId: tenantId,
          action: `${auditConfig.action}.failed`,
          entity: auditConfig.entity,
          metadata: maskSensitiveData({
            method: request.method,
            path: request.nextUrl.pathname,
            error: error instanceof Error ? error.message : "Unknown error",
          }),
          ipAddress: ipAddress || undefined,
          userAgent: userAgent || undefined,
        });
      }

      if (error instanceof Error) {
        if (error.message === "Unauthorized") {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (error.message.includes("Forbidden")) {
          return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json(
          { error: error.message || "Internal server error" },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}

