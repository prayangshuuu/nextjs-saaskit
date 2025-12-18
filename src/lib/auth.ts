import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
export { JWTPayload, generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from "./jwt";

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Session management
export async function createSession(userId: string, token: string): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });
}

export async function deleteSession(token: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { token },
  });
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { userId },
  });
}

// Refresh token management
export async function createRefreshToken(
  userId: string,
  token: string
): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await prisma.refreshToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });
}

export async function deleteRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { token },
  });
}

export async function validateRefreshToken(token: string): Promise<boolean> {
  const refreshToken = await prisma.refreshToken.findUnique({
    where: { token },
  });

  if (!refreshToken) return false;
  if (refreshToken.expiresAt < new Date()) return false;

  return true;
}

// Token generation utilities
export function generateRandomToken(): string {
  return crypto.randomUUID() + "-" + Date.now().toString(36);
}

