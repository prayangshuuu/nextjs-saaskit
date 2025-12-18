import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiHandler } from "@/lib/api-guards";

export const PUT = apiHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const user = await requireAuth(request);
    const { id } = await params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== user.userId) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({ notification: updated });
  },
  {
    action: "notification.read",
    entity: "Notification",
  }
);

