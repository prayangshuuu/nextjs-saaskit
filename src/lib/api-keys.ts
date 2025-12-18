import crypto from "crypto";
import { prisma } from "./prisma";

export function generateApiKey(): string {
  const prefix = "sk_live_";
  const randomBytes = crypto.randomBytes(32).toString("base64url");
  return `${prefix}${randomBytes}`;
}

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export async function verifyApiKey(key: string): Promise<{
  valid: boolean;
  userId?: string;
  scopes?: string[];
  rateLimit?: number;
}> {
  const keyHash = hashApiKey(key);
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { user: true },
  });

  if (
    !apiKey ||
    apiKey.revoked ||
    (apiKey.expiresAt && apiKey.expiresAt < new Date())
  ) {
    return { valid: false };
  }

  // Update last used timestamp
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    valid: true,
    userId: apiKey.userId,
    scopes: apiKey.scopes,
    rateLimit: apiKey.rateLimit,
  };
}

