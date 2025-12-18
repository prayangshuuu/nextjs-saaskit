import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    const stripe = await getStripeClient();
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 }
      );
    }

    // Get webhook secret from payment provider config
    const provider = await prisma.paymentProvider.findUnique({
      where: { type: "STRIPE" },
    });

    if (!provider || !provider.webhookSecret) {
      return NextResponse.json(
        { error: "Stripe webhook secret not configured" },
        { status: 500 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        provider.webhookSecret
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === "subscription" && session.subscription) {
          const subscriptionId = session.client_reference_id;
          
          if (subscriptionId) {
            await prisma.subscription.update({
              where: { id: subscriptionId },
              data: {
                status: "ACTIVE",
                providerSubscriptionId: session.subscription as string,
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(
                  Date.now() + 30 * 24 * 60 * 60 * 1000
                ), // 30 days default
              },
            });
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const metadata = subscription.metadata;

        if (metadata?.subscriptionId) {
          await prisma.subscription.update({
            where: { id: metadata.subscriptionId },
            data: {
              status: subscription.status === "active" ? "ACTIVE" : "PENDING",
              providerSubscriptionId: subscription.id,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
          });
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.subscription && invoice.metadata?.subscriptionId) {
          // Create invoice record
          await prisma.invoice.create({
            data: {
              userId: invoice.metadata.userId || "",
              subscriptionId: invoice.metadata.subscriptionId,
              amount: invoice.amount_paid / 100,
              currency: invoice.currency.toUpperCase(),
              status: "PAID",
              providerInvoiceId: invoice.id,
              providerType: "STRIPE",
              paidAt: new Date(),
              dueDate: invoice.due_date
                ? new Date(invoice.due_date * 1000)
                : null,
            },
          });

          // Update subscription status
          await prisma.subscription.update({
            where: { id: invoice.metadata.subscriptionId },
            data: {
              status: "ACTIVE",
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const metadata = subscription.metadata;

        if (metadata?.subscriptionId) {
          await prisma.subscription.update({
            where: { id: metadata.subscriptionId },
            data: {
              status: "CANCELED",
              canceledAt: new Date(),
            },
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

