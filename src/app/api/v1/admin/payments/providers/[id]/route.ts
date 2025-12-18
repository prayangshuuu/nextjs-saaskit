import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, apiHandler } from "@/lib/api-guards";

const updateProviderSchema = z.object({
  enabled: z.boolean().optional(),
  testMode: z.boolean().optional(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  webhookSecret: z.string().optional(),
  config: z.record(z.any()).optional(),
});

export const GET = apiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  await requireAdmin(request);
  const { id } = await params;

  const provider = await prisma.paymentProvider.findUnique({
    where: { id },
  });

  if (!provider) {
    return NextResponse.json(
      { error: "Payment provider not found" },
      { status: 404 }
    );
  }

  // Mask sensitive fields for display
  const maskedProvider = {
    ...provider,
    apiKey: provider.apiKey ? "••••••••" : null,
    apiSecret: provider.apiSecret ? "••••••••" : null,
    webhookSecret: provider.webhookSecret ? "••••••••" : null,
  };

  return NextResponse.json({ provider: maskedProvider });
});

export const PUT = apiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  await requireAdmin(request);
  const { id } = await params;

  const body = await request.json();
  const data = updateProviderSchema.parse(body);

  // Get existing provider to preserve fields not being updated
  const existing = await prisma.paymentProvider.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Payment provider not found" },
      { status: 404 }
    );
  }

  // Only update fields that are provided and not masked
  const updateData: any = {};
  
  if (data.enabled !== undefined) updateData.enabled = data.enabled;
  if (data.testMode !== undefined) updateData.testMode = data.testMode;
  if (data.config !== undefined) updateData.config = data.config;
  
  // Only update secrets if they're not masked (not starting with ••••)
  if (data.apiKey && !data.apiKey.startsWith("••••")) {
    updateData.apiKey = data.apiKey;
  }
  if (data.apiSecret && !data.apiSecret.startsWith("••••")) {
    updateData.apiSecret = data.apiSecret;
  }
  if (data.webhookSecret && !data.webhookSecret.startsWith("••••")) {
    updateData.webhookSecret = data.webhookSecret;
  }

  const provider = await prisma.paymentProvider.update({
    where: { id },
    data: updateData,
  });

  // Return masked version
  const maskedProvider = {
    ...provider,
    apiKey: provider.apiKey ? "••••••••" : null,
    apiSecret: provider.apiSecret ? "••••••••" : null,
    webhookSecret: provider.webhookSecret ? "••••••••" : null,
  };

  return NextResponse.json({ provider: maskedProvider });
});

