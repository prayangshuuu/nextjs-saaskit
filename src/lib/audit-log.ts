import { prisma } from "./prisma";
import { getTenantFromRequest } from "./tenant";
import { NextRequest } from "next/server";

export interface AuditLogData {
  actorId: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, any>;
  organizationId?: string | null;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: data.actorId,
        organizationId: data.organizationId || null,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId || null,
        metadata: data.metadata || {},
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      },
    });
  } catch (error) {
    // Don't fail request if audit logging fails
    console.error("Audit log creation failed:", error);
  }
}

export function getClientInfo(request: NextRequest): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  // Get IP address from headers (considering proxies)
  const forwarded = request.headers.get("x-forwarded-for");
  const ipAddress = forwarded
    ? forwarded.split(",")[0].trim()
    : request.headers.get("x-real-ip") || null;

  const userAgent = request.headers.get("user-agent") || null;

  return { ipAddress, userAgent };
}

// Mask sensitive data in metadata
export function maskSensitiveData(data: Record<string, any>): Record<string, any> {
  const sensitiveKeys = ["password", "token", "secret", "key", "apiKey", "apiSecret"];
  const masked = { ...data };

  for (const key of Object.keys(masked)) {
    if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
      masked[key] = "[REDACTED]";
    } else if (typeof masked[key] === "object" && masked[key] !== null) {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }

  return masked;
}

