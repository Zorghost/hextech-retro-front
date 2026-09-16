import {
  abortGcsResumableUpload,
  createGcsResumableUpload,
  getGcsBucket,
  uploadGcsChunk,
} from "@/lib/gcsStorage";
import { randomUUID } from "crypto";
import path from "path";
import { auth } from "@/app/auth";
import { isAdminSession } from "@/features/admin/auth";
import { checkRateLimit, getClientIp, getRateLimitHeaders } from "@/lib/ratelimit";

export const runtime = "nodejs";

const ALLOWED_ROM_EXTENSIONS = new Set([
  ".zip",
  ".7z",
  ".nes",
  ".sfc",
  ".smc",
  ".gba",
  ".gb",
  ".gbc",
  ".nds",
  ".gen",
  ".md",
  ".sms",
  ".gg",
  ".pce",
  ".sgx",
  ".n64",
  ".z64",
  ".v64",
  ".bin",
  ".cue",
  ".iso",
  ".cso",
  ".pbp",
  ".chd",
]);

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function getLowerExtension(filename) {
  return path.extname(String(filename || "")).toLowerCase();
}

function assertSafeFilename(filename) {
  if (!isNonEmptyString(filename)) {
    throw new Error("Invalid filename.");
  }

  if (filename.includes("/") || filename.includes("\\") || filename.includes("..") || filename.includes("\u0000")) {
    throw new Error("Invalid filename.");
  }
}

function validateRomFilename(filename) {
  assertSafeFilename(filename);
  const ext = getLowerExtension(filename);

  if (!ext || ext === ".") {
    throw new Error("File extension is required.");
  }

  if (!ALLOWED_ROM_EXTENSIONS.has(ext)) {
    throw new Error(`Unsupported file extension: ${ext}`);
  }

  return ext;
}

function ensureRomKey(key) {
  if (!isNonEmptyString(key)) throw new Error("Invalid key.");
  if (!key.startsWith("rom/")) throw new Error("Invalid key.");

  const filename = key.slice(4);
  validateRomFilename(filename);
  return filename;
}

export async function POST(request) {
  const session = await auth();

  if (!isAdminSession(session)) {
    return Response.json({ status: "error", message: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting: 3 ROM uploads per minute per admin (critical S3 abuse prevention)
  const clientIp = getClientIp(request);
  const rateLimitKey = `admin:uploads:${session.user.id || clientIp}`;
  const rateLimitResult = await checkRateLimit(rateLimitKey, 3, 60000);

  if (!rateLimitResult.success) {
    return Response.json(
      { status: "error", message: "Too many upload requests. Please try again later." },
      {
        status: 429,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
  }

  try {
    getGcsBucket();

    const contentType = request.headers.get("content-type") || "";
    const isMultipart = contentType.includes("multipart/form-data");

    if (isMultipart) {
      const formData = await request.formData();
      const action = formData.get("action");

      if (action !== "uploadPart") {
        return Response.json({ status: "error", message: "Invalid multipart action." }, { status: 400 });
      }

      const key = String(formData.get("key") || "");
      const uploadId = String(formData.get("uploadId") || "");
      const partNumber = Number.parseInt(String(formData.get("partNumber") || ""), 10);
      const start = Number.parseInt(String(formData.get("start") || ""), 10);
      const end = Number.parseInt(String(formData.get("end") || ""), 10);
      const totalSize = Number.parseInt(String(formData.get("totalSize") || ""), 10);
      const chunk = formData.get("chunk");

      ensureRomKey(key);

      if (!isNonEmptyString(uploadId)) {
        return Response.json({ status: "error", message: "Upload ID is required." }, { status: 400 });
      }

      if (!Number.isInteger(partNumber) || partNumber < 1) {
        return Response.json({ status: "error", message: "Invalid part number." }, { status: 400 });
      }

      if (!Number.isInteger(start) || !Number.isInteger(end) || !Number.isInteger(totalSize) || start < 0 || end < start || end >= totalSize) {
        return Response.json({ status: "error", message: "Invalid upload range." }, { status: 400 });
      }

      if (!(chunk instanceof File) || chunk.size <= 0) {
        return Response.json({ status: "error", message: "Chunk is required." }, { status: 400 });
      }

      const buffer = Buffer.from(await chunk.arrayBuffer());

      if (buffer.length !== end - start + 1) {
        return Response.json({ status: "error", message: "Upload range does not match chunk size." }, { status: 400 });
      }

      const uploadStatus = await uploadGcsChunk(uploadId, buffer, start, end, totalSize);

      return Response.json({
        status: "success",
        eTag: `gcs-${partNumber}-${uploadStatus}`,
      });
    }

    const body = await request.json();
    const action = body?.action;

    if (action === "init") {
      const originalName = String(body?.filename || "");
      const ext = validateRomFilename(originalName);
      const filename = `${randomUUID()}${ext}`;
      const key = `rom/${filename}`;

      const uploadId = await createGcsResumableUpload(
        key,
        isNonEmptyString(body?.contentType) ? String(body.contentType) : undefined,
      );

      return Response.json({
        status: "success",
        key,
        uploadId,
      });
    }

    if (action === "complete") {
      const key = String(body?.key || "");
      const uploadId = String(body?.uploadId || "");

      ensureRomKey(key);

      if (!isNonEmptyString(uploadId)) {
        return Response.json({ status: "error", message: "Upload ID is required." }, { status: 400 });
      }

      const filename = ensureRomKey(key);
      return Response.json({
        status: "success",
        key,
        filename,
      });
    }

    if (action === "abort") {
      const key = String(body?.key || "");
      const uploadId = String(body?.uploadId || "");

      ensureRomKey(key);

      if (!isNonEmptyString(uploadId)) {
        return Response.json({ status: "error", message: "Upload ID is required." }, { status: 400 });
      }

      await abortGcsResumableUpload(uploadId);

      return Response.json({ status: "success" });
    }

    return Response.json({ status: "error", message: "Unknown action." }, { status: 400 });
  } catch (error) {
    return Response.json(
      {
        status: "error",
        message: typeof error?.message === "string" ? error.message : "Multipart upload failed.",
      },
      { status: 500 },
    );
  }
}
