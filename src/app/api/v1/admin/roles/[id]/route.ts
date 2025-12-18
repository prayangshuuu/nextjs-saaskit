import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, apiHandler } from "@/lib/api-guards";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateRoleSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
});

export const GET = apiHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  await requireAdmin(request);

  const role = await prisma.role.findUnique({
    where: { id: params.id },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  });

  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

  return NextResponse.json({ role });
});

export const PUT = apiHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  await requireAdmin(request);

  const body = await request.json();
  const data = updateRoleSchema.parse(body);

  // Prevent editing system roles (ADMIN, USER)
  const role = await prisma.role.findUnique({
    where: { id: params.id },
  });

  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

  if (role.name === "ADMIN" || role.name === "USER") {
    return NextResponse.json(
      { error: "Cannot edit system roles" },
      { status: 400 }
    );
  }

  const updatedRole = await prisma.role.update({
    where: { id: params.id },
    data: {
      name: data.name,
      description: data.description,
    },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  });

  return NextResponse.json({ role: updatedRole });
});

export const DELETE = apiHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  await requireAdmin(request);

  const role = await prisma.role.findUnique({
    where: { id: params.id },
  });

  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

  // Prevent deleting system roles
  if (role.name === "ADMIN" || role.name === "USER") {
    return NextResponse.json(
      { error: "Cannot delete system roles" },
      { status: 400 }
    );
  }

  // Check if role is assigned to any users
  const userCount = await prisma.user.count({
    where: { roleId: params.id },
  });

  if (userCount > 0) {
    return NextResponse.json(
      { error: "Cannot delete role assigned to users" },
      { status: 400 }
    );
  }

  await prisma.role.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ message: "Role deleted successfully" });
});

