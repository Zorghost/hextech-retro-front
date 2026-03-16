import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import path from "path";
import { auth } from "@/app/auth";

export const runtime = "nodejs";

const DEFAULT_ADMIN_EMAIL_ALLOWLIST = ["admin@admin.com"];
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

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function getAdminAllowlist() {
  const fromEnv = process.env.NEXT_ADMIN_EMAILS;
  if (!fromEnv) return DEFAULT_ADMIN_EMAIL_ALLOWLIST;

  return fromEnv
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter(Boolean);
}

function isAdminSession(session) {
  const email = normalizeEmail(session?.user?.email);
  const role = session?.user?.role;
  if (!email) return false;

  const allowlist = getAdminAllowlist();
  return role === "admin" || allowlist.includes(email);
}

function getEnv(name, fallbackName) {
  return process.env[name] ?? (fallbackName ? process.env[fallbackName] : undefined);
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

const s3Region = getEnv("NEXT_S3_REGION", "NEXT_AWS_S3_REGION");
const s3Bucket = getEnv("NEXT_S3_BUCKET_NAME", "NEXT_AWS_S3_BUCKET_NAME");
const s3Endpoint = getEnv("NEXT_S3_ENDPOINT", "NEXT_AWS_S3_ENDPOINT");
const s3ForcePathStyle = (getEnv("NEXT_S3_FORCE_PATH_STYLE") ?? "false").toLowerCase() === "true";
const s3PublicRead = (getEnv("NEXT_S3_PUBLIC_READ") ?? "false").toLowerCase() === "true";

function assertS3Configured() {
  const missing = [];

  if (!isNonEmptyString(s3Bucket)) missing.push("NEXT_S3_BUCKET_NAME");
  if (!isNonEmptyString(s3Region)) missing.push("NEXT_S3_REGION");
  if (!isNonEmptyString(s3Endpoint)) missing.push("NEXT_S3_ENDPOINT");

  const accessKeyId = getEnv("NEXT_S3_KEY_ID", "NEXT_AWS_S3_KEY_ID");
  const secretAccessKey = getEnv("NEXT_S3_SECRET_ACCESS_KEY", "NEXT_AWS_S3_SECRET_ACCESS_KEY");
  if (!isNonEmptyString(accessKeyId)) missing.push("NEXT_S3_KEY_ID");
  if (!isNonEmptyString(secretAccessKey)) missing.push("NEXT_S3_SECRET_ACCESS_KEY");

  if (missing.length > 0) {
    throw new Error(`S3 upload is not configured. Missing: ${missing.join(", ")}`);
  }
}

const s3Client = new S3Client({
  region: s3Region,
  endpoint: s3Endpoint,
  forcePathStyle: s3ForcePathStyle,
  credentials: {
    accessKeyId: getEnv("NEXT_S3_KEY_ID", "NEXT_AWS_S3_KEY_ID"),
    secretAccessKey: getEnv("NEXT_S3_SECRET_ACCESS_KEY", "NEXT_AWS_S3_SECRET_ACCESS_KEY"),
  },
});

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

  try {
    assertS3Configured();

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
      const chunk = formData.get("chunk");

      ensureRomKey(key);

      if (!isNonEmptyString(uploadId)) {
        return Response.json({ status: "error", message: "Upload ID is required." }, { status: 400 });
      }

      if (!Number.isInteger(partNumber) || partNumber < 1) {
        return Response.json({ status: "error", message: "Invalid part number." }, { status: 400 });
      }

      if (!(chunk instanceof File) || chunk.size <= 0) {
        return Response.json({ status: "error", message: "Chunk is required." }, { status: 400 });
      }

      const buffer = Buffer.from(await chunk.arrayBuffer());

      const uploadPartResponse = await s3Client.send(
        new UploadPartCommand({
          Bucket: s3Bucket,
          Key: key,
          UploadId: uploadId,
          PartNumber: partNumber,
          Body: buffer,
        }),
      );

      return Response.json({
        status: "success",
        eTag: uploadPartResponse.ETag,
      });
    }

    const body = await request.json();
    const action = body?.action;

    if (action === "init") {
      const originalName = String(body?.filename || "");
      const ext = validateRomFilename(originalName);
      const filename = `${randomUUID()}${ext}`;
      const key = `rom/${filename}`;

      const createResponse = await s3Client.send(
        new CreateMultipartUploadCommand({
          Bucket: s3Bucket,
          Key: key,
          ContentType: isNonEmptyString(body?.contentType) ? String(body.contentType) : undefined,
          ACL: s3PublicRead ? "public-read" : undefined,
        }),
      );

      if (!isNonEmptyString(createResponse.UploadId)) {
        throw new Error("Failed to initialize multipart upload.");
      }

      return Response.json({
        status: "success",
        key,
        uploadId: createResponse.UploadId,
      });
    }

    if (action === "complete") {
      const key = String(body?.key || "");
      const uploadId = String(body?.uploadId || "");
      const parts = Array.isArray(body?.parts) ? body.parts : [];

      ensureRomKey(key);

      if (!isNonEmptyString(uploadId)) {
        return Response.json({ status: "error", message: "Upload ID is required." }, { status: 400 });
      }

      const normalizedParts = parts
        .map((item) => ({
          ETag: typeof item?.ETag === "string" ? item.ETag : typeof item?.eTag === "string" ? item.eTag : null,
          PartNumber: Number.parseInt(String(item?.PartNumber ?? item?.partNumber ?? ""), 10),
        }))
        .filter((item) => isNonEmptyString(item.ETag) && Number.isInteger(item.PartNumber) && item.PartNumber > 0)
        .sort((a, b) => a.PartNumber - b.PartNumber);

      if (normalizedParts.length === 0) {
        return Response.json({ status: "error", message: "No uploaded parts provided." }, { status: 400 });
      }

      await s3Client.send(
        new CompleteMultipartUploadCommand({
          Bucket: s3Bucket,
          Key: key,
          UploadId: uploadId,
          MultipartUpload: {
            Parts: normalizedParts,
          },
        }),
      );

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

      await s3Client.send(
        new AbortMultipartUploadCommand({
          Bucket: s3Bucket,
          Key: key,
          UploadId: uploadId,
        }),
      );

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
