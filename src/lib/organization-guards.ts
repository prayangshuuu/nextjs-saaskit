import { NextRequest } from "next/server";
import { prisma } from "./prisma";
import { requireAuth } from "./api-guards";
import { OrganizationRoleType } from "@prisma/client";

export async function requireOrganizationAccess(
  request: NextRequest,
  organizationId: string,
  requiredRole?: OrganizationRoleType
): Promise<{ userId: string; organizationId: string; role: OrganizationRoleType }> {
  const user = await requireAuth(request);

  const member = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId: user.userId,
      },
    },
  });

  if (!member) {
    throw new Error("Forbidden: Not a member of this organization");
  }

  // Check role requirements
  if (requiredRole) {
    const roleHierarchy: Record<OrganizationRoleType, number> = {
      OWNER: 3,
      ADMIN: 2,
      MEMBER: 1,
    };

    if (roleHierarchy[member.role] < roleHierarchy[requiredRole]) {
      throw new Error(`Forbidden: ${requiredRole} role required`);
    }
  }

  return {
    userId: user.userId,
    organizationId,
    role: member.role,
  };
}

export async function requireOrganizationOwner(
  request: NextRequest,
  organizationId: string
): Promise<void> {
  await requireOrganizationAccess(request, organizationId, OrganizationRoleType.OWNER);
}

export async function requireOrganizationAdmin(
  request: NextRequest,
  organizationId: string
): Promise<void> {
  await requireOrganizationAccess(request, organizationId, OrganizationRoleType.ADMIN);
}

