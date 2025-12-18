import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, apiHandler } from "@/lib/api-guards";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
  roleId: z.string(),
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional(),
  roleId: z.string().optional(),
  emailVerified: z.boolean().optional(),
});

export const GET = apiHandler(async (request: NextRequest) => {
  await requireAdmin(request);

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const skip = (page - 1) * limit;

  const where: any = {};
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

export const POST = apiHandler(async (request: NextRequest) => {
  await requireAdmin(request);

  const body = await request.json();
  const data = createUserSchema.parse(body);

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "User with this email already exists" },
      { status: 400 }
    );
  }

  // Verify role exists
  const role = await prisma.role.findUnique({
    where: { id: data.roleId },
  });

  if (!role) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      roleId: data.roleId,
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
        },
      },
    },
  });

  return NextResponse.json({ user }, { status: 201 });
});

