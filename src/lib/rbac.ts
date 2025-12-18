import { prisma } from "./prisma";

export enum RoleName {
  ADMIN = "ADMIN",
  USER = "USER",
}

export enum PermissionResource {
  USERS = "USERS",
  SETTINGS = "SETTINGS",
  BILLING = "BILLING",
  CRUD = "CRUD",
}

export enum PermissionAction {
  CREATE = "CREATE",
  READ = "READ",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  MANAGE = "MANAGE",
}

export interface PermissionCheck {
  resource: PermissionResource;
  action: PermissionAction;
}

// Check if user has a specific permission
export async function hasPermission(
  userId: string,
  resource: PermissionResource,
  action: PermissionAction
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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
  });

  if (!user) return false;

  // Admin has all permissions
  if (user.role.name === RoleName.ADMIN) return true;

  // Check if user's role has the required permission
  return user.role.permissions.some(
    (rp) =>
      rp.permission.resource === resource && rp.permission.action === action
  );
}

// Check if user has any of the required permissions
export async function hasAnyPermission(
  userId: string,
  checks: PermissionCheck[]
): Promise<boolean> {
  for (const check of checks) {
    if (await hasPermission(userId, check.resource, check.action)) {
      return true;
    }
  }
  return false;
}

// Check if user has all required permissions
export async function hasAllPermissions(
  userId: string,
  checks: PermissionCheck[]
): Promise<boolean> {
  for (const check of checks) {
    if (!(await hasPermission(userId, check.resource, check.action))) {
      return false;
    }
  }
  return true;
}

// Check if user has a specific role
export async function hasRole(userId: string, roleName: RoleName): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  return user?.role.name === roleName;
}

// Check if user is admin
export async function isAdmin(userId: string): Promise<boolean> {
  return hasRole(userId, RoleName.ADMIN);
}

