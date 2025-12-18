/**
 * File Upload Service
 * 
 * MIT License
 * Copyright (c) 2025 Prayangshu Biswas
 */

import { prisma } from "./prisma";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import crypto from "crypto";

export interface FileUploadOptions {
  userId: string;
  organizationId?: string | null;
  purpose: "avatar" | "logo" | "document" | "other";
  maxSize?: number; // Max size in bytes
  allowedMimeTypes?: string[];
}

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_ALLOWED_TYPES: Record<string, string[]> = {
  avatar: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  logo: ["image/jpeg", "image/png", "image/svg+xml", "image/webp"],
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ],
  other: ["*"], // Allow all for other
};

// Get upload directory
function getUploadDir(purpose: string): string {
  const baseDir = process.env.UPLOAD_DIR || "./uploads";
  return join(baseDir, purpose);
}

// Generate unique filename
function generateFilename(originalName: string): string {
  const ext = originalName.split(".").pop();
  const randomId = crypto.randomBytes(16).toString("hex");
  return `${randomId}.${ext}`;
}

// Validate file
function validateFile(
  file: { size: number; type: string },
  options: FileUploadOptions
): { valid: boolean; error?: string } {
  const maxSize = options.maxSize || DEFAULT_MAX_SIZE;
  const allowedTypes =
    options.allowedMimeTypes ||
    DEFAULT_ALLOWED_TYPES[options.purpose] ||
    DEFAULT_ALLOWED_TYPES.other;

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
    };
  }

  if (
    allowedTypes[0] !== "*" &&
    !allowedTypes.includes(file.type)
  ) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  return { valid: true };
}

// Save file to local storage
export async function saveFile(
  file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
  options: FileUploadOptions
): Promise<{ id: string; path: string; url: string }> {
  // Validate file
  const validation = validateFile(file, options);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Ensure upload directory exists
  const uploadDir = getUploadDir(options.purpose);
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  // Generate filename
  const filename = generateFilename(file.originalname);
  const filePath = join(uploadDir, filename);

  // Save file
  await writeFile(filePath, file.buffer);

  // Save to database
  const fileRecord = await prisma.fileUpload.create({
    data: {
      userId: options.userId,
      organizationId: options.organizationId || null,
      filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storagePath: filePath,
      storageType: "local",
      purpose: options.purpose,
    },
  });

  // Generate URL (in production, use CDN or S3 URL)
  const url = `/api/v1/files/${fileRecord.id}`;

  return {
    id: fileRecord.id,
    path: filePath,
    url,
  };
}

// Delete file
export async function deleteFile(fileId: string, userId: string): Promise<void> {
  const fileRecord = await prisma.fileUpload.findUnique({
    where: { id: fileId },
  });

  if (!fileRecord) {
    throw new Error("File not found");
  }

  // Verify ownership (user or admin)
  if (fileRecord.userId !== userId) {
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (user?.role.name !== "ADMIN") {
      throw new Error("Unauthorized to delete this file");
    }
  }

  // Delete file from storage
  if (fileRecord.storageType === "local" && existsSync(fileRecord.storagePath)) {
    await unlink(fileRecord.storagePath);
  }

  // Delete from database
  await prisma.fileUpload.delete({
    where: { id: fileId },
  });
}

// Get file info
export async function getFileInfo(fileId: string) {
  return prisma.fileUpload.findUnique({
    where: { id: fileId },
    select: {
      id: true,
      filename: true,
      originalName: true,
      mimeType: true,
      size: true,
      purpose: true,
      createdAt: true,
    },
  });
}

// Get file path for serving
export async function getFilePath(fileId: string): Promise<string | null> {
  const fileRecord = await prisma.fileUpload.findUnique({
    where: { id: fileId },
  });

  if (!fileRecord) {
    return null;
  }

  return fileRecord.storagePath;
}

