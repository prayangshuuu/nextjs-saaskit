import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiHandler } from "@/lib/api-guards";
import { OrganizationRoleType } from "@prisma/client";
import { setTenantContext } from "@/lib/tenant";

const createOrganizationSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);
  const body = await request.json();
  const { name, slug } = createOrganizationSchema.parse(body);

  // Check if slug is already taken
  const existing = await prisma.organization.findUnique({
    where: { slug },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Organization slug already exists" },
      { status: 400 }
    );
  }

  // Create organization and assign creator as OWNER
  const organization = await prisma.organization.create({
    data: {
      name,
      slug,
      ownerId: user.userId,
      members: {
        create: {
          userId: user.userId,
          role: OrganizationRoleType.OWNER,
        },
      },
    },
    include: {
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
      },
    },
  });

  return NextResponse.json({ organization }, { status: 201 });
  },
  {
    action: "organization.created",
    entity: "Organization",
  }
);

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);

  // Get all organizations user is a member of
  const memberships = await prisma.organizationMember.findMany({
    where: {
      userId: user.userId,
    },
    include: {
      organization: {
        include: {
          _count: {
            select: {
              members: true,
            },
          },
        },
      },
    },
    orderBy: {
      joinedAt: "desc",
    },
  });

  const organizations = memberships.map((membership) => ({
    id: membership.organization.id,
    name: membership.organization.name,
    slug: membership.organization.slug,
    role: membership.role,
    memberCount: membership.organization._count.members,
    createdAt: membership.organization.createdAt,
    joinedAt: membership.joinedAt,
  }));

  return NextResponse.json({ organizations });
});

