import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiHandler } from "@/lib/api-guards";
import { getPaymentProvider } from "@/lib/payments";
import { env } from "@/lib/env";

const initiateSchema = z.object({
  planId: z.string(),
  provider: z.enum(["BKASH", "SSLCOMMERZ", "PIPRAPAY"]),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);
  const body = await request.json();
  const { planId, provider } = initiateSchema.parse(body);

  // Verify plan exists and is active
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
  });

  if (!plan || !plan.active) {
    return NextResponse.json(
      { error: "Plan not found or not available" },
      { status: 404 }
    );
  }

  // Verify provider is enabled
  const providerConfig = await prisma.paymentProvider.findUnique({
    where: { type: provider },
  });

  if (!providerConfig || !providerConfig.enabled) {
    return NextResponse.json(
      { error: "Payment provider is not enabled" },
      { status: 400 }
    );
  }

  // Check for existing active subscription
  const existingSubscription = await prisma.subscription.findFirst({
    where: {
      userId: user.userId,
      status: {
        in: ["ACTIVE", "PENDING"],
      },
    },
  });

  if (existingSubscription) {
    return NextResponse.json(
      { error: "You already have an active or pending subscription" },
      { status: 400 }
    );
  }

  // Create subscription with PENDING status
  const subscription = await prisma.subscription.create({
    data: {
      userId: user.userId,
      planId: plan.id,
      status: "PENDING",
      providerType: provider,
    },
  });

  // Get payment provider and initiate payment
  const paymentProvider = getPaymentProvider(provider);
  const result = await paymentProvider.initiatePayment({
    subscriptionId: subscription.id,
    planId: plan.id,
    userId: user.userId,
    amount: plan.price.toNumber(),
    currency: "USD",
    returnUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard/subscriptions?success=true`,
    cancelUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard/subscriptions?canceled=true`,
  });

  if (!result.success) {
    // Clean up subscription if payment initiation fails
    await prisma.subscription.delete({
      where: { id: subscription.id },
    });
    return NextResponse.json(
      { error: result.error || "Failed to initiate payment" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    paymentId: result.paymentId,
    redirectUrl: result.redirectUrl,
  });
});

