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

// API error handler wrapper with tenant context
export function apiHandler(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Set tenant context from request
      const tenantId = getTenantFromRequest(request);
      setTenantContext(tenantId);

      const response = await handler(request);

      // Clear tenant context after request
      setTenantContext(null);

      return response;
    } catch (error) {
      // Clear tenant context on error
      setTenantContext(null);

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
  };
}

