import { prisma } from "../prisma";
import {
  IPaymentProvider,
  PaymentInitiationRequest,
  PaymentInitiationResponse,
  PaymentCallbackData,
} from "./base";

export class BKashProvider implements IPaymentProvider {
  type = "BKASH" as const;

  async getProviderConfig() {
    const provider = await prisma.paymentProvider.findUnique({
      where: { type: "BKASH" },
    });
    return provider;
  }

  async initiatePayment(
    request: PaymentInitiationRequest
  ): Promise<PaymentInitiationResponse> {
    const config = await this.getProviderConfig();

    if (!config || !config.enabled || !config.apiKey || !config.apiSecret) {
      return {
        success: false,
        error: "bKash is not configured",
      };
    }

    // TODO: Implement actual bKash API integration
    // This is a placeholder structure
    // In production, you would:
    // 1. Generate payment token using bKash API
    // 2. Create payment with bKash
    // 3. Return redirect URL

    const paymentId = `bkash_${Date.now()}_${request.subscriptionId}`;

    // Store payment intent in database for verification
    await prisma.subscription.update({
      where: { id: request.subscriptionId },
      data: {
        providerSubscriptionId: paymentId,
      },
    });

    // In production, this would be the actual bKash checkout URL
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payments/bkash/callback?paymentId=${paymentId}`;

    return {
      success: true,
      paymentId,
      redirectUrl,
    };
  }

  async verifyCallback(data: PaymentCallbackData): Promise<boolean> {
    const config = await this.getProviderConfig();

    if (!config || !config.apiKey || !config.apiSecret) {
      return false;
    }

    // TODO: Implement actual bKash callback verification
    // In production, you would:
    // 1. Verify payment status with bKash API
    // 2. Verify transaction signature
    // 3. Check amount matches

    // Placeholder: verify paymentId exists
    const subscription = await prisma.subscription.findFirst({
      where: {
        providerSubscriptionId: data.paymentId,
        providerType: "BKASH",
      },
    });

    return !!subscription;
  }
}

