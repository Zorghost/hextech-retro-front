
'use client'
import React, { useEffect } from "react"

const EMULATOR_LOADER_SRC = "https://cdn.emulatorjs.org/stable/data/loader.js";
const EMULATOR_SCRIPT_ID = "emulatorjs-loader";

export default function GameEmulator({ game, romUrl }) {
  useEffect(() => {
    const container = document.querySelector("#game");
    if (container) container.innerHTML = "";

    const resolvedRomUrl = romUrl || game?.game_url;
    const resolvedCore = game?.categories?.[0]?.core;
    if (!resolvedRomUrl || !resolvedCore) return;

    window.EJS_player = "#game";
    window.EJS_gameUrl = resolvedRomUrl;
    window.EJS_core = `${resolvedCore}`;
    window.EJS_pathtodata = "https://cdn.emulatorjs.org/stable/data/";

    // If a previous loader exists, remove it so EmulatorJS re-reads globals.
    const existing = document.getElementById(EMULATOR_SCRIPT_ID);
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.id = EMULATOR_SCRIPT_ID;
    script.src = EMULATOR_LOADER_SRC;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Best-effort cleanup to avoid cross-game leakage.
      const maybeScript = document.getElementById(EMULATOR_SCRIPT_ID);
      if (maybeScript) maybeScript.remove();
      const maybeContainer = document.querySelector("#game");
      if (maybeContainer) maybeContainer.innerHTML = "";
      try {
        delete window.EJS_player;
        delete window.EJS_gameUrl;
        delete window.EJS_core;
        delete window.EJS_pathtodata;
      } catch {
        // ignore
      }
    };
  }, [game, romUrl]);
  return(
    <div className="bg-main flex justify-center rounded-xl">
      <div style={{ width: "640px", height: "480px", maxWidth: "100%" }}>
        <div id="game"></div>
      </div>
    </div>
  )
}