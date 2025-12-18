import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, apiHandler } from "@/lib/api-guards";

const updatePlanSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  interval: z.enum(["MONTHLY", "YEARLY"]).optional(),
  features: z.array(z.string()).optional(),
  active: z.boolean().optional(),
});

export const PUT = apiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  await requireAdmin(request);
  const { id } = await params;

  const body = await request.json();
  const data = updatePlanSchema.parse(body);

  const plan = await prisma.plan.update({
    where: { id },
    data,
  });

  return NextResponse.json({ plan });
});

export const DELETE = apiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  await requireAdmin(request);
  const { id } = await params;

  // Check if plan has active subscriptions
  const activeSubscriptions = await prisma.subscription.count({
    where: {
      planId: id,
      status: "ACTIVE",
    },
  });

  if (activeSubscriptions > 0) {
    return NextResponse.json(
      { error: "Cannot delete plan with active subscriptions" },
      { status: 400 }
    );
  }

  await prisma.plan.delete({
    where: { id },
  });

  return NextResponse.json({ message: "Plan deleted successfully" });
});

