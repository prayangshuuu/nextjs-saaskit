import Stripe from "stripe";
import { prisma } from "./prisma";

let stripeInstance: Stripe | null = null;

export async function getStripeClient(): Promise<Stripe | null> {
  if (stripeInstance) {
    return stripeInstance;
  }

  const provider = await prisma.paymentProvider.findUnique({
    where: { type: "STRIPE" },
  });

  if (!provider || !provider.enabled || !provider.apiKey) {
    return null;
  }

  stripeInstance = new Stripe(provider.apiKey, {
    apiVersion: "2024-12-18.acacia",
  });

  return stripeInstance;
}

export async function createStripeCheckoutSession(
  subscriptionId: string,
  planId: string,
  userId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session | null> {
  const stripe = await getStripeClient();
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  const plan = await prisma.plan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw new Error("Plan not found");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: plan.name,
            description: plan.description || undefined,
          },
          unit_amount: Math.round(plan.price.toNumber() * 100),
          recurring: {
            interval: plan.interval.toLowerCase() as "month" | "year",
          },
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: subscriptionId,
    metadata: {
      userId,
      planId,
      subscriptionId,
    },
  });

  return session;
}

