import { NextRequest, NextResponse } from "next/server";
import { requireAuth, apiHandler } from "@/lib/api-guards";
import { prisma } from "@/lib/prisma";
import { verifyTOTP, decryptSecret, useRecoveryCode } from "@/lib/two-factor";
import { z } from "zod";

const disable2FASchema = z.object({
  token: z.string(), // TOTP token or recovery code
  useRecoveryCode: z.boolean().default(false),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await requireAuth(request);

  const body = await request.json();
  const { token, useRecoveryCode } = disable2FASchema.parse(body);

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    return NextResponse.json(
      { error: "2FA is not enabled" },
      { status: 400 }
    );
  }

  let isValid = false;

  if (useRecoveryCode) {
    // Verify recovery code
    isValid = await useRecoveryCode(auth.userId, token);
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

  // Disable 2FA
  await prisma.user.update({
    where: { id: auth.userId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    },
  });

  // Delete all recovery codes
  await prisma.twoFactorRecoveryCode.deleteMany({
    where: { userId: auth.userId },
  });

  return NextResponse.json({
    message: "2FA disabled successfully",
  });
});

