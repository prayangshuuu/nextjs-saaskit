import { PaymentProviderType } from "@prisma/client";
import { IPaymentProvider } from "./base";
import { BKashProvider } from "./bkash";
import { SSLCommerzProvider } from "./sslcommerz";
import { PipraPayProvider } from "./piprapay";

export function getPaymentProvider(
  type: PaymentProviderType
): IPaymentProvider {
  switch (type) {
    case "BKASH":
      return new BKashProvider();
    case "SSLCOMMERZ":
      return new SSLCommerzProvider();
    case "PIPRAPAY":
      return new PipraPayProvider();
    default:
      throw new Error(`Unsupported payment provider: ${type}`);
  }
}

export * from "./base";
export { BKashProvider } from "./bkash";
export { SSLCommerzProvider } from "./sslcommerz";
export { PipraPayProvider } from "./piprapay";

