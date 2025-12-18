import { prisma } from "../prisma";
import {
  IPaymentProvider,
  PaymentInitiationRequest,
  PaymentInitiationResponse,
  PaymentCallbackData,
} from "./base";

export class SSLCommerzProvider implements IPaymentProvider {
  type = "SSLCOMMERZ" as const;

  async getProviderConfig() {
    const provider = await prisma.paymentProvider.findUnique({
      where: { type: "SSLCOMMERZ" },
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
        error: "SSLCommerz is not configured",
      };
    }

    // TODO: Implement actual SSLCommerz API integration
    const paymentId = `sslcommerz_${Date.now()}_${request.subscriptionId}`;

    await prisma.subscription.update({
      where: { id: request.subscriptionId },
      data: {
        providerSubscriptionId: paymentId,
      },
    });

    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payments/sslcommerz/callback?paymentId=${paymentId}`;

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

    // TODO: Implement actual SSLCommerz callback verification
    const subscription = await prisma.subscription.findFirst({
      where: {
        providerSubscriptionId: data.paymentId,
        providerType: "SSLCOMMERZ",
      },
    });

    return !!subscription;
  }
}

