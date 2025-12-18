import { NextRequest } from "next/server";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

const store: RateLimitStore = {};

export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const key = identifier;

  if (!store[key] || store[key].resetAt < now) {
    store[key] = {
      count: 1,
      resetAt: now + windowMs,
    };
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: store[key].resetAt,
    };
  }

  if (store[key].count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: store[key].resetAt,
    };
  }

  store[key].count += 1;
  return {
    allowed: true,
    remaining: limit - store[key].count,
    resetAt: store[key].resetAt,
  };
}

export function getRateLimitIdentifier(request: NextRequest): string {
  // Try API key first
  const apiKey = request.headers.get("x-api-key");
  if (apiKey) {
    return `api_key:${apiKey}`;
  }

  // Fall back to IP address
  const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown";
  return `ip:${ip}`;
}

