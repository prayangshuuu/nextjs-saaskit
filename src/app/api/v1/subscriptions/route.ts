import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiHandler } from "@/lib/api-guards";

const subscribeSchema = z.object({
  planId: z.string(),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);
  const body = await request.json();
  const { planId } = subscribeSchema.parse(body);

  // Verify plan exists and is active
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    return NextResponse.json(
      { error: "Plan not found" },
      { status: 404 }
    );
  }

  if (!plan.active) {
    return NextResponse.json(
      { error: "Plan is not available" },
      { status: 400 }
    );
  }

  // Check for existing active subscription
  const existingSubscription = await prisma.subscription.findFirst({
    where: {
      userId: user.userId,
      status: {
        in: ["ACTIVE", "PENDING"],
      },
    },
  });

  if (existingSubscription) {
    return NextResponse.json(
      { error: "You already have an active or pending subscription" },
      { status: 400 }
    );
  }

  // Create subscription with PENDING status
  const subscription = await prisma.subscription.create({
    data: {
      userId: user.userId,
      planId: plan.id,
      status: "PENDING",
    },
    include: {
      plan: {
        select: {
          id: true,
          name: true,
          price: true,
          interval: true,
        },
      },
    },
  });

  return NextResponse.json(
    { subscription },
    { status: 201 }
  );
});

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);

  const subscriptions = await prisma.subscription.findMany({
    where: {
      userId: user.userId,
    },
    include: {
      plan: {
        select: {
          id: true,
          name: true,
          price: true,
          interval: true,
          features: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ subscriptions });
});

