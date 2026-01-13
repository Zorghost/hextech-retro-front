"use server";
import { prisma } from "@/lib/prisma";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function getEnv(name, fallbackName) {
  return process.env[name] ?? (fallbackName ? process.env[fallbackName] : undefined);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidUploadFile(value) {
  return value && value instanceof File && value.name && value.size > 0;
}

export async function createGame(prevState, formData) {
  try {
    // Grab ID to update
    const id = formData.get("gameId");
    const title = formData.get("title");
    const slug = formData.get("slug");
    const description = formData.get("description");
    const categoryId = formData.get("category");
    const published = formData.get("published") === "true";
    const thumbnailFile = formData.get("thumbnailFile");
    const gameFile = formData.get("gameFile");

    const gameData = {
      title,
      slug,
      description,
      categories: {
        connect: { id: parseInt(categoryId, 10) },
      },
      published
    };


    if (id) {
      // Upload first so DB doesn't point at missing objects.
      if (isValidUploadFile(thumbnailFile)) {
        await uploadThumbnail(thumbnailFile);
        gameData.image = thumbnailFile.name;
      }

      if (isValidUploadFile(gameFile)) {
        await uploadGame(gameFile);
        gameData.game_url = gameFile.name;
      }

      // update the game
      await prisma.game.update({
        where: { id: parseInt(id, 10) },
        data: gameData
      });
      revalidatePath("/");

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
        revalidatePath("/");
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

      // Upload first so DB doesn't point at missing objects.
      await uploadThumbnail(thumbnailFile);
      await uploadGame(gameFile);

      gameData.image = thumbnailFile.name;
      gameData.game_url = gameFile.name;

      // Create new game
      await prisma.game.create({ data: gameData });

      revalidatePath("/");
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
    revalidatePath("/");
    return {
      status: "error",
      message: error.message,
      color: "red",
    };
  }
}


async function uploadGame(gameFile) {
  if (!isValidUploadFile(gameFile)) return;
  const buffer = Buffer.from(await gameFile.arrayBuffer());
  await uploadFileToS3(buffer, `rom/${gameFile.name}`, gameFile.type)
}

async function uploadThumbnail(thumbnailFile) {
  if (!isValidUploadFile(thumbnailFile)) return;
  const buffer = Buffer.from(await thumbnailFile.arrayBuffer());
  await uploadFileToS3(buffer, `thumbnail/${thumbnailFile.name}`, thumbnailFile.type)
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

export async function deleteFormAction(formData) {
  // delete logic here
  if(!formData) {
    throw new Error("No form data received.");
  }

  const id = formData.get("gameId");
  if(!id) {
    throw new Error("Game ID is missing.");
  }

  await prisma.game.delete({
    where: { id: parseInt(id, 10) }
  })

  redirect("/dashboard");
}