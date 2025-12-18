import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-guards";

const verifyEmailSchema = z.object({
  token: z.string(),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { token } = verifyEmailSchema.parse(body);

  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    return NextResponse.json(
      { error: "Invalid verification token" },
      { status: 400 }
    );
  }

  if (verificationToken.used) {
    return NextResponse.json(
      { error: "Token already used" },
      { status: 400 }
    );
  }

  if (verificationToken.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Token expired" },
      { status: 400 }
    );
  }

  // Update user
  await prisma.user.update({
    where: { id: verificationToken.userId },
    data: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  // Mark token as used
  await prisma.emailVerificationToken.update({
    where: { id: verificationToken.id },
    data: { used: true },
  });

  return NextResponse.json({ message: "Email verified successfully" });
});

