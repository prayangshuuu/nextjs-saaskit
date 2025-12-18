import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-guards";
import { env } from "@/lib/env";

export const GET = apiHandler(async (
  request: NextRequest,
  { params }: { params: { provider: string } }
) => {
  const provider = params.provider.toLowerCase();

  if (provider !== "google" && provider !== "github") {
    return NextResponse.json(
      { error: "Invalid OAuth provider" },
      { status: 400 }
    );
  }

  // Generate OAuth authorization URL
  const redirectUri = `${env.NEXT_PUBLIC_APP_URL}/api/v1/auth/oauth/${provider}/callback`;
  let authUrl = "";

  if (provider === "google") {
    if (!env.GOOGLE_CLIENT_ID) {
      return NextResponse.json(
        { error: "Google OAuth not configured" },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
    });

    authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  } else if (provider === "github") {
    if (!env.GITHUB_CLIENT_ID) {
      return NextResponse.json(
        { error: "GitHub OAuth not configured" },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: "user:email",
    });

    authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  return NextResponse.json({ authUrl });
});

