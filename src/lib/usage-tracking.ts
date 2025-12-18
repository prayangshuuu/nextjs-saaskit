import { prisma } from "./prisma";
import { Decimal } from "@prisma/client/runtime/library";

export type UsageMetric = 
  | "api_requests"
  | "active_users"
  | "feature_usage"
  | "storage_bytes"
  | "compute_seconds";

export interface UsageTrackingOptions {
  organizationId: string;
  metric: UsageMetric;
  value: number;
  metadata?: Record<string, any>;
  periodStart?: Date;
  periodEnd?: Date;
}

export async function trackUsage(options: UsageTrackingOptions): Promise<void> {
  const { organizationId, metric, value, metadata, periodStart, periodEnd } = options;

  // Default to current billing period (monthly)
  const now = new Date();
  const start = periodStart || new Date(now.getFullYear(), now.getMonth(), 1);
  const end = periodEnd || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Upsert usage record (increment if exists)
  await prisma.usageRecord.upsert({
    where: {
      organizationId_metric_periodStart: {
        organizationId,
        metric,
        periodStart: start,
      },
    },
    update: {
      value: {
        increment: new Decimal(value),
      },
      metadata: metadata || undefined,
    },
    create: {
      organizationId,
      metric,
      value: new Decimal(value),
      metadata: metadata || undefined,
      periodStart: start,
      periodEnd: end,
    },
  });
}

export async function getUsage(
  organizationId: string,
  metric: UsageMetric,
  periodStart?: Date,
  periodEnd?: Date
): Promise<number> {
  const now = new Date();
  const start = periodStart || new Date(now.getFullYear(), now.getMonth(), 1);
  const end = periodEnd || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const record = await prisma.usageRecord.findUnique({
    where: {
      organizationId_metric_periodStart: {
        organizationId,
        metric,
        periodStart: start,
      },
    },
  });

  return record ? record.value.toNumber() : 0;
}

export async function getAllUsage(
  organizationId: string,
  periodStart?: Date,
  periodEnd?: Date
): Promise<Record<string, number>> {
  const now = new Date();
  const start = periodStart || new Date(now.getFullYear(), now.getMonth(), 1);
  const end = periodEnd || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const records = await prisma.usageRecord.findMany({
    where: {
      organizationId,
      periodStart: start,
      periodEnd: end,
    },
  });

  const usage: Record<string, number> = {};
  for (const record of records) {
    usage[record.metric] = record.value.toNumber();
  }

  return usage;
}

