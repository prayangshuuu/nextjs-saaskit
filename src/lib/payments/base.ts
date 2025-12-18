import { PaymentProviderType } from "@prisma/client";

export interface PaymentInitiationRequest {
  subscriptionId: string;
  planId: string;
  userId: string;
  amount: number;
  currency: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface PaymentInitiationResponse {
  success: boolean;
  paymentId?: string;
  redirectUrl?: string;
  error?: string;
}

export interface PaymentCallbackData {
  paymentId: string;
  status: "success" | "failed" | "pending";
  transactionId?: string;
  amount?: number;
  metadata?: Record<string, any>;
}

export interface IPaymentProvider {
  type: PaymentProviderType;
  initiatePayment(request: PaymentInitiationRequest): Promise<PaymentInitiationResponse>;
  verifyCallback(data: PaymentCallbackData): Promise<boolean>;
  getProviderConfig(): Promise<any>;
}

