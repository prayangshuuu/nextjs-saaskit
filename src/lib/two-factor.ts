import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { prisma } from "./prisma";
import { hashPassword, verifyPassword } from "./auth";
import crypto from "crypto";

/**
 * Two-Factor Authentication Service
 * 
 * MIT License
 * Copyright (c) 2025 Prayangshu Biswas
 */

// Generate TOTP secret for a user
export function generateSecret(email: string, appName: string = "SaaS Kit"): {
  secret: string;
  otpauthUrl: string;
} {
  const secret = speakeasy.generateSecret({
    name: `${appName} (${email})`,
    length: 32,
  });

  return {
    secret: secret.base32!,
    otpauthUrl: secret.otpauth_url!,
  };
}

// Generate QR code data URL
export async function generateQRCode(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl);
}

// Verify TOTP token
export function verifyTOTP(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 2, // Allow 2 time steps (60 seconds) of tolerance
  });
}

// Generate recovery codes
export function generateRecoveryCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push(code);
  }
  return codes;
}

// Hash recovery code (similar to password hashing)
export async function hashRecoveryCode(code: string): Promise<string> {
  return hashPassword(code);
}

// Verify recovery code
export async function verifyRecoveryCode(
  code: string,
  hashedCode: string
): Promise<boolean> {
  return verifyPassword(code, hashedCode);
}

// Encrypt 2FA secret (simple base64 for now, use proper encryption in production)
export function encryptSecret(secret: string): string {
  return Buffer.from(secret).toString("base64");
}

// Decrypt 2FA secret
export function decryptSecret(encrypted: string): string {
  return Buffer.from(encrypted, "base64").toString("utf-8");
}

// Save recovery codes for user
export async function saveRecoveryCodes(
  userId: string,
  codes: string[]
): Promise<void> {
  // Delete existing unused codes
  await prisma.twoFactorRecoveryCode.deleteMany({
    where: {
      userId,
      used: false,
    },
  });

  // Create new codes
  for (const code of codes) {
    const hashedCode = await hashRecoveryCode(code);
    await prisma.twoFactorRecoveryCode.create({
      data: {
        userId,
        code: hashedCode,
      },
    });
  }
}

// Verify and use recovery code
export async function useRecoveryCode(
  userId: string,
  code: string
): Promise<boolean> {
  const recoveryCodes = await prisma.twoFactorRecoveryCode.findMany({
    where: {
      userId,
      used: false,
    },
  });

  for (const recoveryCode of recoveryCodes) {
    const isValid = await verifyRecoveryCode(code, recoveryCode.code);
    if (isValid) {
      await prisma.twoFactorRecoveryCode.update({
        where: { id: recoveryCode.id },
        data: {
          used: true,
          usedAt: new Date(),
        },
      });
      return true;
    }
  }

  return false;
}

