import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, apiHandler } from "@/lib/api-guards";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createRoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export const GET = apiHandler(async (request: NextRequest) => {
  await requireAdmin(request);

  const roles = await prisma.role.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          users: true,
          permissions: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ roles });
});

export const POST = apiHandler(async (request: NextRequest) => {
  await requireAdmin(request);

  const body = await request.json();
  const data = createRoleSchema.parse(body);

  // Check if role already exists
  const existingRole = await prisma.role.findUnique({
    where: { name: data.name.toUpperCase() },
  });

  if (existingRole) {
    return NextResponse.json(
      { error: "Role with this name already exists" },
      { status: 400 }
    );
  }

  const role = await prisma.role.create({
    data: {
      name: data.name.toUpperCase(),
      description: data.description,
    },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ role }, { status: 201 });
});
