import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/lib/payments";
import { apiHandler } from "@/lib/api-guards";

export const POST = apiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) => {
  const { provider } = await params;
  const body = await request.json();

  const providerType = provider.toUpperCase() as "BKASH" | "SSLCOMMERZ" | "PIPRAPAY";

  if (!["BKASH", "SSLCOMMERZ", "PIPRAPAY"].includes(providerType)) {
    return NextResponse.json(
      { error: "Invalid payment provider" },
      { status: 400 }
    );
  }

  const paymentProvider = getPaymentProvider(providerType);
  
  // Extract payment data from callback
  const callbackData = {
    paymentId: body.paymentId || body.transaction_id || body.payment_id,
    status: body.status || (body.success ? "success" : "failed"),
    transactionId: body.transactionId || body.transaction_id,
    amount: body.amount,
    metadata: body,
  };

  // Verify callback
  const isValid = await paymentProvider.verifyCallback(callbackData);

  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid callback signature" },
      { status: 400 }
    );
  }

  // Find subscription by payment ID
  const subscription = await prisma.subscription.findFirst({
    where: {
      providerSubscriptionId: callbackData.paymentId,
      providerType: providerType,
    },
  });

  if (!subscription) {
    return NextResponse.json(
      { error: "Subscription not found" },
      { status: 404 }
    );
  }

  // Update subscription status based on payment result
  if (callbackData.status === "success") {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ), // 30 days default
      },
    });

    // Create invoice
    const plan = await prisma.plan.findUnique({
      where: { id: subscription.planId },
    });

    if (plan) {
      await prisma.invoice.create({
        data: {
          userId: subscription.userId,
          subscriptionId: subscription.id,
          amount: plan.price,
          currency: "USD",
          status: "PAID",
          providerInvoiceId: callbackData.transactionId || callbackData.paymentId,
          providerType: providerType,
          paidAt: new Date(),
        },
      });
    }
  } else {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "PENDING",
      },
    });
  }

  return NextResponse.json({
    success: true,
    subscriptionId: subscription.id,
    status: callbackData.status,
  });
});

