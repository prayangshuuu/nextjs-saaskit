import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-guards";
import { requireOrganizationAccess, requireOrganizationOwner } from "@/lib/organization-guards";
import { OrganizationRoleType } from "@prisma/client";

const updateOrganizationSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  metadata: z.record(z.any()).optional(),
});

export const GET = apiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await requireOrganizationAccess(request, id);

  const organization = await prisma.organization.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: {
          joinedAt: "asc",
        },
      },
      _count: {
        select: {
          members: true,
          subscriptions: true,
        },
      },
    },
  });

  if (!organization) {
    return NextResponse.json(
      { error: "Organization not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ organization });
});

export const PUT = apiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  // Require ADMIN or OWNER role
  await requireOrganizationAccess(request, id, OrganizationRoleType.ADMIN);

  const body = await request.json();
  const data = updateOrganizationSchema.parse(body);

  // Check slug uniqueness if updating
  if (data.slug) {
    const existing = await prisma.organization.findFirst({
      where: {
        slug: data.slug,
        id: { not: id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Organization slug already exists" },
        { status: 400 }
      );
    }
  }

  const organization = await prisma.organization.update({
    where: { id },
    data,
  });

  return NextResponse.json({ organization });
});

export const DELETE = apiHandler(
  async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  // Only OWNER can delete organization
  await requireOrganizationOwner(request, id);

  await prisma.organization.delete({
    where: { id },
  });

  return NextResponse.json({ message: "Organization deleted successfully" });
  },
  {
    action: "organization.deleted",
    entity: "Organization",
  }
);

