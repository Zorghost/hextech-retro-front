'use client'
import React, { useEffect, useRef, useState } from "react"

const EMULATOR_SCRIPT_SRC = "https://cdn.emulatorjs.org/stable/data/loader.js";

function configureEmulator({ gameUrl, core, isCompactViewport }) {
  window.EJS_player = "#game";
  window.EJS_gameUrl = gameUrl;
  window.EJS_core = String(core);
  window.EJS_pathtodata = "https://cdn.emulatorjs.org/stable/data/";
}

export default function GameEmulator({ game, romUrl }) {

  useEffect(() => {

    window.EJS_player = "#game";
    window.EJS_gameUrl = gameUrl;
    window.EJS_core = String(core);
    window.EJS_pathtodata = "https://cdn.emulatorjs.org/stable/data/";

    const script = document.createElement("script");
    script.src = EMULATOR_SCRIPT_SRC;
    script.async = true;

    document.body.appendChild(script);

  }, [game, romUrl]);


  return (
    <div className="bg-main flex justify-center overflow-hidden rounded-xl">
      <div
        className="w-full"
        style={{
          maxWidth: isCompactViewport ? "360px" : "640px",
          aspectRatio: "4 / 3",
        }}
      >
        <div ref={containerRef} id="game" className="h-full w-full">
          {loadError ? (
            <div className="flex h-full items-center justify-center rounded-xl border border-accent-secondary bg-main/90 p-4 text-sm text-slate-200">
              {loadError}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
