import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken } from "./lib/jwt";
import { getTenantFromRequest, setTenantContext } from "./lib/tenant";
import { checkApiModuleAccess, checkPageModuleAccess } from "./lib/module-enforcement";

// Public routes that don't require authentication
const publicRoutes = [
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/verify-email",
  "/api/v1/auth/reset-password",
  "/api/v1/auth/forgot-password",
  "/api/v1/plans",
  "/api/v1/webhooks",
];

// Admin-only API routes
const adminApiRoutes = ["/api/v1/admin"];

// Auth routes (login, register, etc.)
const authRoutes = ["/login", "/register", "/verify-email", "/reset-password", "/forgot-password"];

// Protected routes (require authentication)
const protectedRoutes = ["/dashboard", "/api/v1"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Set tenant context from request (for Prisma middleware)
  const tenantId = getTenantFromRequest(request);
  setTenantContext(tenantId);

  // COMING SOON MODE: Check if coming soon mode is enabled
  // This overrides ALL public modules
  if (!pathname.startsWith("/api/") && !pathname.startsWith("/_next/") && pathname !== "/coming-soon") {
    const { isModuleEnabled } = await import("./lib/module-service");
    const comingSoonEnabled = await isModuleEnabled("coming_soon");
    
    if (comingSoonEnabled) {
      // Allow admin routes to bypass coming soon
      const token = request.cookies.get("accessToken")?.value;
      if (token) {
        try {
          const { verifyAccessToken } = await import("./lib/jwt");
          const payload = verifyAccessToken(token);
          // Check if user is admin
          const { isAdmin } = await import("./lib/rbac");
          const admin = await isAdmin(payload.userId);
          if (admin) {
            // Admin can bypass coming soon
          } else {
            // Non-admin users see coming soon
            return NextResponse.rewrite(new URL("/coming-soon", request.url));
          }
        } catch {
          // Invalid token, show coming soon
          return NextResponse.rewrite(new URL("/coming-soon", request.url));
        }
      } else {
        // No token, show coming soon
        return NextResponse.rewrite(new URL("/coming-soon", request.url));
      }
    }
  }

  // MODULE ENFORCEMENT: Check if route is blocked by module state
  // This is the FIRST check - modules can disable entire features
  
  // Check API routes for module access
  if (pathname.startsWith("/api/")) {
    const moduleBlock = await checkApiModuleAccess(request);
    if (moduleBlock) {
      clearTenantContext();
      return moduleBlock;
    }
  }

  // Check page routes for module access
  if (!pathname.startsWith("/api/") && !pathname.startsWith("/_next/")) {
    const moduleBlock = await checkPageModuleAccess(request);
    if (moduleBlock) {
      clearTenantContext();
      return moduleBlock;
    }
  }

  // Note: Maintenance mode check happens in API handlers due to Edge runtime limitations
  // Full maintenance mode enforcement with admin bypass is handled in apiHandler

  // Check for API key authentication (rate limiting handled in API routes)
  // Note: API key verification happens in API route handlers, not middleware
  // to avoid Prisma client issues in Edge runtime

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    const response = NextResponse.next();
    clearTenantContext();
    return response;
  }

  // Check for authentication token
  const token = request.cookies.get("accessToken")?.value;

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !token) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if accessing auth routes with valid token
  if (isAuthRoute && token) {
    try {
      verifyAccessToken(token);
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } catch {
      // Token invalid, allow access to auth routes
    }
  }

  // Check admin routes
  // Note: Full admin check happens in API route handlers to avoid Prisma in Edge runtime
  if (adminApiRoutes.some((route) => pathname.startsWith(route))) {
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Token validation happens here, admin check happens in API handlers
  }

  const response = NextResponse.next();
  // Note: Tenant context is cleared in apiHandler, but we clear here too for safety
  return response;
}

function clearTenantContext() {
  delete (globalThis as any).__tenantId;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

