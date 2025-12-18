import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, apiHandler } from "@/lib/api-guards";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updatePermissionsSchema = z.object({
  permissionIds: z.array(z.string()),
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

  // Get all available permissions
  const allPermissions = await prisma.permission.findMany({
    orderBy: [{ resource: "asc" }, { action: "asc" }],
  });

  return NextResponse.json({
    role,
    permissions: allPermissions,
  });
});

export const PUT = apiHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  await requireAdmin(request);

  const body = await request.json();
  const { permissionIds } = updatePermissionsSchema.parse(body);

  // Verify role exists
  const role = await prisma.role.findUnique({
    where: { id: params.id },
  });

  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

  // Prevent editing system roles (ADMIN always has all permissions)
  if (role.name === "ADMIN") {
    return NextResponse.json(
      { error: "Cannot modify permissions for ADMIN role" },
      { status: 400 }
    );
  }

  // Verify all permissions exist
  const permissions = await prisma.permission.findMany({
    where: { id: { in: permissionIds } },
  });

  if (permissions.length !== permissionIds.length) {
    return NextResponse.json(
      { error: "One or more permissions not found" },
      { status: 400 }
    );
  }

  // Replace all role permissions
  await prisma.$transaction([
    prisma.rolePermission.deleteMany({
      where: { roleId: params.id },
    }),
    ...permissionIds.map((permissionId) =>
      prisma.rolePermission.create({
        data: {
          roleId: params.id,
          permissionId,
        },
      })
    ),
  ]);

  const updatedRole = await prisma.role.findUnique({
    where: { id: params.id },
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

