import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession, createRefreshToken } from "@/lib/auth";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import { RoleName } from "@/lib/rbac";
import { apiHandler } from "@/lib/api-guards";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { email, password, name } = registerSchema.parse(body);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "User with this email already exists" },
      { status: 400 }
    );
  }

  // Get USER role (default role)
  const userRole = await prisma.role.findUnique({
    where: { name: RoleName.USER },
  });

  if (!userRole) {
    return NextResponse.json(
      { error: "User role not found. Please run seed script." },
      { status: 500 }
    );
  }

  // Create user
  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      roleId: userRole.id,
    },
  });

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

