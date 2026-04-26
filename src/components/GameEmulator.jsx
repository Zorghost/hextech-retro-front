'use client'
import React, { useEffect } from "react"

const EMULATOR_SCRIPT_SRC = "https://cdn.emulatorjs.org/stable/data/loader.js";


export default function GameEmulator({ game, romUrl }) {
  const core = game?.categories?.[0]?.core;

  useEffect(() => {
    if (!romUrl) {
      return undefined;
    }

    window.EJS_player = "#game";
    window.EJS_gameUrl = romUrl;
    window.EJS_core = core ? String(core) : "";
    window.EJS_pathtodata = "https://cdn.emulatorjs.org/stable/data/";

    const script = document.createElement("script");
    script.src = EMULATOR_SCRIPT_SRC;
    script.async = true;

    document.body.appendChild(script);

    return () => {
      script.remove();
    };

  }, [core, romUrl]);


  return(
    <div className="bg-main flex justify-center rounded-xl">
      <div style={{ width: "640px", height: "480px", maxWidth: "100%" }}>
        <div id="game"></div>
      </div>
    </div>
  )
}
