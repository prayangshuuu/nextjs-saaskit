import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-guards";
import { prisma } from "@/lib/prisma";
import { verifyTOTP, decryptSecret, useRecoveryCode } from "@/lib/two-factor";
import { z } from "zod";

const verify2FASchema = z.object({
  userId: z.string(),
  token: z.string(),
  useRecoveryCode: z.boolean().default(false),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { userId, token, useRecoveryCode } = verify2FASchema.parse(body);

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    return NextResponse.json(
      { error: "2FA is not enabled for this user" },
      { status: 400 }
    );
  }

  let isValid = false;

  if (useRecoveryCode) {
    // Verify recovery code
    isValid = await useRecoveryCode(userId, token);
  } else {
    // Verify TOTP token
    const secret = decryptSecret(user.twoFactorSecret);
    isValid = verifyTOTP(secret, token);
  }

  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid verification code" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    verified: true,
  });
});

