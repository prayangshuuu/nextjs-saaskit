import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-guards";
import { env } from "@/lib/env";
import { findOrCreateUserFromOAuth } from "@/lib/oauth";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import { createSession, createRefreshToken as createRefreshTokenRecord } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async (
  request: NextRequest,
  { params }: { params: { provider: string } }
) => {
  const provider = params.provider.toLowerCase();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${env.NEXT_PUBLIC_APP_URL}/login?error=oauth_cancelled`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${env.NEXT_PUBLIC_APP_URL}/login?error=oauth_failed`
    );
  }

  if (provider !== "google" && provider !== "github") {
    return NextResponse.redirect(
      `${env.NEXT_PUBLIC_APP_URL}/login?error=invalid_provider`
    );
  }

  try {
    let oauthUser;

    if (provider === "google") {
      oauthUser = await handleGoogleCallback(code);
    } else {
      oauthUser = await handleGitHubCallback(code);
    }

    // Find or create user
    const { userId, isNewUser } = await findOrCreateUserFromOAuth(oauthUser);

    // Get user with role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      return NextResponse.redirect(
        `${env.NEXT_PUBLIC_APP_URL}/login?error=user_creation_failed`
      );
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
    });

    // Create sessions
    await createSession(user.id, accessToken);
    await createRefreshTokenRecord(user.id, refreshToken);

    // Redirect to dashboard with tokens in cookies
    const redirectUrl = new URL(`${env.NEXT_PUBLIC_APP_URL}/dashboard`);
    const response = NextResponse.redirect(redirectUrl);

    // Set cookies
    response.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 15, // 15 minutes
    });

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      `${env.NEXT_PUBLIC_APP_URL}/login?error=oauth_failed`
    );
  }
});

async function handleGoogleCallback(code: string) {
  const redirectUri = `${env.NEXT_PUBLIC_APP_URL}/api/v1/auth/oauth/google/callback`;

  // Exchange code for tokens
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID!,
      client_secret: env.GOOGLE_CLIENT_SECRET!,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error("Failed to exchange Google OAuth code");
  }

  const tokens = await tokenResponse.json();

  // Get user info
  const userResponse = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    }
  );

  if (!userResponse.ok) {
    throw new Error("Failed to fetch Google user info");
  }

  const userInfo = await userResponse.json();

  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000)
    : undefined;

  return {
    provider: "google" as const,
    providerId: userInfo.id,
    email: userInfo.email,
    name: userInfo.name,
    avatar: userInfo.picture,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt,
  };
}

async function handleGitHubCallback(code: string) {
  const redirectUri = `${env.NEXT_PUBLIC_APP_URL}/api/v1/auth/oauth/github/callback`;

  // Exchange code for tokens
  const tokenResponse = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID!,
        client_secret: env.GITHUB_CLIENT_SECRET!,
        code,
        redirect_uri: redirectUri,
      }),
    }
  );

  if (!tokenResponse.ok) {
    throw new Error("Failed to exchange GitHub OAuth code");
  }

  const tokens = await tokenResponse.json();

  if (tokens.error) {
    throw new Error(tokens.error_description || "GitHub OAuth error");
  }

  // Get user info
  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!userResponse.ok) {
    throw new Error("Failed to fetch GitHub user info");
  }

  const userInfo = await userResponse.json();

  // Get primary email
  let email = userInfo.email;
  if (!email) {
    const emailsResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (emailsResponse.ok) {
      const emails = await emailsResponse.json();
      const primaryEmail = emails.find((e: any) => e.primary);
      email = primaryEmail?.email || emails[0]?.email;
    }
  }

  if (!email) {
    throw new Error("No email found for GitHub user");
  }

  return {
    provider: "github" as const,
    providerId: userInfo.id.toString(),
    email,
    name: userInfo.name || userInfo.login,
    avatar: userInfo.avatar_url,
    accessToken: tokens.access_token,
    refreshToken: null, // GitHub doesn't provide refresh tokens
    expiresAt: undefined,
  };
}

