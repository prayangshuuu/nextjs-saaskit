import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, apiHandler } from "@/lib/api-guards";

const updateTemplateSchema = z.object({
  subject: z.string().min(1).optional(),
  htmlBody: z.string().min(1).optional(),
  textBody: z.string().optional().nullable(),
  enabled: z.boolean().optional(),
});

export const GET = apiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  await requireAdmin(request);
  const { id } = await params;

  const template = await prisma.emailTemplate.findUnique({
    where: { id },
  });

  if (!template) {
    return NextResponse.json(
      { error: "Template not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ template });
});

export const PUT = apiHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    await requireAdmin(request);
    const { id } = await params;

    const body = await request.json();
    const data = updateTemplateSchema.parse(body);

    const template = await prisma.emailTemplate.update({
      where: { id },
      data,
    });

    return NextResponse.json({ template });
  },
  {
    action: "email_template.updated",
    entity: "EmailTemplate",
  }
);

