import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiHandler } from "@/lib/api-guards-with-rate-limit";
import { generateApiKey, hashApiKey } from "@/lib/api-keys";
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { verifyApiKey } from "@/lib/api-keys";

const createApiKeySchema = z.object({
  name: z.string().min(1),
  scopes: z.array(z.string()).optional().default([]),
  rateLimit: z.number().int().positive().optional().default(100),
  expiresAt: z.string().datetime().optional(),
});

export const POST = apiHandler(async (request: NextRequest) => {
  // Check rate limiting for API key requests
  const identifier = getRateLimitIdentifier(request);
  const limitCheck = checkRateLimit(identifier, 10); // 10 requests per minute for API key creation
  if (!limitCheck.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": "10",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": limitCheck.resetAt.toString(),
        },
      }
    );
  }

  const user = await requireAuth(request);
  const body = await request.json();
  const data = createApiKeySchema.parse(body);

  const key = generateApiKey();
  const keyHash = hashApiKey(key);

  const apiKey = await prisma.apiKey.create({
    data: {
      userId: user.userId,
      name: data.name,
      key: key, // Store plain key for display (in production, only return once)
      keyHash,
      scopes: data.scopes,
      rateLimit: data.rateLimit,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });

  // Return the key only once (in production, consider secure storage)
  return NextResponse.json(
    {
      id: apiKey.id,
      name: apiKey.name,
      key: key, // Only returned on creation
      scopes: apiKey.scopes,
      rateLimit: apiKey.rateLimit,
      createdAt: apiKey.createdAt,
    },
    { status: 201 }
  );
});

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);

  const apiKeys = await prisma.apiKey.findMany({
    where: {
      userId: user.userId,
    },
    select: {
      id: true,
      name: true,
      key: false, // Don't expose full key
      scopes: true,
      rateLimit: true,
      lastUsedAt: true,
      expiresAt: true,
      revoked: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ apiKeys });
});

