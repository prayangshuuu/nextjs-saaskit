import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, apiHandler } from "@/lib/api-guards";
import { testSmtpConnection, encryptPassword } from "@/lib/smtp";

const testSmtpSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().positive(),
  username: z.string().min(1),
  password: z.string().min(1),
  secure: z.boolean().default(false),
});

export const POST = apiHandler(
  async (request: NextRequest) => {
    await requireAdmin(request);

    const body = await request.json();
    const data = testSmtpSchema.parse(body);

    const result = await testSmtpConnection({
      host: data.host,
      port: data.port,
      username: data.username,
      password: data.password,
      secure: data.secure,
      fromName: "Test",
      fromEmail: data.username,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "SMTP connection failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: "SMTP connection successful" });
  },
  {
    action: "smtp.tested",
    entity: "SmtpConfig",
  }
);

