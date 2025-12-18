import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, apiHandler, getAuthenticatedUser } from "@/lib/api-guards";
import { getSmtpConfig } from "@/lib/smtp";
import { sendEmailSync } from "@/lib/email-service";
import { getTenantFromRequest } from "@/lib/tenant";
import { z } from "zod";

const testEmailSchema = z.object({
  to: z.string().email(),
});

export const POST = apiHandler(async (request: NextRequest) => {
  await requireAdmin(request);
  const organizationId = getTenantFromRequest(request);
  const user = await getAuthenticatedUser(request);

  const body = await request.json();
  const { to } = testEmailSchema.parse(body);

  // Verify SMTP is configured
  const smtpConfig = await getSmtpConfig(organizationId);
  if (!smtpConfig) {
    return NextResponse.json(
      { error: "SMTP not configured. Please configure SMTP settings first." },
      { status: 400 }
    );
  }

  // Send test email
  const result = await sendEmailSync(
    {
      to,
      subject: "Test Email from SaaS Kit",
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from your SaaS Kit installation.</p>
        <p>If you received this email, your SMTP configuration is working correctly.</p>
        <p>Sent by: ${user?.email || "System"}</p>
      `,
      text: "This is a test email from your SaaS Kit installation. If you received this email, your SMTP configuration is working correctly.",
    },
    organizationId
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Failed to send test email" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Test email sent successfully",
    messageId: result.messageId,
  });
});

