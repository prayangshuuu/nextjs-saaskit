import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateRandomToken } from "@/lib/auth";
import { apiHandler } from "@/lib/api-guards";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { email } = forgotPasswordSchema.parse(body);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Don't reveal if user exists (security best practice)
  if (!user) {
    return NextResponse.json({
      message: "If an account exists, a password reset email has been sent.",
    });
  }

  // Generate reset token
  const token = generateRandomToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  // Send password reset notification
  const resetLink = `${env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
  notifyPasswordReset(user.id, resetLink).catch((error) => {
    console.error("Failed to send password reset notification:", error);
  });

  return NextResponse.json({
    message: "If an account exists, a password reset email has been sent.",
    // In development, return token for testing
    ...(process.env.NODE_ENV === "development" && { token }),
  });
});

