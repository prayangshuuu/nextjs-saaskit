import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession, createRefreshToken, deleteAllUserSessions } from "@/lib/auth";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import { apiHandler } from "@/lib/api-guards";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { email, password } = loginSchema.parse(body);

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.password);
  if (!isValidPassword) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  // Delete old sessions (optional: for security)
  await deleteAllUserSessions(user.id);

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    roleId: user.roleId,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    email: user.email,
    roleId: user.roleId,
  });

  // Create sessions
  await createSession(user.id, accessToken);
  await createRefreshToken(user.id, refreshToken);

  // Create response
  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      role: user.role.name,
    },
  });

  // Set cookies
  response.cookies.set("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 15, // 15 minutes
  });

  response.cookies.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
});

