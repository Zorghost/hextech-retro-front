"use client"
import { useFormState, useFormStatus } from "react-dom";
import { createGame, deleteFormAction } from "@/app/(admin)/dashboard/game/(form)/actions"
import { PhotoIcon, ArchiveBoxIcon } from "@heroicons/react/24/outline";
import { getGameThumbnailUrl } from "@/lib/assetUrls";
import Image from "next/image";
import { useMemo, useState } from "react";

const initialState = { message: null }
const CHUNK_THRESHOLD_BYTES = 100 * 1024 * 1024;
const CHUNK_SIZE_BYTES = 8 * 1024 * 1024;

function postJson(url, payload) {
  return fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  }).then(async (response) => {
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(typeof body?.message === "string" ? body.message : "Request failed.");
    }
    return body;
  });
}

function uploadFormDataWithProgress(url, formData, onProgress) {
  return new Promise((resolve) => {
    const request = new XMLHttpRequest();

    request.open("POST", url);
    request.responseType = "json";

    request.upload.onprogress = (uploadEvent) => {
      if (!uploadEvent.lengthComputable) return;
      const percent = Math.round((uploadEvent.loaded / uploadEvent.total) * 100);
      onProgress(percent);
    };

    request.onload = () => {
      const responsePayload = request.response && typeof request.response === "object"
        ? request.response
        : null;

      if (request.status >= 200 && request.status < 300 && responsePayload) {
        resolve(responsePayload);
        return;
      }

      resolve(
        responsePayload ?? {
          status: "error",
          message: "Failed to save game.",
          color: "red",
        },
      );
    };

    request.onerror = () => {
      resolve({
        status: "error",
        message: "Network error while uploading the game.",
        color: "red",
      });
    };

    request.send(formData);
  });
}

function uploadChunkPart({ key, uploadId, partNumber, chunk, onProgress }) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.set("action", "uploadPart");
    formData.set("key", key);
    formData.set("uploadId", uploadId);
    formData.set("partNumber", String(partNumber));
    formData.set("chunk", chunk, `part-${partNumber}`);

    const request = new XMLHttpRequest();
    request.open("POST", "/api/admin/uploads/game-multipart");
    request.responseType = "json";

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(event.loaded);
      }
    };

    request.onload = () => {
      const response = request.response && typeof request.response === "object" ? request.response : null;
      if (request.status >= 200 && request.status < 300 && response?.eTag) {
        resolve(response.eTag);
        return;
      }

      reject(new Error(typeof response?.message === "string" ? response.message : "Chunk upload failed."));
    };

    request.onerror = () => {
      reject(new Error("Network error while uploading chunk."));
    };

    request.send(formData);
  });
}

async function uploadLargeGameInChunks(file, setUploadProgress) {
  const init = await postJson("/api/admin/uploads/game-multipart", {
    action: "init",
    filename: file.name,
    contentType: file.type,
  });

  const uploadId = init?.uploadId;
  const key = init?.key;

  if (typeof uploadId !== "string" || typeof key !== "string") {
    throw new Error("Failed to initialize chunk upload.");
  }

  const parts = [];
  let uploadedBytes = 0;

  try {
    const totalParts = Math.ceil(file.size / CHUNK_SIZE_BYTES);

    for (let index = 0; index < totalParts; index += 1) {
      const partNumber = index + 1;
      const start = index * CHUNK_SIZE_BYTES;
      const end = Math.min(start + CHUNK_SIZE_BYTES, file.size);
      const chunk = file.slice(start, end);

      const eTag = await uploadChunkPart({
        key,
        uploadId,
        partNumber,
        chunk,
        onProgress: (loaded) => {
          const rawPercent = ((uploadedBytes + loaded) / file.size) * 95;
          setUploadProgress(Math.max(1, Math.min(95, Math.round(rawPercent))));
        },
      });

      uploadedBytes += chunk.size;
      parts.push({ partNumber, eTag });
      const completedPercent = (uploadedBytes / file.size) * 95;
      setUploadProgress(Math.max(1, Math.min(95, Math.round(completedPercent))));
    }

    const complete = await postJson("/api/admin/uploads/game-multipart", {
      action: "complete",
      key,
      uploadId,
      parts,
    });

    setUploadProgress(95);

    if (typeof complete?.filename !== "string") {
      throw new Error("Upload completed but filename is missing.");
    }

    return complete.filename;
  } catch (error) {
    await postJson("/api/admin/uploads/game-multipart", {
      action: "abort",
      key,
      uploadId,
    }).catch(() => {
      // Best-effort abort.
    });

    throw error;
  }
}

function SubmitButton({ isCreateMode, isUploading, uploadProgress }) {
  const { pending } = useFormStatus();
  const buttonPending = isCreateMode ? isUploading : pending;

  let label = "Save";
  if (isCreateMode && isUploading) {
    const progress = Number.isFinite(uploadProgress) ? uploadProgress : 0;
    label = `Uploading... ${progress}%`;
  } else if (!isCreateMode && pending) {
    label = "Saving...";
  }

  return (
    <button 
      type="submit"
      disabled={buttonPending}
      aria-disabled={buttonPending}
      className="w-full text-white bg-yellow-500 font-medium rounded-lg text-sm px-5 py-2.5 text-center">
        {label}
    </button>
  )
}

function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="bg-red-600 text-white p-2 rounded-lg text-sm disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? "Deleting..." : "Delete Game"}
    </button>
  )
}
export default function GameForm({categories, game}) {
  const [state, formAction] = useFormState(createGame, initialState);
  const [clientState, setClientState] = useState(initialState);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const publishedDefault = typeof game?.published === "boolean" ? game.published : false;
  const isCreateMode = !game?.id;

  const currentState = useMemo(() => {
    return isCreateMode ? clientState : state;
  }, [isCreateMode, clientState, state]);

  const handleCreateSubmit = async (event) => {
    if (!isCreateMode || isUploading) return;

    event.preventDefault();
    setClientState(initialState);
    setUploadProgress(0);
    setIsUploading(true);

    const formData = new FormData(event.currentTarget);

    try {
      const gameFile = formData.get("gameFile");

      if (gameFile instanceof File && gameFile.size > CHUNK_THRESHOLD_BYTES) {
        const uploadedGameFileName = await uploadLargeGameInChunks(gameFile, setUploadProgress);
        formData.delete("gameFile");
        formData.set("uploadedGameFileName", uploadedGameFileName);
      }

      const result = await uploadFormDataWithProgress("/api/admin/games", formData, (percent) => {
        const adjusted = 95 + Math.round((percent / 100) * 5);
        setUploadProgress(Math.min(99, adjusted));
      });

      setClientState(result);
      if (result?.status === "success") {
        setUploadProgress(100);
      }
    } catch (error) {
      setClientState({
        status: "error",
        message: typeof error?.message === "string" ? error.message : "Failed to upload game.",
        color: "red",
      });
    }

    setIsUploading(false);
  };

  return (
    <div>
      {currentState.message && (
        <p className={`text-sm mb-4`} style={{ 'color': currentState.color }}>
          {currentState.message} - Status: {currentState.status} - Color: {currentState.color}
        </p>
      )}
      
      <form
        className="flex flex-col lg:flex-row gap-8"
        action={isCreateMode ? undefined : formAction}
        onSubmit={isCreateMode ? handleCreateSubmit : undefined}
      >

        <input type="text" id="gameId" name="gameId" className="hidden" defaultValue={game?.id} />

        <div className="lg:w-80">

          {game?.image ? (
            <Image
              src={getGameThumbnailUrl(game?.image)}
              alt={game?.title || "Game thumbnail"}
              width={320}
              height={180}
              className="mb-4 rounded-md w-full h-auto"
              quality={85}
              unoptimized
            />
          ) : (
            <p>No image available</p>
          )}

          <div className="mb-4">
            <p className="block mb-2 text-xs text-accent uppercase">
              Upload Thumbnail
            </p>

            <label htmlFor="thumbnailFile"
            className="flex flex-col items-center justify-center w-full h-40 border border-accent
            border-dashed rounded-md cursor-pointer bg-black hover:bg-accent-secondary
            "
            >
              <div className="flex flex-col items-center justify-center p-2">
                <PhotoIcon width={40} height={40} className="mb-4" />
                <p className="mb text-sm">
                  <b>Click to upload</b> or drag and drop
                </p>
                <p className="text-xs">PNG, JPG, WEBP (258x150)</p>
              </div>
              <input
                type="file"
                id="thumbnailFile"
                name="thumbnailFile"
                accept="image/png, image/jpg, image/jpeg, image/webp"
                className="hidden"
              />
            </label>
          </div>


          <div className="mb-4">
            <p className="block mb-2 text-xs text-accent uppercase">
              Upload Game
            </p>

            File: {game?.game_url}

            <label htmlFor="gameFile"
            className="flex flex-col items-center justify-center w-full h-40 border border-accent
            border-dashed rounded-md cursor-pointer bg-black hover:bg-accent-secondary
            "
            >
              <div className="flex flex-col items-center justify-center p-2">
                <ArchiveBoxIcon width={40} height={40} className="mb-4" />
                <p className="mb text-sm">
                  <b>Click to upload</b> or drag and drop
                </p>
                <p className="text-xs">ZIP, 7Z, and supported ROM formats</p>
              </div>
              <input
                type="file"
                id="gameFile"
                name="gameFile"
                accept=".zip,.7z,.nes,.sfc,.smc,.gba,.gb,.gbc,.nds,.gen,.md,.sms,.gg,.pce,.sgx,.n64,.z64,.v64,.bin,.cue,.iso,.cso,.pbp,.chd"
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="w-full">
          <div>
            <label htmlFor="title" className="block mb-2 text-xs text-accent uppercase">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              className="bg-black border border-accent sm:text-sm rounded-lg focus:ring-primary-600
              block w-full p-2 mb-4"
              defaultValue={game?.title}
            />
          </div>

          <div>
            <label htmlFor="slug" className="block mb-2 text-xs text-accent uppercase">
              Slug
            </label>
            <input
              type="text"
              id="slug"
              name="slug"
              required
              className="bg-black border border-accent sm:text-sm rounded-lg focus:ring-primary-600
              block w-full p-2 mb-4"
              defaultValue={game?.slug}
            />
          </div>

          <div>
            <label htmlFor="description" className="block mb-2 text-xs text-accent uppercase">
              Description
            </label>
            <textarea
              rows="3"
              cols="50"
              type="text"
              id="description"
              name="description"
              required
              className="bg-black border border-accent sm:text-sm rounded-lg focus:ring-primary-600
              block w-full p-2 mb-4"
              defaultValue={game?.description}
            />
          </div>

          <div>
            <label htmlFor="category" className="block mb-2 text-xs text-accent uppercase">
              Category
            </label>
            <select
              id="category"
              name="category"
              required
              className="bg-black border border-accent sm:text-sm rounded-lg focus:ring-primary-600
              block w-full p-2 mb-4"
              defaultValue={game?.categories?.[0]?.id ?? ""}
            >
            
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category?.title}
              </option> 
            ))}

            </select>
          </div>

          <div className="mb-4">
            <p className="block mb-2 text-xs text-accent uppercase">
              Published
            </p>

            <div className="flex gap-4">
              
              <div className="flex gap-2">
                <input
                  type="radio"
                  id="published"
                  name="published"
                  value="true"
                  defaultChecked={publishedDefault === true}
                  required
                />
                <label htmlFor="published">Published</label>
              </div>

              <div className="flex gap-2">
                <input
                  type="radio"
                  id="private"
                  name="published"
                  value="false"
                  defaultChecked={publishedDefault === false}
                  required
                />
                <label htmlFor="private">Private</label>
              </div>
            </div>
            {publishedDefault ? 'This game was published' : 'This game is not published.'}

          </div>

          <SubmitButton
            isCreateMode={isCreateMode}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
          />

          {isCreateMode && isUploading && (
            <div className="mt-3">
              <div className="h-2 w-full rounded bg-accent/20 overflow-hidden">
                <div
                  className="h-2 bg-yellow-500 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-accent">Upload progress: {uploadProgress}%</p>
            </div>
          )}
        </div>
        
      </form>

      {game?.id && (
        <form
          action={deleteFormAction}
          onSubmit={(e) => {
            const ok = window.confirm("Delete this game? This action cannot be undone.");
            if (!ok) e.preventDefault();
          }}
        >
          <input type="hidden" name="gameId" value={game.id} />
          <DeleteButton />
        </form>
      )}

    </div>
  )
}