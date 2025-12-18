import { NextRequest, NextResponse } from "next/server";
import { requireAuth, apiHandler } from "@/lib/api-guards";
import { saveFile } from "@/lib/file-upload";
import { getTenantFromRequest } from "@/lib/tenant";
import { z } from "zod";

export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  const organizationId = getTenantFromRequest(request);

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const purpose = formData.get("purpose") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!purpose) {
    return NextResponse.json({ error: "Purpose not specified" }, { status: 400 });
  }

  const validPurposes = ["avatar", "logo", "document", "other"];
  if (!validPurposes.includes(purpose)) {
    return NextResponse.json(
      { error: `Invalid purpose. Must be one of: ${validPurposes.join(", ")}` },
      { status: 400 }
    );
  }

  // Convert File to buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const fileData = {
    buffer,
    originalname: file.name,
    mimetype: file.type,
    size: file.size,
  };

  try {
    const result = await saveFile(fileData, {
      userId: auth.userId,
      organizationId,
      purpose: purpose as "avatar" | "logo" | "document" | "other",
    });

    return NextResponse.json({
      file: {
        id: result.id,
        url: result.url,
        originalName: file.name,
        size: file.size,
        mimeType: file.type,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload file" },
      { status: 400 }
    );
  }
});

