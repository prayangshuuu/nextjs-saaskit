import { NextRequest, NextResponse } from "next/server";
import { requireAuth, apiHandler } from "@/lib/api-guards";
import { prisma } from "@/lib/prisma";

export const DELETE = apiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const user = await requireAuth(request);
  const { id } = await params;

  const apiKey = await prisma.apiKey.findUnique({
    where: { id },
  });

  if (!apiKey || apiKey.userId !== user.userId) {
    return NextResponse.json(
      { error: "API key not found" },
      { status: 404 }
    );
  }

  await prisma.apiKey.update({
    where: { id },
    data: { revoked: true },
  });

  return NextResponse.json({ message: "API key revoked successfully" });
});

