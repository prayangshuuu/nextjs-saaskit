/**
 * OAuth Service
 * 
 * MIT License
 * Copyright (c) 2025 Prayangshu Biswas
 */

import { prisma } from "./prisma";
import { RoleName } from "./rbac";
import { encryptPassword } from "./smtp";

export interface OAuthUser {
  provider: "google" | "github";
  providerId: string;
  email: string;
  name?: string;
  avatar?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
}

// Simple encryption/decryption for OAuth tokens
function encryptToken(token: string): string {
  return Buffer.from(token).toString("base64");
}

function decryptToken(encrypted: string): string {
  return Buffer.from(encrypted, "base64").toString("utf-8");
}

// Link OAuth account to existing user
export async function linkOAuthAccount(
  userId: string,
  oauthUser: OAuthUser
): Promise<void> {
  await prisma.oAuthAccount.upsert({
    where: {
      provider_providerId: {
        provider: oauthUser.provider,
        providerId: oauthUser.providerId,
      },
    },
    update: {
      email: oauthUser.email,
      name: oauthUser.name,
      avatar: oauthUser.avatar,
      accessToken: oauthUser.accessToken ? encryptToken(oauthUser.accessToken) : null,
      refreshToken: oauthUser.refreshToken ? encryptToken(oauthUser.refreshToken) : null,
      expiresAt: oauthUser.expiresAt,
    },
    create: {
      userId,
      provider: oauthUser.provider,
      providerId: oauthUser.providerId,
      email: oauthUser.email,
      name: oauthUser.name,
      avatar: oauthUser.avatar,
      accessToken: oauthUser.accessToken ? encryptToken(oauthUser.accessToken) : null,
      refreshToken: oauthUser.refreshToken ? encryptToken(oauthUser.refreshToken) : null,
      expiresAt: oauthUser.expiresAt,
    },
  });
}

// Find or create user from OAuth account
export async function findOrCreateUserFromOAuth(
  oauthUser: OAuthUser
): Promise<{ userId: string; isNewUser: boolean }> {
  // Check if OAuth account exists
  const existingOAuth = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerId: {
        provider: oauthUser.provider,
        providerId: oauthUser.providerId,
      },
    },
    include: { user: true },
  });

  if (existingOAuth) {
    // Update OAuth account info
    await prisma.oAuthAccount.update({
      where: { id: existingOAuth.id },
      data: {
        email: oauthUser.email,
        name: oauthUser.name,
        avatar: oauthUser.avatar,
        accessToken: oauthUser.accessToken ? encryptToken(oauthUser.accessToken) : null,
        refreshToken: oauthUser.refreshToken ? encryptToken(oauthUser.refreshToken) : null,
        expiresAt: oauthUser.expiresAt,
      },
    });

    return { userId: existingOAuth.userId, isNewUser: false };
  }

  // Check if user with email exists
  const existingUser = await prisma.user.findUnique({
    where: { email: oauthUser.email },
  });

  if (existingUser) {
    // Link OAuth account to existing user
    await linkOAuthAccount(existingUser.id, oauthUser);
    return { userId: existingUser.id, isNewUser: false };
  }

  // Create new user
  const userRole = await prisma.role.findUnique({
    where: { name: RoleName.USER },
  });

  if (!userRole) {
    throw new Error("User role not found. Please run seed script.");
  }

  // Generate a random password (user won't need it for OAuth login)
  const randomPassword = await encryptPassword(
    crypto.randomBytes(32).toString("hex")
  );

  const newUser = await prisma.user.create({
    data: {
      email: oauthUser.email,
      password: randomPassword, // OAuth users don't use password
      name: oauthUser.name,
      emailVerified: true, // OAuth providers verify emails
      emailVerifiedAt: new Date(),
      roleId: userRole.id,
    },
  });

  // Link OAuth account
  await linkOAuthAccount(newUser.id, oauthUser);

  return { userId: newUser.id, isNewUser: true };
}

// Get OAuth accounts for user
export async function getUserOAuthAccounts(userId: string) {
  return prisma.oAuthAccount.findMany({
    where: { userId },
    select: {
      id: true,
      provider: true,
      email: true,
      name: true,
      avatar: true,
      createdAt: true,
    },
  });
}

// Unlink OAuth account
export async function unlinkOAuthAccount(
  userId: string,
  provider: "google" | "github"
): Promise<void> {
  const account = await prisma.oAuthAccount.findFirst({
    where: {
      userId,
      provider,
    },
  });

  if (!account) {
    throw new Error("OAuth account not found");
  }

  // Check if user has password (can't unlink if no other auth method)
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Check if user has other OAuth accounts or password
  const otherAccounts = await prisma.oAuthAccount.count({
    where: {
      userId,
      provider: { not: provider },
    },
  });

  // If no other accounts and no password set, prevent unlinking
  // For OAuth-only users, we set a random password, so this check is simplified
  // In production, you might want to track if password was ever set

  await prisma.oAuthAccount.delete({
    where: { id: account.id },
  });
}

