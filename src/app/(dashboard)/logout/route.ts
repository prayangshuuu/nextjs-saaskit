import { NextRequest, NextResponse } from "next/server";
import { deleteSession, deleteRefreshToken } from "@/lib/auth";
import { requireAuth, apiHandler } from "@/lib/api-guards";

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  // Delete sessions
  if (accessToken) {
    await deleteSession(accessToken);
  }
  if (refreshToken) {
    await deleteRefreshToken(refreshToken);
  }

  const response = NextResponse.json({ message: "Logged out successfully" });

  // Clear cookies
  response.cookies.delete("accessToken");
  response.cookies.delete("refreshToken");

  return response;
});

