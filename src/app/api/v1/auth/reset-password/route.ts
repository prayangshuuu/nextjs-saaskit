import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { apiHandler } from "@/lib/api-guards";

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { token, password } = resetPasswordSchema.parse(body);

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken) {
    return NextResponse.json(
      { error: "Invalid reset token" },
      { status: 400 }
    );
  }

  if (resetToken.used) {
    return NextResponse.json(
      { error: "Token already used" },
      { status: 400 }
    );
  }

  if (resetToken.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Token expired" },
      { status: 400 }
    );
  }

  // Update password
  const hashedPassword = await hashPassword(password);
  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { password: hashedPassword },
  });

  // Mark token as used
  await prisma.passwordResetToken.update({
    where: { id: resetToken.id },
    data: { used: true },
  });

  return NextResponse.json({ message: "Password reset successfully" });
});

