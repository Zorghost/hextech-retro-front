"use client"
import { useFormState, useFormStatus } from "react-dom";
import { createGame, deleteFormAction } from "@/app/(admin)/dashboard/game/(form)/actions"
import { PhotoIcon, ArchiveBoxIcon } from "@heroicons/react/24/outline";
import { getGameThumbnailUrl } from "@/lib/assetUrls";
import Toast from "@/components/Toast";
import { useMemo, useState } from "react";

const initialState = { message: null }

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button 
      type="submit"
      aria-disabled={pending}
      className="btn-primary w-full">
        {pending ? "Saving..." : "Save"}
    </button>
  )
}

export default function GameForm({categories, game}) {
  const [state, formAction] = useFormState(createGame, initialState);
  const [thumbName, setThumbName] = useState("");
  const [romName, setRomName] = useState("");

  const toastTone = useMemo(() => {
    if (!state?.status) return "info";
    if (state.status === "success") return "success";
    if (state.status === "error") return "error";
    return "info";
  }, [state?.status]);

  return (
    <div>
      <div className="mb-4">
        <Toast message={state?.message} tone={toastTone} />
      </div>
      
      <form className="flex flex-col lg:flex-row gap-8" action={formAction}>

        <input type="text" id="gameId" name="gameId" className="hidden" defaultValue={game?.id} />

        <div className="lg:w-80">

          {game?.image ? (
            <img src={getGameThumbnailUrl(game?.image)} alt={game?.title} 
              className="mb-4 rounded-md"
            />
          ) : (
            <p className="text-sm text-accent">No image available</p>
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
                onChange={(e) => setThumbName(e.target.files?.[0]?.name ?? "")}
              />
            </label>
            {thumbName ? <div className="text-xs text-accent mt-2">Selected: {thumbName}</div> : null}
          </div>


          <div className="mb-4">
            <p className="block mb-2 text-xs text-accent uppercase">
              Upload Game
            </p>

            {game?.game_url ? (
              <div className="text-xs text-accent mb-2">Current: {game.game_url}</div>
            ) : null}

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
                <p className="text-xs">ZIP, RAR, 7zip</p>
              </div>
              <input
                type="file"
                id="gameFile"
                name="gameFile"
                accept=".zip,.rar,.7zip"
                className="hidden"
                onChange={(e) => setRomName(e.target.files?.[0]?.name ?? "")}
              />
            </label>
            {romName ? <div className="text-xs text-accent mt-2">Selected: {romName}</div> : null}
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
              className="input mb-4"
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
              className="input mb-4"
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
              className="input mb-4"
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
              className="select mb-4"
              defaultValue={game?.categories?.[0]?.id}
            >
            
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category?.id === game?.categories[0].id ? game?.categories[0].title : category?.title}
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
                <input type="radio" id="published" name="published" value="true" defaultChecked={game?.published === true}/>
                <label htmlFor="published">Published</label>
              </div>

              <div className="flex gap-2">
                <input type="radio" id="private" name="published" value="false" defaultChecked={game?.published !== true}/>
                <label htmlFor="private">Private</label>
              </div>
            </div>
            {typeof game?.published === "boolean" ? (
              <div className="text-xs text-accent mt-2">
                {game.published ? "This game is published." : "This game is private."}
              </div>
            ) : null}

          </div>

          <SubmitButton />
        </div>
        
      </form>

      <form action={deleteFormAction}>
        <input type="hidden" name="gameId" value={game?.id} />
        <button type="submit" className="btn-danger mt-4">Delete Game</button>
      </form>

    </div>
  )
}