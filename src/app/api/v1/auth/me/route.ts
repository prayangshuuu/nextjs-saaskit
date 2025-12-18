import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiHandler } from "@/lib/api-guards";

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);

  const userData = await prisma.user.findUnique({
    where: { id: user.userId },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      createdAt: true,
      role: {
        select: {
          id: true,
          name: true,
          permissions: {
            select: {
              permission: {
                select: {
                  id: true,
                  name: true,
                  resource: true,
                  action: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!userData) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user: userData });
});

