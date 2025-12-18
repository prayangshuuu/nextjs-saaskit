import { prisma } from "../prisma";
import {
  IPaymentProvider,
  PaymentInitiationRequest,
  PaymentInitiationResponse,
  PaymentCallbackData,
} from "./base";

export class PipraPayProvider implements IPaymentProvider {
  type = "PIPRAPAY" as const;

  async getProviderConfig() {
    const provider = await prisma.paymentProvider.findUnique({
      where: { type: "PIPRAPAY" },
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
        error: "PipraPay is not configured",
      };
    }

    // TODO: Implement actual PipraPay API integration
    const paymentId = `piprapay_${Date.now()}_${request.subscriptionId}`;

    await prisma.subscription.update({
      where: { id: request.subscriptionId },
      data: {
        providerSubscriptionId: paymentId,
      },
    });

    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payments/piprapay/callback?paymentId=${paymentId}`;

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

    // TODO: Implement actual PipraPay callback verification
    const subscription = await prisma.subscription.findFirst({
      where: {
        providerSubscriptionId: data.paymentId,
        providerType: "PIPRAPAY",
      },
    });

    return !!subscription;
  }
}

