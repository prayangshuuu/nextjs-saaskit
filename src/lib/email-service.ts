import { getSmtpConfig, createTransporter } from "./smtp";
import { getTenantFromRequest } from "./tenant";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  fromName?: string;
}

export interface TemplateEmailOptions {
  to: string | string[];
  templateKey: string;
  variables: TemplateVariables;
  organizationId?: string | null;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Simple in-memory queue (in production, use Redis/BullMQ)
const emailQueue: Array<{ options: EmailOptions; organizationId: string | null }> = [];
let processingQueue = false;

async function processEmailQueue() {
  if (processingQueue) return;
  processingQueue = true;

  while (emailQueue.length > 0) {
    const item = emailQueue.shift();
    if (!item) break;

    try {
      await sendEmailInternal(item.options, item.organizationId);
    } catch (error) {
      console.error("Email queue processing error:", error);
      // Retry logic could be added here
    }
  }

  processingQueue = false;
}

async function sendEmailInternal(
  options: EmailOptions,
  organizationId: string | null
): Promise<EmailResult> {
  try {
    const smtpConfig = await getSmtpConfig(organizationId);

    if (!smtpConfig) {
      return {
        success: false,
        error: "No SMTP configuration found",
      };
    }

    const transporter = await createTransporter(smtpConfig);

    const mailOptions = {
      from: options.from || `${smtpConfig.fromName} <${smtpConfig.fromEmail}>`,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || (options.html ? stripHtml(options.html) : undefined),
    };

    const info = await transporter.sendMail(mailOptions);

    // Log email sent
    await prisma.auditLog.create({
      data: {
        actorId: "system", // System-generated email
        organizationId: organizationId,
        action: "email.sent",
        entity: "Email",
        metadata: {
          to: options.to,
          subject: options.subject,
          messageId: info.messageId,
        },
      },
    }).catch(() => {
      // Don't fail if audit log fails
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Log email failure
    await prisma.auditLog.create({
      data: {
        actorId: "system",
        organizationId: organizationId,
        action: "email.failed",
        entity: "Email",
        metadata: {
          to: options.to,
          subject: options.subject,
          error: errorMessage,
        },
      },
    }).catch(() => {
      // Don't fail if audit log fails
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

export async function sendEmail(
  options: EmailOptions,
  organizationId?: string | null
): Promise<EmailResult> {
  // If organizationId not provided, try to get from context
  const orgId = organizationId ?? null;

  // Add to queue for async processing
  emailQueue.push({ options, organizationId: orgId });

  // Process queue asynchronously
  setImmediate(() => {
    processEmailQueue().catch((error) => {
      console.error("Email queue processing error:", error);
    });
  });

  // Return immediately (fire-and-forget)
  return {
    success: true,
  };
}

// Send email using template
export async function sendTemplateEmail(
  options: TemplateEmailOptions
): Promise<EmailResult> {
  const rendered = await renderEmailTemplate(
    options.templateKey,
    options.variables,
    options.organizationId
  );

  if (!rendered) {
    return {
      success: false,
      error: `Template '${options.templateKey}' not found`,
    };
  }

  return sendEmail(
    {
      to: options.to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    },
    options.organizationId
  );
}

export async function sendEmailSync(
  options: EmailOptions,
  organizationId?: string | null
): Promise<EmailResult> {
  const orgId = organizationId ?? null;
  return sendEmailInternal(options, orgId);
}

// Helper to get organization ID from request
export function getOrganizationIdFromRequest(request?: NextRequest): string | null {
  if (!request) return null;
  return getTenantFromRequest(request);
}

