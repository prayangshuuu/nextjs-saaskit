import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, apiHandler } from "@/lib/api-guards";
import { testSmtpConnection, encryptPassword } from "@/lib/smtp";

const smtpConfigSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().positive(),
  username: z.string().min(1),
  password: z.string().min(1),
  fromName: z.string().min(1),
  fromEmail: z.string().email(),
  secure: z.boolean().default(false),
  enabled: z.boolean().default(false),
  organizationId: z.string().optional().nullable(),
});

export const GET = apiHandler(async (request: NextRequest) => {
  await requireAdmin(request);

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId");

  const config = await prisma.smtpConfig.findUnique({
    where: { organizationId: organizationId || null },
  });

  if (!config) {
    return NextResponse.json({ config: null });
  }

  // Return config with masked password
  return NextResponse.json({
    config: {
      id: config.id,
      organizationId: config.organizationId,
      host: config.host,
      port: config.port,
      username: config.username,
      password: "***", // Masked
      fromName: config.fromName,
      fromEmail: config.fromEmail,
      secure: config.secure,
      enabled: config.enabled,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    },
  });
});

export const PUT = apiHandler(
  async (request: NextRequest) => {
    await requireAdmin(request);

    const body = await request.json();
    const data = smtpConfigSchema.parse(body);

    // Encrypt password
    const encryptedPassword = encryptPassword(data.password);

    const config = await prisma.smtpConfig.upsert({
      where: { organizationId: data.organizationId || null },
      update: {
        host: data.host,
        port: data.port,
        username: data.username,
        password: encryptedPassword,
        fromName: data.fromName,
        fromEmail: data.fromEmail,
        secure: data.secure,
        enabled: data.enabled,
      },
      create: {
        organizationId: data.organizationId || null,
        host: data.host,
        port: data.port,
        username: data.username,
        password: encryptedPassword,
        fromName: data.fromName,
        fromEmail: data.fromEmail,
        secure: data.secure,
        enabled: data.enabled,
      },
    });

    return NextResponse.json({
      config: {
        id: config.id,
        organizationId: config.organizationId,
        host: config.host,
        port: config.port,
        username: config.username,
        password: "***", // Masked
        fromName: config.fromName,
        fromEmail: config.fromEmail,
        secure: config.secure,
        enabled: config.enabled,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      },
    });
  },
  {
    action: "smtp.updated",
    entity: "SmtpConfig",
  }
);

