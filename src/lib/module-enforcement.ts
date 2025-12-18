/**
 * Module Enforcement Utilities
 * 
 * Maps routes to modules and provides enforcement helpers
 * 
 * MIT License
 * Copyright (c) 2025 Prayangshu Biswas
 */

import { NextRequest, NextResponse } from "next/server";
import { isModuleEnabled } from "./module-service";
import { getTenantFromRequest } from "./tenant";
import { getAuthenticatedUser } from "./api-guards";
import { isAdmin } from "./rbac";

/**
 * Map API routes to their required modules
 */
const API_MODULE_MAP: Record<string, string> = {
  // REST API module
  "/api/v1": "rest_api",
  
  // Auth module
  "/api/v1/auth": "auth",
  
  // Billing module
  "/api/v1/billing": "billing",
  "/api/v1/subscriptions": "billing",
  "/api/v1/invoices": "billing",
  "/api/v1/plans": "pricing",
  
  // Admin module
  "/api/v1/admin": "admin",
  
  // API docs module
  "/api/v1/docs": "api_docs",
  "/api/docs": "api_docs",
  
  // File uploads module
  "/api/v1/files": "file_uploads",
  
  // Notifications module
  "/api/v1/notifications": "notifications",
};

/**
 * Map page routes to their required modules
 */
const PAGE_MODULE_MAP: Record<string, string> = {
  "/": "landing",
  "/pricing": "pricing",
  "/dashboard": "dashboard",
  "/dashboard/subscriptions": "billing",
  "/dashboard/billing": "billing",
  "/dashboard/admin": "admin",
  "/login": "auth",
  "/register": "auth",
  "/verify-email": "auth",
  "/reset-password": "auth",
  "/forgot-password": "auth",
};

/**
 * Get module key for an API route
 */
export function getModuleForApiRoute(pathname: string): string | null {
  // Check exact matches first
  for (const [route, module] of Object.entries(API_MODULE_MAP)) {
    if (pathname === route || pathname.startsWith(route + "/")) {
      return module;
    }
  }
  
  // Check if it's any API route (requires rest_api module)
  if (pathname.startsWith("/api/v1/")) {
    return "rest_api";
  }
  
  return null;
}

/**
 * Get module key for a page route
 */
export function getModuleForPageRoute(pathname: string): string | null {
  // Check exact matches first
  for (const [route, module] of Object.entries(PAGE_MODULE_MAP)) {
    if (pathname === route || pathname.startsWith(route + "/")) {
      return module;
    }
  }
  
  // Dashboard routes require dashboard module
  if (pathname.startsWith("/dashboard")) {
    return "dashboard";
  }
  
  return null;
}

/**
 * Check if API route should be blocked based on module state
 * Admin routes bypass module checks
 */
export async function checkApiModuleAccess(
  request: NextRequest
): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;
  const moduleKey = getModuleForApiRoute(pathname);
  
  // No module mapping = allow (backwards compatibility)
  if (!moduleKey) {
    return null;
  }
  
  // Admin routes bypass module checks (admin module is always accessible to admins)
  if (moduleKey === "admin") {
    const user = await getAuthenticatedUser(request);
    if (user) {
      const admin = await isAdmin(user.userId);
      if (admin) {
        return null; // Admin can always access admin routes
      }
    }
  }
  
  // Check if module is enabled
  const tenantId = getTenantFromRequest(request);
  const enabled = await isModuleEnabled(moduleKey, { organizationId: tenantId });
  
  if (!enabled) {
    // Return appropriate error based on route type
    if (pathname.startsWith("/api/v1/admin")) {
      return NextResponse.json(
        { error: "This feature is currently disabled" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: "This feature is currently unavailable" },
      { status: 404 }
    );
  }
  
  return null; // Module enabled, allow access
}

/**
 * Check if page route should be blocked based on module state
 * Returns NextResponse (redirect or 404) or null if access allowed
 */
export async function checkPageModuleAccess(
  request: NextRequest
): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;
  const moduleKey = getModuleForPageRoute(pathname);
  
  // No module mapping = allow (backwards compatibility)
  if (!moduleKey) {
    return null;
  }
  
  // Get user context for scope checks
  const user = await getAuthenticatedUser(request);
  const tenantId = getTenantFromRequest(request);
  
  // Admin pages bypass module checks (admin can always access)
  if (moduleKey === "admin" || pathname.startsWith("/dashboard/admin")) {
    if (user) {
      const admin = await isAdmin(user.userId);
      if (admin) {
        return null; // Admin can always access admin pages
      }
    }
  }
  
  // Check if module is enabled with proper context
  const enabled = await isModuleEnabled(moduleKey, {
    userId: user?.userId,
    organizationId: tenantId,
    isAdmin: user ? await isAdmin(user.userId) : false,
  });
  
  if (!enabled) {
    // Return 404 for public pages, redirect for authenticated pages
    if (user) {
      // Authenticated user - redirect to home
      return NextResponse.redirect(new URL("/", request.url));
    } else {
      // Public page - return 404
      return NextResponse.rewrite(new URL("/404", request.url));
    }
  }
  
  return null; // Module enabled, allow access
}

