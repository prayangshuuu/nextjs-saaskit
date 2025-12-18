import { NextRequest, NextResponse } from "next/server";
import { requireAuth, apiHandler } from "@/lib/api-guards";
import { prisma } from "@/lib/prisma";
import { verifyTOTP, encryptSecret, decryptSecret, generateRecoveryCodes, saveRecoveryCodes } from "@/lib/two-factor";
import { z } from "zod";

const enable2FASchema = z.object({
  token: z.string().length(6), // TOTP token
  tempSecret: z.string(), // Temporary secret from setup
});

export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await requireAuth(request);

  const body = await request.json();
  const { token, tempSecret } = enable2FASchema.parse(body);

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.twoFactorEnabled) {
    return NextResponse.json(
      { error: "2FA is already enabled" },
      { status: 400 }
    );
  }

  // Decrypt and verify token
  const secret = decryptSecret(tempSecret);
  const isValid = verifyTOTP(secret, token);

  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid verification code" },
      { status: 400 }
    );
  }

  // Generate recovery codes
  const recoveryCodes = generateRecoveryCodes(10);

  // Enable 2FA and save secret
  await prisma.user.update({
    where: { id: auth.userId },
    data: {
      twoFactorEnabled: true,
      twoFactorSecret: encryptSecret(secret),
    },
  });

  // Save recovery codes
  await saveRecoveryCodes(auth.userId, recoveryCodes);

  return NextResponse.json({
    message: "2FA enabled successfully",
    recoveryCodes, // Show only once - user must save these
  });
});

