'use client'
import React, { useEffect } from "react";

const EMULATOR_LOADER_SRC = "https://cdn.emulatorjs.org/stable/data/loader.js";

function resolveGameUrl(game, romUrl) {
  if (romUrl) return romUrl;
  if (!game?.game_url) return null;
  if (/^https?:\/\//i.test(game.game_url)) return game.game_url;
  return `/${game.game_url}`;
}

export default function GameEmulator({ game, romUrl }) {
  useEffect(() => {
    const gameUrl = resolveGameUrl(game, romUrl);
    const core = game?.categories?.[0]?.core;

    if (!gameUrl || !core) return;

    window.EJS_player = "#game";
    window.EJS_gameUrl = gameUrl;
    window.EJS_core = String(core);
    window.EJS_pathtodata = "https://cdn.emulatorjs.org/stable/data/";

    const script = document.createElement("script");
    script.src = EMULATOR_LOADER_SRC;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      try {
        if (window.EJS_emulator && typeof window.EJS_emulator.destroy === "function") {
          window.EJS_emulator.destroy();
        }
      } catch {
        // ignore
      }
      if (window.EJS_emulator) {
        window.EJS_emulator = null;
      }
    };
  }, [game, romUrl]);

  return (
    <div className="rounded-xl border border-accent-secondary bg-main p-4">
      <div className="mx-auto w-full max-w-[640px]">
        <div className="w-full aspect-[4/3]">
          <div id="game" className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}
