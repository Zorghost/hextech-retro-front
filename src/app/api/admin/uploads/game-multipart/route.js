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

const MAX_ROM_BYTES = Number.parseInt(process.env.NEXT_MAX_ROM_BYTES || "", 10) > 0
  ? Number.parseInt(process.env.NEXT_MAX_ROM_BYTES, 10)
  : 256 * 1024 * 1024;
const UPLOAD_SESSION_TTL_MS = 30 * 60 * 1000;
const uploadSessions = new Map();

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

function getUploadOwnerId(session) {
  return String(session?.user?.id || session?.user?.email || "");
}

function cleanupUploadSessions() {
  const now = Date.now();

  for (const [uploadId, uploadSession] of uploadSessions.entries()) {
    if (uploadSession.expiresAt <= now) {
      uploadSessions.delete(uploadId);
    }
  }
}

function validateUploadSession({ uploadId, key, ownerId, totalSize }) {
  cleanupUploadSessions();

  const uploadSession = uploadSessions.get(uploadId);

  if (!uploadSession) {
    return { status: 400, message: "Upload session is invalid or expired." };
  }

  if (uploadSession.ownerId !== ownerId || uploadSession.key !== key) {
    return { status: 403, message: "Upload session does not belong to this administrator." };
  }

  if (totalSize !== undefined && uploadSession.totalSize !== totalSize) {
    return { status: 400, message: "Upload size does not match the initialized session." };
  }

  return { session: uploadSession };
}

export async function POST(request) {
  const session = await auth();

  if (!isAdminSession(session)) {
    return Response.json({ status: "error", message: "Unauthorized" }, { status: 401 });
  }

  const ownerId = getUploadOwnerId(session);

  if (!ownerId) {
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
        headers: getRateLimitHeaders(rateLimitResult, 3),
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

      const sessionValidation = validateUploadSession({
        uploadId,
        key,
        ownerId,
        totalSize,
      });

      if (!sessionValidation.session) {
        return Response.json(
          { status: "error", message: sessionValidation.message },
          { status: sessionValidation.status },
        );
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
      const totalSize = Number(body?.totalSize);

      if (!Number.isInteger(totalSize) || totalSize <= 0 || totalSize > MAX_ROM_BYTES) {
        return Response.json(
          { status: "error", message: `ROM file must be between 1 byte and ${MAX_ROM_BYTES} bytes.` },
          { status: 400 },
        );
      }

      const ext = validateRomFilename(originalName);
      const filename = `${randomUUID()}${ext}`;
      const key = `rom/${filename}`;

      const uploadId = await createGcsResumableUpload(
        key,
        isNonEmptyString(body?.contentType) ? String(body.contentType) : undefined,
      );

      uploadSessions.set(uploadId, {
        ownerId,
        key,
        totalSize,
        expiresAt: Date.now() + UPLOAD_SESSION_TTL_MS,
      });

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

      const sessionValidation = validateUploadSession({ uploadId, key, ownerId });

      if (!sessionValidation.session) {
        return Response.json(
          { status: "error", message: sessionValidation.message },
          { status: sessionValidation.status },
        );
      }

      const filename = ensureRomKey(key);
      uploadSessions.delete(uploadId);
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

      const sessionValidation = validateUploadSession({ uploadId, key, ownerId });

      if (!sessionValidation.session) {
        return Response.json(
          { status: "error", message: sessionValidation.message },
          { status: sessionValidation.status },
        );
      }

      await abortGcsResumableUpload(uploadId);
      uploadSessions.delete(uploadId);

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
