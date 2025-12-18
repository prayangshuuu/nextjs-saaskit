import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, apiHandler } from "@/lib/api-guards";
import { broadcastToOrganization, createNotification } from "@/lib/notification-service";

const broadcastSchema = z.object({
  organizationId: z.string().optional(),
  type: z.enum(["info", "success", "warning", "error"]),
  title: z.string().min(1),
  message: z.string().min(1),
  sendEmail: z.boolean().default(false),
  emailTemplateKey: z.string().optional(),
  emailVariables: z.record(z.any()).optional(),
});

export const POST = apiHandler(
  async (request: NextRequest) => {
    await requireAdmin(request);

    const body = await request.json();
    const data = broadcastSchema.parse(body);

    if (data.organizationId) {
      // Broadcast to organization
      await broadcastToOrganization(data.organizationId, {
        type: data.type,
        title: data.title,
        message: data.message,
        sendEmail: data.sendEmail,
        emailTemplateKey: data.emailTemplateKey,
        emailVariables: data.emailVariables,
      });
    } else {
      // Broadcast to all users (admin only)
      // This would require fetching all users - implement as needed
      return NextResponse.json(
        { error: "Broadcast to all users not yet implemented" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Notification broadcasted successfully",
    });
  },
  {
    action: "notification.broadcast",
    entity: "Notification",
  }
);

