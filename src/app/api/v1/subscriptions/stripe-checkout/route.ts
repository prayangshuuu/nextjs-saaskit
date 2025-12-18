import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiHandler } from "@/lib/api-guards";
import { createStripeCheckoutSession } from "@/lib/stripe";
import { env } from "@/lib/env";

const checkoutSchema = z.object({
  planId: z.string(),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);
  const body = await request.json();
  const { planId } = checkoutSchema.parse(body);

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
      providerType: "STRIPE",
    },
  });

  // Create Stripe checkout session
  const successUrl = `${env.NEXT_PUBLIC_APP_URL}/dashboard/subscriptions?success=true`;
  const cancelUrl = `${env.NEXT_PUBLIC_APP_URL}/dashboard/subscriptions?canceled=true`;

  const session = await createStripeCheckoutSession(
    subscription.id,
    plan.id,
    user.userId,
    successUrl,
    cancelUrl
  );

  if (!session) {
    // Clean up subscription if Stripe session creation fails
    await prisma.subscription.delete({
      where: { id: subscription.id },
    });
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }

  // Update subscription with Stripe session ID
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      providerSubscriptionId: session.id,
    },
  });

  return NextResponse.json({
    sessionId: session.id,
    url: session.url,
  });
});

