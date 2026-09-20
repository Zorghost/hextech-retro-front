"use server";
import { prisma } from "@/lib/prisma";
import { deleteGcsObject, uploadGcsObject } from "@/lib/gcsStorage";
import { randomUUID } from "crypto";
import path from "path";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/admin/auth";

function getEnv(name, fallbackName) {
  return process.env[name] ?? (fallbackName ? process.env[fallbackName] : undefined);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidUploadFile(value) {
  return value && value instanceof File && value.name && value.size > 0;
}

function normalizeInputString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSlug(value) {
  return normalizeInputString(value).toLowerCase();
}

function isValidSlug(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function parsePositiveInt(value) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function validateGameFormInput({ id, title, slug, description, categoryId }) {
  const normalizedTitle = normalizeInputString(title);
  const normalizedSlug = normalizeSlug(slug);
  const normalizedDescription = normalizeInputString(description);
  const normalizedCategoryId = normalizeInputString(categoryId);
  const parsedCategoryId = normalizedCategoryId ? parsePositiveInt(normalizedCategoryId) : null;

  if (id !== null && !Number.isInteger(id)) {
    return { error: "Invalid game ID." };
  }

  if (!normalizedTitle) {
    return { error: "Title is required." };
  }

  if (normalizedTitle.length > 200) {
    return { error: "Title must be 200 characters or fewer." };
  }

  if (!normalizedSlug) {
    return { error: "Slug is required." };
  }

  if (!isValidSlug(normalizedSlug)) {
    return {
      error: "Slug can only contain lowercase letters, numbers, and hyphens.",
    };
  }

  if (normalizedSlug.length > 200) {
    return { error: "Slug must be 200 characters or fewer." };
  }

  if (!normalizedDescription) {
    return { error: "Description is required." };
  }

  if (normalizedDescription.length > 5000) {
    return { error: "Description must be 5000 characters or fewer." };
  }

  if (normalizedCategoryId && !parsedCategoryId) {
    return { error: "Category is invalid." };
  }

  if (!parsedCategoryId) {
    return { error: "Category is required." };
  }

  return {
    value: {
      id,
      title: normalizedTitle,
      slug: normalizedSlug,
      description: normalizedDescription,
      categoryId: parsedCategoryId,
    },
  };
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
const THUMBNAIL_CONTENT_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};
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

async function deleteGcsObjectIfSafe(prefix, filename, allowedExtensions) {
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
    await deleteGcsObject(objectKey);
    console.log("Deleted old object", { key: objectKey });
  } catch (error) {
    // Best-effort cleanup.
    console.error("Failed to delete old GCS object", { key: objectKey, message: error?.message });
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

function isNextRedirectError(error) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_REDIRECT"),
  );
}
function isCloudflareBlockPage(value) {
  if (!isNonEmptyString(value)) return false;

  const normalized = value.toLowerCase();
  return (
    normalized.includes("<!doctype html") &&
    normalized.includes("cloudflare") &&
    normalized.includes("sorry, you have been blocked")
  );
}

function getErrorMessage(error) {
  if (isCloudflareBlockPage(error?.message)) {
    return "Upload request was blocked by Cloudflare. Check the Google Cloud Storage configuration and bucket permissions.";
  }

  if (typeof error?.message === "string" && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return "Failed to save game.";
}

export async function createGame(prevState, formData, options = {}) {
  try {
    if (!options?.skipAdminCheck) {
      await requireAdmin();
    }
    const rawGameId = normalizeInputString(formData.get("gameId"));
    const parsedGameId = rawGameId ? parsePositiveInt(rawGameId) : null;

    if (rawGameId && !parsedGameId) {
      return {
        status: "error",
        message: "Invalid game ID.",
        color: "red",
      };
    }

    const validation = validateGameFormInput({
      id: parsedGameId,
      title: formData.get("title"),
      slug: formData.get("slug"),
      description: formData.get("description"),
      categoryId: formData.get("category"),
    });

    if (validation.error) {
      return {
        status: "error",
        message: validation.error,
        color: "red",
      };
    }

    const { id, title, slug, description, categoryId: parsedCategoryId } = validation.value;
    const published = formData.get("published") === "true";
    const thumbnailFile = formData.get("thumbnailFile");
    const gameFile = formData.get("gameFile");
    const uploadedGameFileNameRaw = formData.get("uploadedGameFileName");
    const uploadedGameFileName = isNonEmptyString(uploadedGameFileNameRaw)
      ? uploadedGameFileNameRaw.trim()
      : null;

    const selectedCategory = await prisma.category.findUnique({
      where: { id: parsedCategoryId },
      select: { id: true },
    });

    if (!selectedCategory) {
      return {
        status: "error",
        message: "Selected category does not exist.",
        color: "red",
      };
    }

    if (uploadedGameFileName) {
      assertSafeOriginalFilename(uploadedGameFileName);
      const uploadedRomExt = getLowerExtension(uploadedGameFileName);

      if (!uploadedRomExt || !ALLOWED_ROM_EXTENSIONS.has(uploadedRomExt)) {
        return {
          status: "error",
          message: "Uploaded game file has an invalid extension.",
          color: "red",
        };
      }
    }

    let existingGameRecord = null;

    if (id) {
      existingGameRecord = await prisma.game.findUnique({
        where: { id },
        select: { slug: true, image: true, game_url: true },
      });

      const existingGame = await prisma.game.findFirst({
        where: {
          slug: slug,
          NOT: { id },
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
      published,
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
        } else if (uploadedGameFileName) {
          uploadedObjectKeys.push(`rom/${uploadedGameFileName}`);
          gameData.game_url = uploadedGameFileName;
        }

        // update the game
        await prisma.game.update({
          where: { id },
          data: gameData,
        });

        // Only after the DB write succeeds, delete replaced assets.
        if (isNonEmptyString(previousThumbnail) && isNonEmptyString(gameData.image)) {
          if (previousThumbnail !== gameData.image) {
            await deleteGcsObjectIfSafe("thumbnail", previousThumbnail, ALLOWED_THUMBNAIL_EXTENSIONS);
          }
        }

        if (isNonEmptyString(previousRom) && isNonEmptyString(gameData.game_url)) {
          if (previousRom !== gameData.game_url) {
            await deleteGcsObjectIfSafe("rom", previousRom, ALLOWED_ROM_EXTENSIONS);
          }
        }
      } catch (error) {
        await cleanupUploadedGcsObjects(uploadedObjectKeys);
        throw error;
      }

      revalidateGamePages({
        id,
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

      if (!isValidUploadFile(gameFile) && !uploadedGameFileName) {
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
        const uploadedRom = isValidUploadFile(gameFile)
          ? await uploadGame(gameFile)
          : null;

        if (uploadedThumbnail) {
          uploadedObjectKeys.push(uploadedThumbnail.objectKey);
          gameData.image = uploadedThumbnail.filename;
        }

        if (uploadedRom) {
          uploadedObjectKeys.push(uploadedRom.objectKey);
          gameData.game_url = uploadedRom.filename;
        } else if (uploadedGameFileName) {
          uploadedObjectKeys.push(`rom/${uploadedGameFileName}`);
          gameData.game_url = uploadedGameFileName;
        }

        // Create new game
        created = await prisma.game.create({
          data: gameData,
          select: { id: true, slug: true },
        });
      } catch (error) {
        await cleanupUploadedGcsObjects(uploadedObjectKeys);
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
    if (isNextRedirectError(error)) {
      throw error;
    }

    return {
      status: "error",
      message: getErrorMessage(error),
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
  await uploadGcsObject(objectKey, buffer, gameFile.type || "application/octet-stream");
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
  const extension = getLowerExtension(filename);
  const contentType = THUMBNAIL_CONTENT_TYPES[extension];

  const buffer = Buffer.from(await thumbnailFile.arrayBuffer());
  await uploadGcsObject(objectKey, buffer, contentType);
  return { filename, objectKey };
}

async function cleanupUploadedGcsObjects(objectKeys) {
  const keys = Array.isArray(objectKeys) ? objectKeys.filter(Boolean) : [];
  if (keys.length === 0) return;

  await Promise.all(
    keys.map(async (key) => {
      try {
        await deleteGcsObject(key);
        console.log("Cleaned up uploaded GCS object", { key });
      } catch (error) {
        console.error("Failed to cleanup uploaded GCS object", { key, message: error?.message });
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