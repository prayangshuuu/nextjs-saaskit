import { NextRequest, NextResponse } from "next/server";
import { swaggerSpec } from "@/lib/openapi";

export async function GET(request: NextRequest) {
  // API docs spec is public (no auth required for OpenAPI spec)
  return NextResponse.json(swaggerSpec);
}

