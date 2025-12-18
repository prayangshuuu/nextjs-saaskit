import "dotenv/config";
const bcrypt = require("bcryptjs");

// Import PrismaClient directly from generated client
const { PrismaClient } = require("../node_modules/.prisma/client/client");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

const RoleName = {
  ADMIN: "ADMIN",
  USER: "USER",
};

const PermissionResource = {
  USERS: "USERS",
  SETTINGS: "SETTINGS",
  BILLING: "BILLING",
  CRUD: "CRUD",
};

const PermissionAction = {
  CREATE: "CREATE",
  READ: "READ",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  MANAGE: "MANAGE",
};

async function main() {
  console.log("🌱 Starting seed...");

  // Create Roles
  console.log("Creating roles...");
  const adminRole = await prisma.role.upsert({
    where: { name: RoleName.ADMIN },
    update: {},
    create: {
      name: RoleName.ADMIN,
      description: "Administrator with full system access",
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: RoleName.USER },
    update: {},
    create: {
      name: RoleName.USER,
      description: "Standard user with limited access",
    },
  });

  console.log("✅ Roles created");

  // Create Permissions
  console.log("Creating permissions...");
  const permissions = [
    // User management permissions
    { resource: PermissionResource.USERS, action: PermissionAction.CREATE },
    { resource: PermissionResource.USERS, action: PermissionAction.READ },
    { resource: PermissionResource.USERS, action: PermissionAction.UPDATE },
    { resource: PermissionResource.USERS, action: PermissionAction.DELETE },
    { resource: PermissionResource.USERS, action: PermissionAction.MANAGE },

    // Settings permissions
    { resource: PermissionResource.SETTINGS, action: PermissionAction.READ },
    { resource: PermissionResource.SETTINGS, action: PermissionAction.UPDATE },
    { resource: PermissionResource.SETTINGS, action: PermissionAction.MANAGE },

    // Billing permissions
    { resource: PermissionResource.BILLING, action: PermissionAction.READ },
    { resource: PermissionResource.BILLING, action: PermissionAction.UPDATE },
    { resource: PermissionResource.BILLING, action: PermissionAction.MANAGE },

    // CRUD permissions
    { resource: PermissionResource.CRUD, action: PermissionAction.CREATE },
    { resource: PermissionResource.CRUD, action: PermissionAction.READ },
    { resource: PermissionResource.CRUD, action: PermissionAction.UPDATE },
    { resource: PermissionResource.CRUD, action: PermissionAction.DELETE },
  ];

  const createdPermissions = [];
  for (const perm of permissions) {
    const permission = await prisma.permission.upsert({
      where: {
        name: `${perm.resource}_${perm.action}`,
      },
      update: {},
      create: {
        name: `${perm.resource}_${perm.action}`,
        description: `${perm.action} permission for ${perm.resource}`,
        resource: perm.resource,
        action: perm.action,
      },
    });
    createdPermissions.push(permission);
  }

  console.log("✅ Permissions created");

  // Assign all permissions to ADMIN role
  console.log("Assigning permissions to ADMIN role...");
  for (const permission of createdPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Assign basic permissions to USER role
  console.log("Assigning permissions to USER role...");
  const userPermissions = createdPermissions.filter(
    (p) =>
      (p.resource === PermissionResource.CRUD && p.action === PermissionAction.READ) ||
      (p.resource === PermissionResource.SETTINGS && p.action === PermissionAction.READ)
  );

  for (const permission of userPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: userRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: userRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log("✅ Permissions assigned");

  // Create Users
  console.log("Creating users...");
  const adminPassword = await hashPassword("Kit321!SaaS");
  const userPassword = await hashPassword("Kit321!SaaS");

  const admin = await prisma.user.upsert({
    where: { email: "admin@prayangshu.com" },
    update: {},
    create: {
      email: "admin@prayangshu.com",
      password: adminPassword,
      name: "Admin User",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      roleId: adminRole.id,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "user@prayangshu.com" },
    update: {},
    create: {
      email: "user@prayangshu.com",
      password: userPassword,
      name: "Regular User",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      roleId: userRole.id,
    },
  });

  console.log("✅ Users created");
  console.log("\n📋 Seed Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Admin User:");
  console.log("  Email: admin@prayangshu.com");
  console.log("  Password: Kit321!SaaS");
  console.log("\nRegular User:");
  console.log("  Email: user@prayangshu.com");
  console.log("  Password: Kit321!SaaS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
