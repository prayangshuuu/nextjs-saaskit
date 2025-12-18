import nodemailer from "nodemailer";
import { prisma } from "./prisma";
import { getTenantFromRequest } from "./tenant";
import { NextRequest } from "next/server";

export interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
  secure: boolean;
}

// Simple encryption/decryption (in production, use proper encryption library)
function encryptPassword(password: string): string {
  // In production, use crypto.createCipheriv or a library like @aws-sdk/client-kms
  // For now, base64 encoding (NOT secure, but better than plain text)
  return Buffer.from(password).toString("base64");
}

function decryptPassword(encrypted: string): string {
  return Buffer.from(encrypted, "base64").toString("utf-8");
}

export async function getSmtpConfig(organizationId: string | null): Promise<SmtpConfig | null> {
  // Try org-specific config first
  if (organizationId) {
    const orgConfig = await prisma.smtpConfig.findUnique({
      where: { organizationId },
    });

    if (orgConfig && orgConfig.enabled) {
      return {
        host: orgConfig.host,
        port: orgConfig.port,
        username: orgConfig.username,
        password: decryptPassword(orgConfig.password),
        fromName: orgConfig.fromName,
        fromEmail: orgConfig.fromEmail,
        secure: orgConfig.secure,
      };
    }
  }

  // Fallback to global config
  const globalConfig = await prisma.smtpConfig.findUnique({
    where: { organizationId: null },
  });

  if (globalConfig && globalConfig.enabled) {
    return {
      host: globalConfig.host,
      port: globalConfig.port,
      username: globalConfig.username,
      password: decryptPassword(globalConfig.password),
      fromName: globalConfig.fromName,
      fromEmail: globalConfig.fromEmail,
      secure: globalConfig.secure,
    };
  }

  return null;
}

export async function createTransporter(config: SmtpConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure, // true for 465, false for other ports
    auth: {
      user: config.username,
      pass: config.password,
    },
  });
}

export async function testSmtpConnection(config: SmtpConfig): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = await createTransporter(config);
    await transporter.verify();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

