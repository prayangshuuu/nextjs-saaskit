import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, apiHandler } from "@/lib/api-guards";
import { prisma } from "@/lib/prisma";
import { getSmtpConfig, testSmtpConnection } from "@/lib/smtp";
import { isMaintenanceMode } from "@/lib/maintenance";
import { getStringSetting } from "@/lib/settings-service";

export const GET = apiHandler(async (request: NextRequest) => {
  await requireAdmin(request);

  const appVersion = await getStringSetting("app.version", process.env.npm_package_version || "0.1.0", null);

  const health: {
    app: {
      version: string;
      environment: string;
      nodeVersion: string;
    };
    database: {
      status: string;
      connected: boolean;
    };
    smtp: {
      status: string;
      configured: boolean;
      testResult?: { success: boolean; error?: string };
    };
    paymentProviders: {
      stripe: { enabled: boolean; configured: boolean };
      bkash: { enabled: boolean; configured: boolean };
      sslcommerz: { enabled: boolean; configured: boolean };
      piprapay: { enabled: boolean; configured: boolean };
    };
    maintenance: {
      enabled: boolean;
    };
  } = {
    app: {
      version: appVersion,
      environment: process.env.NODE_ENV || "development",
      nodeVersion: process.version,
    },
    database: {
      status: "unknown",
      connected: false,
    },
    smtp: {
      status: "unknown",
      configured: false,
    },
    paymentProviders: {
      stripe: { enabled: false, configured: false },
      bkash: { enabled: false, configured: false },
      sslcommerz: { enabled: false, configured: false },
      piprapay: { enabled: false, configured: false },
    },
    maintenance: {
      enabled: false,
    },
  };

  // Test database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.database = {
      status: "connected",
      connected: true,
    };
  } catch (error) {
    health.database = {
      status: error instanceof Error ? error.message : "disconnected",
      connected: false,
    };
  }

  // Check SMTP configuration
  try {
    const smtpConfig = await getSmtpConfig(null);
    if (smtpConfig) {
      health.smtp.configured = true;
      health.smtp.status = "configured";
      
      // Test SMTP connection
      const testResult = await testSmtpConnection(smtpConfig);
      health.smtp.testResult = testResult;
      health.smtp.status = testResult.success ? "connected" : "connection_failed";
    } else {
      health.smtp.status = "not_configured";
    }
  } catch (error) {
    health.smtp.status = error instanceof Error ? error.message : "error";
  }

  // Check payment providers
  try {
    const providers = await prisma.paymentProvider.findMany();
    for (const provider of providers) {
      const key = provider.type.toLowerCase() as keyof typeof health.paymentProviders;
      if (key in health.paymentProviders) {
        health.paymentProviders[key] = {
          enabled: provider.enabled,
          configured: !!(provider.apiKey && provider.apiSecret),
        };
      }
    }
  } catch (error) {
    console.error("Failed to check payment providers:", error);
  }

  // Check maintenance mode
  try {
    health.maintenance.enabled = await isMaintenanceMode(null);
  } catch (error) {
    console.error("Failed to check maintenance mode:", error);
  }

  return NextResponse.json({ health });
});

