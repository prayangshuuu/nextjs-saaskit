import { NextRequest, NextResponse } from "next/server";
import { requireAuth, apiHandler } from "@/lib/api-guards";
import { prisma } from "@/lib/prisma";
import { generateSecret, generateQRCode, encryptSecret } from "@/lib/two-factor";
import { getStringSetting } from "@/lib/settings-service";

export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await requireAuth(request);

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

  // Get app name for QR code
  const appName = await getStringSetting("app.name", "SaaS Kit", null);

  // Generate secret
  const { secret, otpauthUrl } = generateSecret(user.email, appName);

  // Generate QR code
  const qrCodeDataUrl = await generateQRCode(otpauthUrl);

  // Store secret temporarily (encrypted) - user needs to verify before enabling
  // For now, we'll return it and require verification in the enable endpoint
  const encryptedSecret = encryptSecret(secret);

  return NextResponse.json({
    secret,
    qrCode: qrCodeDataUrl,
    // Don't store secret yet - wait for verification
    tempSecret: encryptedSecret,
  });
});

