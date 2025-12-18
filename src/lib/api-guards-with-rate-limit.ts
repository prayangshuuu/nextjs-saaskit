import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "./jwt";
import { hasPermission, isAdmin, PermissionResource, PermissionAction } from "./rbac";
import { checkRateLimit, getRateLimitIdentifier } from "./rate-limit";
import { verifyApiKey } from "./api-keys";

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
    roleId: string;
  };
}

// Extract user from request token or API key
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<{ userId: string; email: string; roleId: string } | null> {
  // Check for API key first
  const apiKey = request.headers.get("x-api-key");
  if (apiKey) {
    const keyInfo = await verifyApiKey(apiKey);
    if (keyInfo.valid && keyInfo.userId) {
      // Apply rate limiting
      const identifier = getRateLimitIdentifier(request);
      const rateLimit = keyInfo.rateLimit || 100;
      const limitCheck = checkRateLimit(identifier, rateLimit);

      if (!limitCheck.allowed) {
        throw new Error("RATE_LIMIT_EXCEEDED");
      }

      // Get user from database
      const { prisma } = await import("./prisma");
      const user = await prisma.user.findUnique({
        where: { id: keyInfo.userId },
      });

      if (user) {
        return {
          userId: user.id,
          email: user.email,
          roleId: user.roleId,
        };
      }
    }
    return null;
  }

  // Fall back to JWT token
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

// API error handler wrapper
export function apiHandler(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(request);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Unauthorized") {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (error.message === "RATE_LIMIT_EXCEEDED") {
          return NextResponse.json(
            { error: "Rate limit exceeded" },
            { status: 429 }
          );
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

