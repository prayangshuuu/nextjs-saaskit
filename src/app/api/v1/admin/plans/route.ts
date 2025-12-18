import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, apiHandler } from "@/lib/api-guards";

const planSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  interval: z.enum(["MONTHLY", "YEARLY"]),
  features: z.array(z.string()).optional(),
  limits: z.record(z.number()).optional(), // e.g., { "api_requests": 10000, "active_users": 50 }
  active: z.boolean().optional().default(true),
});

export const GET = apiHandler(async (request: NextRequest) => {
  await requireAdmin(request);

  const plans = await prisma.plan.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ plans });
});

export const POST = apiHandler(async (request: NextRequest) => {
  await requireAdmin(request);

  const body = await request.json();
  const data = planSchema.parse(body);

  const plan = await prisma.plan.create({
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      interval: data.interval,
      features: data.features || [],
      limits: data.limits || {},
      active: data.active ?? true,
    },
  });

  return NextResponse.json({ plan }, { status: 201 });
});

