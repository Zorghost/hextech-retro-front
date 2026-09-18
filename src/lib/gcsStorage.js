import { Storage } from "@google-cloud/storage";

let storage;

function getServiceAccountCredentials() {
  const raw = process.env.GCS_SERVICE_ACCOUNT_JSON;
  if (!raw) return undefined;

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("GCS_SERVICE_ACCOUNT_JSON must contain valid JSON.");
  }
}

function getBucketName() {
  const bucketName = process.env.GCS_BUCKET_NAME || process.env.NEXT_GCS_BUCKET_NAME;
  if (!bucketName?.trim()) {
    throw new Error("GCS storage is not configured. Missing: GCS_BUCKET_NAME");
  }
  return bucketName.trim();
}

function getStorage() {
  if (!storage) {
    const options = {
      projectId: process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT,
      keyFilename: process.env.GCS_KEY_FILE,
      credentials: getServiceAccountCredentials(),
    };

    storage = new Storage(Object.fromEntries(Object.entries(options).filter(([, value]) => value)));
  }

  return storage;
}

export function getGcsBucket() {
  return getStorage().bucket(getBucketName());
}

export async function uploadGcsObject(key, body, contentType) {
  const file = getGcsBucket().file(key);
  await file.save(body, {
    resumable: false,
    contentType: contentType || undefined,
    metadata: {
      cacheControl: "public, max-age=300, stale-while-revalidate=86400",
    },
  });
  return file;
}

export async function deleteGcsObject(key) {
  await getGcsBucket().file(key).delete({ ignoreNotFound: true });
}

export async function getGcsObject(key) {
  const file = getGcsBucket().file(key);
  const [metadata] = await file.getMetadata();
  return {
    body: file.createReadStream(),
    contentType: metadata.contentType,
    contentLength: metadata.size,
  };
}

export async function getGcsImage(key) {
  const file = getGcsBucket().file(key);
  let lastError;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const [metadata, body] = await Promise.all([
        file.getMetadata(),
        file.download(),
      ]);

      return {
        body: body[0],
        contentType: metadata[0].contentType,
        contentLength: metadata[0].size,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

export async function createGcsResumableUpload(key, contentType) {
  const [uploadUrl] = await getGcsBucket().file(key).createResumableUpload({
    metadata: { contentType: contentType || "application/octet-stream" },
  });

  return Buffer.from(uploadUrl, "utf8").toString("base64url");
}

function decodeUploadUrl(uploadId) {
  try {
    const uploadUrl = Buffer.from(uploadId, "base64url").toString("utf8");
    const parsed = new URL(uploadUrl);
    const isGoogleStorageHost =
      parsed.hostname === "storage.googleapis.com" || parsed.hostname.endsWith(".googleapis.com");
    if (parsed.protocol !== "https:" || !isGoogleStorageHost) {
      throw new Error("Invalid upload session.");
    }
    return uploadUrl;
  } catch {
    throw new Error("Invalid upload session.");
  }
}

export async function uploadGcsChunk(uploadId, chunk, start, end, totalSize) {
  const response = await fetch(decodeUploadUrl(uploadId), {
    method: "PUT",
    headers: {
      "Content-Length": String(chunk.length),
      "Content-Range": `bytes ${start}-${end}/${totalSize}`,
    },
    body: chunk,
  });

  if (![200, 201, 308].includes(response.status)) {
    throw new Error(`GCS chunk upload failed with status ${response.status}.`);
  }

  return response.status;
}

export async function abortGcsResumableUpload(uploadId) {
  const response = await fetch(decodeUploadUrl(uploadId), { method: "DELETE" });
  if (![200, 204, 404].includes(response.status)) {
    throw new Error(`GCS upload cancellation failed with status ${response.status}.`);
  }
}