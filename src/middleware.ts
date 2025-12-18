import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken } from "./lib/auth";
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

  // Check for API key authentication
  const apiKey = request.headers.get("x-api-key");
  if (apiKey && pathname.startsWith("/api/v1")) {
    const keyInfo = await verifyApiKey(apiKey);
    if (keyInfo.valid && keyInfo.userId) {
      // Apply rate limiting for API keys
      const identifier = getRateLimitIdentifier(request);
      const rateLimit = keyInfo.rateLimit || 100;
      const limitCheck = checkRateLimit(identifier, rateLimit);

      if (!limitCheck.allowed) {
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            resetAt: new Date(limitCheck.resetAt).toISOString(),
          },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": rateLimit.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": limitCheck.resetAt.toString(),
            },
          }
        );
      }

      // Add rate limit headers
      const response = NextResponse.next();
      response.headers.set("X-RateLimit-Limit", rateLimit.toString());
      response.headers.set(
        "X-RateLimit-Remaining",
        limitCheck.remaining.toString()
      );
      response.headers.set("X-RateLimit-Reset", limitCheck.resetAt.toString());
      return response;
    }
  }

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
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
  if (adminApiRoutes.some((route) => pathname.startsWith(route))) {
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const payload = verifyAccessToken(token);
      const userIsAdmin = await isAdmin(payload.userId);

      if (!userIsAdmin) {
        return NextResponse.json(
          { error: "Forbidden: Admin access required" },
          { status: 403 }
        );
      }
    } catch (error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
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

