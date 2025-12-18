import { prisma } from "./prisma";
import { sendTemplateEmail } from "./email-service";

export interface NotificationData {
  userId: string;
  organizationId?: string | null;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  metadata?: Record<string, any>;
  sendEmail?: boolean;
  emailTemplateKey?: string;
  emailVariables?: Record<string, any>;
}

export async function createNotification(data: NotificationData): Promise<void> {
  try {
    // Get user preferences
    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId: data.userId },
    });

    const emailEnabled = preferences?.emailEnabled ?? true;
    const inAppEnabled = preferences?.inAppEnabled ?? true;

    // Create in-app notification
    if (inAppEnabled) {
      await prisma.notification.create({
        data: {
          userId: data.userId,
          organizationId: data.organizationId || null,
          type: data.type,
          title: data.title,
          message: data.message,
          metadata: data.metadata || {},
          emailSent: false,
        },
      });
    }

    // Send email notification if enabled and requested
    if (emailEnabled && data.sendEmail) {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { email: true, name: true },
      });

      if (user) {
        try {
          if (data.emailTemplateKey) {
            // Use template
            await sendTemplateEmail({
              to: user.email,
              templateKey: data.emailTemplateKey,
              variables: {
                user: { name: user.name || user.email, email: user.email },
                notification: {
                  title: data.title,
                  message: data.message,
                  type: data.type,
                },
                ...data.emailVariables,
              },
              organizationId: data.organizationId,
            });
          } else {
            // Use simple email
            await sendTemplateEmail({
              to: user.email,
              templateKey: "notification",
              variables: {
                user: { name: user.name || user.email, email: user.email },
                notification: {
                  title: data.title,
                  message: data.message,
                  type: data.type,
                },
                ...data.emailVariables,
              },
              organizationId: data.organizationId,
            });
          }

          // Update notification if in-app was created
          if (inAppEnabled) {
            await prisma.notification.updateMany({
              where: {
                userId: data.userId,
                organizationId: data.organizationId || null,
                title: data.title,
                createdAt: {
                  gte: new Date(Date.now() - 5000), // Within last 5 seconds
                },
              },
              data: { emailSent: true },
            });
          }
        } catch (error) {
          console.error("Failed to send notification email:", error);
          // Don't fail notification creation if email fails
        }
      }
    }
  } catch (error) {
    console.error("Failed to create notification:", error);
    // Don't throw - notifications are non-critical
  }
}

// Notification hooks for common events
export async function notifyUserRegistered(userId: string, email: string, name?: string): Promise<void> {
  await createNotification({
    userId,
    type: "success",
    title: "Welcome!",
    message: "Your account has been created successfully.",
    sendEmail: true,
    emailTemplateKey: "welcome",
    emailVariables: {
      user: { name: name || email, email },
      app: { name: "SaaS Kit" },
      verificationLink: `${process.env.NEXT_PUBLIC_APP_URL}/verify-email`,
    },
  });
}

export async function notifyPasswordReset(userId: string, resetLink: string): Promise<void> {
  await createNotification({
    userId,
    type: "info",
    title: "Password Reset Requested",
    message: "A password reset link has been sent to your email.",
    sendEmail: true,
    emailTemplateKey: "reset-password",
    emailVariables: {
      resetLink,
    },
  });
}

export async function notifySubscriptionActivated(
  userId: string,
  organizationId: string | null,
  planName: string
): Promise<void> {
  await createNotification({
    userId,
    organizationId,
    type: "success",
    title: "Subscription Activated",
    message: `Your subscription to ${planName} has been activated!`,
    sendEmail: true,
    emailTemplateKey: "subscription-activated",
    emailVariables: {
      plan: { name: planName },
    },
  });
}

export async function notifyInvoicePaid(
  userId: string,
  organizationId: string | null,
  invoiceId: string,
  amount: number,
  currency: string
): Promise<void> {
  await createNotification({
    userId,
    organizationId,
    type: "success",
    title: "Invoice Paid",
    message: `Invoice #${invoiceId} for ${amount} ${currency} has been paid.`,
    sendEmail: true,
    emailTemplateKey: "invoice-paid",
    emailVariables: {
      invoice: { id: invoiceId, amount, currency },
    },
  });
}

// Broadcast notification to organization
export async function broadcastToOrganization(
  organizationId: string,
  notification: Omit<NotificationData, "userId" | "organizationId">
): Promise<void> {
  const members = await prisma.organizationMember.findMany({
    where: { organizationId },
    select: { userId: true },
  });

  await Promise.all(
    members.map((member) =>
      createNotification({
        ...notification,
        userId: member.userId,
        organizationId,
      })
    )
  );
}

