import { NextRequest } from "next/server";

// Set tenant context for Prisma middleware
export function setTenantContext(organizationId: string | null) {
  (globalThis as any).__tenantId = organizationId;
}

// Clear tenant context
export function clearTenantContext() {
  delete (globalThis as any).__tenantId;
}

// Get tenant context from request
export function getTenantFromRequest(request: NextRequest): string | null {
  // Try to get from header first (API requests)
  const orgId = request.headers.get("x-organization-id");
  if (orgId) return orgId;

  // Try to get from cookies (web requests)
  const orgCookie = request.cookies.get("activeOrganizationId");
  if (orgCookie) return orgCookie.value;

  return null;
}

