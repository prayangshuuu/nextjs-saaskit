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

  // Create Payment Providers
  console.log("Creating payment providers...");
  const providerTypes = ["STRIPE", "BKASH", "SSLCOMMERZ", "PIPRAPAY"];

  for (const type of providerTypes) {
    await prisma.paymentProvider.upsert({
      where: { type },
      update: {},
      create: {
        type,
        enabled: false,
        testMode: true,
      },
    });
  }

  console.log("✅ Payment providers created");

  // Create default email templates
  console.log("Creating email templates...");
  const defaultTemplates = [
    {
      key: "welcome",
      subject: "Welcome to {{app.name}}!",
      htmlBody: `
        <h1>Welcome to {{app.name}}!</h1>
        <p>Hi {{user.name}},</p>
        <p>Thank you for signing up! We're excited to have you on board.</p>
        <p>Get started by verifying your email address.</p>
        <p><a href="{{verificationLink}}">Verify Email</a></p>
      `,
      textBody: `Welcome to {{app.name}}!\n\nHi {{user.name}},\n\nThank you for signing up! We're excited to have you on board.\n\nGet started by verifying your email address: {{verificationLink}}`,
    },
    {
      key: "reset-password",
      subject: "Reset your password",
      htmlBody: `
        <h1>Reset Your Password</h1>
        <p>Hi {{user.name}},</p>
        <p>You requested to reset your password. Click the link below to reset it:</p>
        <p><a href="{{resetLink}}">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
      textBody: `Reset Your Password\n\nHi {{user.name}},\n\nYou requested to reset your password. Click the link below to reset it:\n{{resetLink}}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.`,
    },
    {
      key: "invoice-paid",
      subject: "Invoice Paid - {{invoice.amount}}",
      htmlBody: `
        <h1>Invoice Paid</h1>
        <p>Hi {{user.name}},</p>
        <p>Your invoice #{{invoice.id}} for {{invoice.amount}} {{invoice.currency}} has been paid successfully.</p>
        <p>Thank you for your payment!</p>
      `,
      textBody: `Invoice Paid\n\nHi {{user.name}},\n\nYour invoice #{{invoice.id}} for {{invoice.amount}} {{invoice.currency}} has been paid successfully.\n\nThank you for your payment!`,
    },
    {
      key: "subscription-activated",
      subject: "Subscription Activated",
      htmlBody: `
        <h1>Subscription Activated</h1>
        <p>Hi {{user.name}},</p>
        <p>Your subscription to {{plan.name}} has been activated!</p>
        <p>You now have access to all features included in your plan.</p>
      `,
      textBody: `Subscription Activated\n\nHi {{user.name}},\n\nYour subscription to {{plan.name}} has been activated!\n\nYou now have access to all features included in your plan.`,
    },
  ];

  for (const template of defaultTemplates) {
    await prisma.emailTemplate.upsert({
      where: {
        organizationId_key: {
          organizationId: null,
          key: template.key,
        },
      },
      update: {},
      create: {
        key: template.key,
        subject: template.subject,
        htmlBody: template.htmlBody.trim(),
        textBody: template.textBody.trim(),
        enabled: true,
        organizationId: null, // Global templates
      },
    });
  }
  console.log("✅ Email templates created");

  // Create default branding settings
  console.log("Creating branding settings...");
  const brandingSettings = [
    {
      key: "app.name",
      value: "SaaS Kit",
      type: "string",
      description: "Application name",
    },
    {
      key: "app.logo",
      value: "",
      type: "string",
      description: "Application logo URL",
    },
    {
      key: "app.favicon",
      value: "",
      type: "string",
      description: "Application favicon URL",
    },
    {
      key: "brand.primaryColor",
      value: "#3b82f6",
      type: "string",
      description: "Primary brand color",
    },
    {
      key: "brand.secondaryColor",
      value: "#8b5cf6",
      type: "string",
      description: "Secondary brand color",
    },
    {
      key: "brand.radius",
      value: "0.5rem",
      type: "string",
      description: "Border radius for UI elements",
    },
    {
      key: "brand.font",
      value: "Inter",
      type: "string",
      description: "Primary font family",
    },
    {
      key: "whiteLabel.hidePoweredBy",
      value: false,
      type: "boolean",
      description: "Hide 'Powered by' footer",
    },
    {
      key: "whiteLabel.footerText",
      value: "",
      type: "string",
      description: "Custom footer text",
    },
  ];

  for (const setting of brandingSettings) {
    await prisma.systemSetting.upsert({
      where: {
        organizationId_key: {
          organizationId: null,
          key: setting.key,
        },
      },
      update: {},
      create: {
        key: setting.key,
        value: setting.value,
        type: setting.type,
        isSecret: false,
        organizationId: null,
        description: setting.description,
      },
    });
  }
  console.log("✅ Branding settings created");

  console.log("\n📋 Seed Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Admin User:");
  console.log("  Email: admin@prayangshu.com");
  console.log("  Password: Kit321!SaaS");
  console.log("\nRegular User:");
  console.log("  Email: user@prayangshu.com");
  console.log("  Password: Kit321!SaaS");
  console.log("\nPayment Providers:");
  console.log("  STRIPE, BKASH, SSLCOMMERZ, PIPRAPAY");
  console.log("  (Configure via admin dashboard)");
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
