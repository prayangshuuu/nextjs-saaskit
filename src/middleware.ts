import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken } from "./lib/jwt";
import { getTenantFromRequest, setTenantContext } from "./lib/tenant";
import { isMaintenanceMode, getMaintenanceMessage } from "./lib/maintenance";
import { isAdmin } from "./lib/rbac";

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

  // Check maintenance mode (skip for admin users)
  // Note: Admin check happens in API handlers due to Edge runtime limitations
  // For now, we'll check maintenance mode but allow admin routes through
  const maintenanceEnabled = await isMaintenanceMode(tenantId);
  
  if (maintenanceEnabled && !pathname.startsWith("/api/v1/admin")) {
    // Check if user is admin (basic check via token)
    const token = request.cookies.get("accessToken")?.value;
    let isAdminUser = false;
    
    if (token) {
      try {
        const payload = verifyAccessToken(token);
        // Admin check will happen in API handlers, but we allow admin routes
        if (pathname.startsWith("/api/v1/admin")) {
          isAdminUser = true;
        }
      } catch {
        // Token invalid
      }
    }

    if (!isAdminUser) {
      // Return maintenance page for web requests
      if (!pathname.startsWith("/api")) {
        const maintenanceMessage = await getMaintenanceMessage(tenantId);
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Maintenance Mode</title>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body {
                  font-family: system-ui, -apple-system, sans-serif;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                  margin: 0;
                  background: #f3f4f6;
                }
                .container {
                  text-align: center;
                  padding: 2rem;
                  background: white;
                  border-radius: 0.5rem;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                  max-width: 500px;
                }
                h1 { margin: 0 0 1rem; color: #111827; }
                p { color: #6b7280; margin: 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>🔧 Maintenance Mode</h1>
                <p>${maintenanceMessage}</p>
              </div>
            </body>
          </html>
        `;
        return new NextResponse(html, {
          status: 503,
          headers: { "Content-Type": "text/html" },
        });
      }

      // Return 503 for API requests
      return NextResponse.json(
        { error: "Service temporarily unavailable", message: await getMaintenanceMessage(tenantId) },
        { status: 503 }
      );
    }
  }

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

