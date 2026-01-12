
'use client'
import React, { useEffect, useMemo, useState } from "react"

export default function GameEmulator({ game, romUrl }) {
  const [status, setStatus] = useState("loading");

  const core = useMemo(() => {
    const c = game?.categories?.[0]?.core;
    return typeof c === "string" ? c : "";
  }, [game]);

  useEffect(() => {
    setStatus("loading");

    window.EJS_player = "#game";
    window.EJS_gameUrl = romUrl || game?.game_url;
    window.EJS_core = `${core}`
    window.EJS_pathtodata = "https://cdn.emulatorjs.org/stable/data/";

    // Remove any previously injected loader to avoid duplicates when navigating.
    const existing = document.querySelector('script[data-ejs-loader="true"]');
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.src = "https://cdn.emulatorjs.org/stable/data/loader.js";
    script.async = true;
    script.dataset.ejsLoader = "true";
    script.onload = () => setStatus("ready");
    script.onerror = () => setStatus("error");
    document.body.appendChild(script);

    return () => {
      // Best-effort cleanup of the emulator container.
      const el = document.getElementById("game");
      if (el) el.innerHTML = "";
    };
  }, [game?.id, game?.game_url, core, romUrl]);

  return(
    <div className="card p-3 md:p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-sm text-accent">
          {status === "loading" ? "Loading emulator…" : null}
          {status === "ready" ? "Ready" : null}
          {status === "error" ? "Failed to load emulator" : null}
        </div>
        {core ? <div className="text-xs text-accent">Core: {core}</div> : null}
      </div>

      <div className="flex justify-center">
        <div style={{ width: "640px", height: "480px", maxWidth: "100%" }}>
          <div id="game" />
        </div>
      </div>
    </div>
  )
}