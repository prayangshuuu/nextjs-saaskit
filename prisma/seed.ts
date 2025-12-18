// Load environment variables first
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set. Please check your .env file.");
}

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

// Create PostgreSQL connection pool
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Create PrismaClient instance with adapter
const prisma = new PrismaClient({ adapter });

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

const RoleName = {
  ADMIN: "ADMIN",
  USER: "USER",
};

async function main() {
  console.log("🌱 Starting seed...");
  console.log(`📦 Database URL: ${process.env.DATABASE_URL ? "✅ Set" : "❌ Missing"}`);

  // Test database connection
  try {
    await prisma.$connect();
    console.log("✅ Database connection successful");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    throw error;
  }

  // Get or create ADMIN role
  console.log("Checking ADMIN role...");
  let adminRole = await prisma.role.findUnique({
    where: { name: RoleName.ADMIN },
  });

  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        name: RoleName.ADMIN,
        description: "Administrator with full system access",
      },
    });
    console.log("✅ ADMIN role created");
  } else {
    console.log("✅ ADMIN role exists");
  }

  // Get or create USER role
  console.log("Checking USER role...");
  let userRole = await prisma.role.findUnique({
    where: { name: RoleName.USER },
  });

  if (!userRole) {
    userRole = await prisma.role.create({
      data: {
        name: RoleName.USER,
        description: "Standard user with limited access",
      },
    });
    console.log("✅ USER role created");
  } else {
    console.log("✅ USER role exists");
  }

  // Create Admin User
  console.log("Creating admin user...");
  const adminPassword = await hashPassword("Kit321!SaaS");
  
  const admin = await prisma.user.upsert({
    where: { email: "admin@prayangshu.com" },
    update: {
      password: adminPassword,
      name: "Admin User",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      roleId: adminRole.id,
    },
    create: {
      email: "admin@prayangshu.com",
      password: adminPassword,
      name: "Admin User",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      roleId: adminRole.id,
    },
  });

  console.log("✅ Admin user created/updated");

  // Create Regular User
  console.log("Creating regular user...");
  const userPassword = await hashPassword("Kit321!SaaS");
  
  const user = await prisma.user.upsert({
    where: { email: "user@prayangshu.com" },
    update: {
      password: userPassword,
      name: "Regular User",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      roleId: userRole.id,
    },
    create: {
      email: "user@prayangshu.com",
      password: userPassword,
      name: "Regular User",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      roleId: userRole.id,
    },
  });

  console.log("✅ Regular user created/updated");

  // Create default system modules
  console.log("Creating system modules...");
  const defaultModules = [
    { key: "landing", enabled: true, description: "Landing page", scope: "GLOBAL" },
    { key: "pricing", enabled: true, description: "Pricing page and plans", scope: "GLOBAL" },
    { key: "billing", enabled: true, description: "Billing and subscriptions", scope: "GLOBAL" },
    { key: "auth", enabled: true, description: "Authentication (login, register, 2FA)", scope: "AUTH" },
    { key: "rest_api", enabled: true, description: "REST API access", scope: "PUBLIC" },
    { key: "api_docs", enabled: true, description: "API documentation", scope: "PUBLIC" },
    { key: "dashboard", enabled: true, description: "User dashboard", scope: "AUTH" },
    { key: "admin", enabled: true, description: "Admin dashboard", scope: "ADMIN" },
    { key: "file_uploads", enabled: true, description: "File upload functionality", scope: "GLOBAL" },
    { key: "notifications", enabled: true, description: "Notification system", scope: "GLOBAL" },
  ];

  for (const module of defaultModules) {
    await prisma.systemModule.upsert({
      where: {
        organizationId_key: {
          organizationId: null,
          key: module.key,
        },
      },
      update: {
        enabled: module.enabled,
        description: module.description,
        scope: module.scope,
      },
      create: {
        key: module.key,
        enabled: module.enabled,
        description: module.description,
        scope: module.scope,
        organizationId: null, // Global modules
      },
    });
  }
  console.log("✅ System modules created");

  console.log("\n📋 Seed Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Admin User:");
  console.log("  Email: admin@prayangshu.com");
  console.log("  Password: Kit321!SaaS");
  console.log("  Role: ADMIN");
  console.log("  Permissions: All permissions");
  console.log("\nRegular User:");
  console.log("  Email: user@prayangshu.com");
  console.log("  Password: Kit321!SaaS");
  console.log("  Role: USER");
  console.log("  Permissions: Basic read permissions");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
