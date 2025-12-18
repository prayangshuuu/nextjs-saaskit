import { NextRequest, NextResponse } from "next/server";
import { requireAuth, apiHandler } from "@/lib/api-guards";
import { getFilePath, getFileInfo, deleteFile } from "@/lib/file-upload";
import { readFile } from "fs/promises";
import { getAuthenticatedUser } from "@/lib/api-guards";

export const GET = apiHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const filePath = await getFilePath(params.id);

  if (!filePath) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  try {
    const fileBuffer = await readFile(filePath);
    const fileInfo = await getFileInfo(params.id);

    if (!fileInfo) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": fileInfo.mimeType,
        "Content-Disposition": `inline; filename="${fileInfo.originalName}"`,
        "Content-Length": fileInfo.size.toString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read file" },
      { status: 500 }
    );
  }
});

export const DELETE = apiHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const auth = await requireAuth(request);

  try {
    await deleteFile(params.id, auth.userId);
    return NextResponse.json({ message: "File deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete file" },
      { status: 400 }
    );
  }
});

