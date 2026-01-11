import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

function getEnv(name, fallbackName) {
  return process.env[name] ?? (fallbackName ? process.env[fallbackName] : undefined);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function getS3ConfigOrThrow() {
  const region = getEnv("NEXT_S3_REGION", "NEXT_AWS_S3_REGION");
  const bucket = getEnv("NEXT_S3_BUCKET_NAME", "NEXT_AWS_S3_BUCKET_NAME");
  const endpoint = getEnv("NEXT_S3_ENDPOINT", "NEXT_AWS_S3_ENDPOINT");
  const forcePathStyle = (getEnv("NEXT_S3_FORCE_PATH_STYLE") ?? "false").toLowerCase() === "true";

  const accessKeyId = getEnv("NEXT_S3_KEY_ID", "NEXT_AWS_S3_KEY_ID");
  const secretAccessKey = getEnv(
    "NEXT_S3_SECRET_ACCESS_KEY",
    "NEXT_AWS_S3_SECRET_ACCESS_KEY",
  );

  const missing = [];
  if (!isNonEmptyString(bucket)) missing.push("NEXT_S3_BUCKET_NAME");
  if (!isNonEmptyString(region)) missing.push("NEXT_S3_REGION");
  if (!isNonEmptyString(endpoint)) missing.push("NEXT_S3_ENDPOINT");
  if (!isNonEmptyString(accessKeyId)) missing.push("NEXT_S3_KEY_ID");
  if (!isNonEmptyString(secretAccessKey)) missing.push("NEXT_S3_SECRET_ACCESS_KEY");

  if (missing.length > 0) {
    throw new Error(`S3 asset proxy is not configured. Missing: ${missing.join(", ")}`);
  }

  return {
    region,
    bucket,
    endpoint,
    forcePathStyle,
    accessKeyId,
    secretAccessKey,
  };
}

export const runtime = "nodejs";

// This is intentionally NOT a general purpose proxy.
// Only allow known public asset prefixes to prevent open-proxy abuse.
const ALLOWED_TOP_LEVEL_PREFIXES = new Set(["category", "thumbnail"]);

export async function GET(_request, { params }) {
  try {
    const keyParts = Array.isArray(params?.key) ? params.key : [params?.key].filter(Boolean);

    if (keyParts.length < 2) {
      return new Response("Not found", { status: 404 });
    }

    if (keyParts.some((part) => part === ".." || part.includes(".."))) {
      return new Response("Bad request", { status: 400 });
    }

    const topLevel = keyParts[0];
    if (!ALLOWED_TOP_LEVEL_PREFIXES.has(topLevel)) {
      return new Response("Not found", { status: 404 });
    }

    const objectKey = keyParts.join("/");

    const { region, bucket, endpoint, forcePathStyle, accessKeyId, secretAccessKey } =
      getS3ConfigOrThrow();

    const s3Client = new S3Client({
      region,
      endpoint,
      forcePathStyle,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const result = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: objectKey,
      }),
    );

    if (!result?.Body) {
      return new Response("Not found", { status: 404 });
    }

    const headers = new Headers();
    if (result.ContentType) headers.set("Content-Type", result.ContentType);

    // Long cache since these are versioned by filename in DB (or you can bust by renaming).
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new Response(result.Body, { status: 200, headers });
  } catch (error) {
    // Avoid leaking credentials/config; log server-side.
    console.error("S3 asset proxy error", { message: error?.message });

    // Common cases:
    // - NoSuchKey => 404
    // - InvalidAccessKeyId / SignatureDoesNotMatch => 502
    // - Any other upstream error => 502
    const message = (error?.name || "").toString();
    if (message === "NoSuchKey") {
      return new Response("Not found", { status: 404 });
    }

    return new Response("Upstream error", { status: 502 });
  }
}
