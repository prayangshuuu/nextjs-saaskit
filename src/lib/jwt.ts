import jwt from "jsonwebtoken";
import { env } from "./env";

export interface JWTPayload {
  userId: string;
  email: string;
  roleId: string;
}

// JWT Token verification (Edge-compatible, no Prisma)
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

