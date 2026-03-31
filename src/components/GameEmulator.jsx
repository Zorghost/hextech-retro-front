'use client'
import React, { useEffect } from "react"

export default function GameEmulator({ game, romUrl }) {
  useEffect(() => {
    // Resolve game URL - use romUrl if provided, otherwise use game.game_url
    const gameUrl = romUrl || (game?.game_url ? `/${game.game_url}` : null);
    const core = game?.categories?.[0]?.core;

    if (!gameUrl || !core) {
      console.error("GameEmulator: Missing gameUrl or core");
      return;
    }

    window.EJS_player = "#game";
    window.EJS_gameUrl = gameUrl;
    window.EJS_core = String(core);
    window.EJS_pathtodata = "https://cdn.emulatorjs.org/stable/data/";

    const script = document.createElement("script");
    script.src = "https://cdn.emulatorjs.org/stable/data/loader.js";
    script.async = true;
    document.body.appendChild(script);

    // Cleanup function
    return () => {
      try {
        if (window.EJS_emulator?.destroy) {
          window.EJS_emulator.destroy();
        }
      } catch (err) {
        console.warn("Error destroying emulator:", err);
      }
      window.EJS_emulator = null;
    };
  }, [game, romUrl]);


  return (
    <div className="bg-main flex justify-center rounded-xl">
      <div style={{ width: "640px", height: "480px", maxWidth: "100%" }}>
        <div id="game"></div>
      </div>
    </div>
  );
}
