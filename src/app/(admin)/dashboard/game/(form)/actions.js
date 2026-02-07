"use server";
import { prisma } from "@/lib/prisma";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import path from "path";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/adminAuth";

function getEnv(name, fallbackName) {
  return process.env[name] ?? (fallbackName ? process.env[fallbackName] : undefined);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidUploadFile(value) {
  return value && value instanceof File && value.name && value.size > 0;
}

function parsePositiveIntEnv(name, fallbackValue) {
  const raw = process.env[name];
  if (!isNonEmptyString(raw)) return fallbackValue;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackValue;
}

const MAX_THUMBNAIL_BYTES = parsePositiveIntEnv("NEXT_MAX_THUMBNAIL_BYTES", 10 * 1024 * 1024); // 10MB
const MAX_ROM_BYTES = parsePositiveIntEnv("NEXT_MAX_ROM_BYTES", 256 * 1024 * 1024); // 256MB

const ALLOWED_THUMBNAIL_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);
// Broad but explicit allowlist; expand as needed for your EmulatorJS cores.
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

function assertSafeOriginalFilename(originalName) {
  if (!isNonEmptyString(originalName)) throw new Error("Invalid filename.");
  // Disallow path separators and traversal patterns.
  if (originalName.includes("/") || originalName.includes("\\")) {
    throw new Error("Invalid filename. Remove path separators.");
  }
  if (originalName.includes("..")) {
    throw new Error("Invalid filename. Remove '..' sequences.");
  }
  if (originalName.includes("\u0000")) {
    throw new Error("Invalid filename.");
  }
}

function getLowerExtension(filename) {
  const ext = path.extname(String(filename || "")).toLowerCase();
  return ext;
}

function generateUniqueFilename(originalName, allowedExtensions) {
  assertSafeOriginalFilename(originalName);
  const ext = getLowerExtension(originalName);
  if (!ext || ext === ".") {
    throw new Error("File extension is required.");
  }
  if (allowedExtensions && !allowedExtensions.has(ext)) {
    throw new Error(`Unsupported file extension: ${ext}`);
  }
  return `${randomUUID()}${ext}`;
}

async function deleteS3ObjectIfSafe(prefix, filename, allowedExtensions) {
  if (!isNonEmptyString(prefix) || !isNonEmptyString(filename)) return;

  try {
    assertSafeOriginalFilename(filename);
  } catch {
    // If legacy data contains weird names, don't risk deleting unintended keys.
    return;
  }

  const ext = getLowerExtension(filename);
  if (allowedExtensions && (!ext || !allowedExtensions.has(ext))) {
    return;
  }

  const objectKey = `${prefix}/${filename}`;
  try {
    assertS3Configured();
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: s3Bucket,
        Key: objectKey,
      }),
    );
    console.log("Deleted old object", { key: objectKey });
  } catch (error) {
    // Best-effort cleanup.
    console.error("Failed to delete old object", { key: objectKey, message: error?.message });
  }
}

function revalidateGamePages({ slug, oldSlug, id }) {
  revalidatePath("/");
  revalidatePath("/dashboard");

  if (Number.isFinite(id)) {
    revalidatePath(`/dashboard/game/${id}`);
  }

  if (isNonEmptyString(oldSlug)) {
    revalidatePath(`/game/${oldSlug.trim()}`);
  }

  if (isNonEmptyString(slug)) {
    revalidatePath(`/game/${slug.trim()}`);
  }
}

export async function createGame(prevState, formData) {
  try {
    await requireAdmin();
    // Grab ID to update
    const id = formData.get("gameId");
    const title = formData.get("title");
    const slug = formData.get("slug");
    const description = formData.get("description");
    const categoryId = formData.get("category");
    const published = formData.get("published") === "true";
    const thumbnailFile = formData.get("thumbnailFile");
    const gameFile = formData.get("gameFile");

    const parsedId = id ? parseInt(id, 10) : null;
    const parsedCategoryId = categoryId ? parseInt(categoryId, 10) : null;

    if (id && !Number.isFinite(parsedId)) {
      return {
        status: "error",
        message: "Invalid game ID.",
        color: "red",
      };
    }

    if (!Number.isFinite(parsedCategoryId)) {
      return {
        status: "error",
        message: "Category is required.",
        color: "red",
      };
    }

    let existingGameRecord = null;

    if (id) {
      existingGameRecord = await prisma.game.findUnique({
        where: { id: parsedId },
        select: { slug: true, image: true, game_url: true },
      });

      const existingGame = await prisma.game.findFirst({
        where: {
          slug: slug,
          NOT: { id: parsedId },
        },
        select: { id: true },
      });

      if (existingGame) {
        return {
          status: "error",
          message: "Slug already exists. Please choose a different slug.",
          color: "red",
        };
      }
    }

    const gameData = {
      title,
      slug,
      description,
      categories: id
        ? { set: [{ id: parsedCategoryId }] }
        : { connect: { id: parsedCategoryId } },
      published
    };


    const uploadedObjectKeys = [];

    if (id) {
      try {
        const previousThumbnail = existingGameRecord?.image;
        const previousRom = existingGameRecord?.game_url;

        // Upload first so DB doesn't point at missing objects.
        if (isValidUploadFile(thumbnailFile)) {
          const uploaded = await uploadThumbnail(thumbnailFile);
          if (uploaded) {
            uploadedObjectKeys.push(uploaded.objectKey);
            gameData.image = uploaded.filename;
          }
        }

        if (isValidUploadFile(gameFile)) {
          const uploaded = await uploadGame(gameFile);
          if (uploaded) {
            uploadedObjectKeys.push(uploaded.objectKey);
            gameData.game_url = uploaded.filename;
          }
        }

        // update the game
        await prisma.game.update({
          where: { id: parsedId },
          data: gameData
        });

        // Only after the DB write succeeds, delete replaced assets.
        if (isNonEmptyString(previousThumbnail) && isNonEmptyString(gameData.image)) {
          if (previousThumbnail !== gameData.image) {
            await deleteS3ObjectIfSafe("thumbnail", previousThumbnail, ALLOWED_THUMBNAIL_EXTENSIONS);
          }
        }

        if (isNonEmptyString(previousRom) && isNonEmptyString(gameData.game_url)) {
          if (previousRom !== gameData.game_url) {
            await deleteS3ObjectIfSafe("rom", previousRom, ALLOWED_ROM_EXTENSIONS);
          }
        }
      } catch (error) {
        await cleanupUploadedS3Objects(uploadedObjectKeys);
        throw error;
      }

      revalidateGamePages({
        id: parsedId,
        slug,
        oldSlug: existingGameRecord?.slug,
      });

      return {
        status: "success",
        message: "Game has been updated.",
        color: "green",
      };

    } else {
      // Check if slug already exist
      const existingGame = await prisma.game.findFirst({
        where: {
          slug: slug,
          NOT: id ? { id: parseInt(id, 10) } : undefined,
        },
      });

      if (existingGame) {
        return {
          status: "error",
          message: "Slug already exists. Please choose a different slug.",
          color: "red",
        };
      }

      // New games require both fields (Prisma schema has image + game_url as required).
      if (!isValidUploadFile(thumbnailFile)) {
        return {
          status: "error",
          message: "Thumbnail is required.",
          color: "red",
        };
      }

      if (!isValidUploadFile(gameFile)) {
        return {
          status: "error",
          message: "Game file is required.",
          color: "red",
        };
      }

      let created;
      try {
        // Upload first so DB doesn't point at missing objects.
        const uploadedThumbnail = await uploadThumbnail(thumbnailFile);
        const uploadedRom = await uploadGame(gameFile);

        if (uploadedThumbnail) {
          uploadedObjectKeys.push(uploadedThumbnail.objectKey);
          gameData.image = uploadedThumbnail.filename;
        }

        if (uploadedRom) {
          uploadedObjectKeys.push(uploadedRom.objectKey);
          gameData.game_url = uploadedRom.filename;
        }

        // Create new game
        created = await prisma.game.create({
          data: gameData,
          select: { id: true, slug: true },
        });
      } catch (error) {
        await cleanupUploadedS3Objects(uploadedObjectKeys);
        throw error;
      }

      revalidateGamePages({ id: created?.id, slug: created?.slug });
      return {
        status: "success",
        message: "Game has been added.",
        color: "green",
      };
    }

    return {
      status: "success",
      message: "Game has been added.",
      color: "green",
    };
  } catch (error) {
    return {
      status: "error",
      message: error.message,
      color: "red",
    };
  }
}

async function uploadGame(gameFile) {
  if (!isValidUploadFile(gameFile)) return null;
  assertSafeOriginalFilename(gameFile.name);
  if (gameFile.size > MAX_ROM_BYTES) {
    throw new Error(`Game file is too large. Max allowed: ${MAX_ROM_BYTES} bytes.`);
  }

  const filename = generateUniqueFilename(gameFile.name, ALLOWED_ROM_EXTENSIONS);
  const objectKey = `rom/${filename}`;

  const buffer = Buffer.from(await gameFile.arrayBuffer());
  await uploadFileToS3(buffer, objectKey, gameFile.type);
  return { filename, objectKey };
}

async function uploadThumbnail(thumbnailFile) {
  if (!isValidUploadFile(thumbnailFile)) return null;
  assertSafeOriginalFilename(thumbnailFile.name);
  if (thumbnailFile.size > MAX_THUMBNAIL_BYTES) {
    throw new Error(`Thumbnail is too large. Max allowed: ${MAX_THUMBNAIL_BYTES} bytes.`);
  }

  const filename = generateUniqueFilename(thumbnailFile.name, ALLOWED_THUMBNAIL_EXTENSIONS);
  const objectKey = `thumbnail/${filename}`;

  const buffer = Buffer.from(await thumbnailFile.arrayBuffer());
  await uploadFileToS3(buffer, objectKey, thumbnailFile.type);
  return { filename, objectKey };
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
})

async function uploadFileToS3(file, filename, contentType) {
  assertS3Configured();

  // Safe debug info (no secrets)
  console.log("Uploading to S3", {
    bucket: s3Bucket,
    endpoint: s3Endpoint,
    region: s3Region,
    key: filename,
    forcePathStyle: s3ForcePathStyle,
    publicRead: s3PublicRead,
  });

  const params = {
    Bucket: s3Bucket,
    Key: `${filename}`,
    Body: file,
    ContentType: contentType || undefined,
    ACL: s3PublicRead ? "public-read" : undefined,
  }

  const command = new PutObjectCommand(params);
  const response = await s3Client.send(command);
  console.log("File uploaded successfully", { key: filename, eTag: response?.ETag });
  return filename
}

async function cleanupUploadedS3Objects(objectKeys) {
  const keys = Array.isArray(objectKeys) ? objectKeys.filter(Boolean) : [];
  if (keys.length === 0) return;

  try {
    assertS3Configured();
  } catch {
    // If S3 isn't configured, there's nothing we can do.
    return;
  }

  await Promise.all(
    keys.map(async (Key) => {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: s3Bucket,
            Key,
          }),
        );
        console.log("Cleaned up uploaded object", { key: Key });
      } catch (error) {
        // Best-effort cleanup; don't mask the original DB error.
        console.error("Failed to cleanup uploaded object", { key: Key, message: error?.message });
      }
    }),
  );
}

export async function deleteFormAction(formData) {
  await requireAdmin();
  // delete logic here
  if(!formData) {
    throw new Error("No form data received.");
  }

  const id = formData.get("gameId");
  if(!id) {
    throw new Error("Game ID is missing.");
  }

  const parsedId = parseInt(id, 10);
  const existing = await prisma.game.findUnique({
    where: { id: parsedId },
    select: { slug: true },
  });

  await prisma.game.delete({
    where: { id: parsedId }
  });

  revalidateGamePages({ id: parsedId, oldSlug: existing?.slug });

  redirect("/dashboard");
}