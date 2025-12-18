import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { env } from "./env";
import { prisma } from "./prisma";

export interface JWTPayload {
  userId: string;
  email: string;
  roleId: string;
}

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

// JWT Token generation
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
}

export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
}

// JWT Token verification
export function verifyAccessToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error("Invalid or expired access token");
  }
}

export function verifyRefreshToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
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

