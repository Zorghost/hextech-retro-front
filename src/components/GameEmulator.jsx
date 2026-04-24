'use client'
import React, { useEffect, useRef, useState } from "react"

const EMULATOR_SCRIPT_SRC = "https://cdn.emulatorjs.org/stable/data/loader.js";

function configureEmulator({ gameUrl, core, isCompactViewport }) {
  window.EJS_player = "#game";
  window.EJS_gameUrl = gameUrl;
  window.EJS_core = String(core);
  window.EJS_pathtodata = "https://cdn.emulatorjs.org/stable/data/";

  if (isCompactViewport) {
    window.EJS_browserMode = "mobile";
  } else {
    delete window.EJS_browserMode;
  }
}

export default function GameEmulator({ game, romUrl }) {
  const scriptRef = useRef(null);
  const containerRef = useRef(null);
  const viewportRef = useRef(false);
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const updateViewportMode = () => {
      const compact = window.matchMedia("(max-width: 767px)").matches;
      viewportRef.current = compact;
      setIsCompactViewport(compact);
    };

    updateViewportMode();
    window.addEventListener("resize", updateViewportMode);
    window.addEventListener("orientationchange", updateViewportMode);

    return () => {
      window.removeEventListener("resize", updateViewportMode);
      window.removeEventListener("orientationchange", updateViewportMode);
    };
  }, []);

  useEffect(() => {
    // Resolve game URL - use romUrl if provided, otherwise use game.game_url
    const gameUrl = romUrl || (game?.game_url ? `/${game.game_url}` : null);
    const core = game?.categories?.[0]?.core;

    if (!gameUrl || !core) {
      console.error("GameEmulator: Missing gameUrl or core");
      return;
    }

    let isMounted = true;
    setLoadError("");
    configureEmulator({ gameUrl, core, isCompactViewport: viewportRef.current });

    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }

    const script = document.createElement("script");
    script.src = EMULATOR_SCRIPT_SRC;
    script.async = true;
    scriptRef.current = script;
    script.onload = () => {
      if (!isMounted) {
        script.remove();
      }
    };
    script.onerror = () => {
      if (!isMounted) {
        return;
      }

      console.error("Failed to load EmulatorJS");
      setLoadError("Failed to load the game engine. Please try again.");
    };

    document.body.appendChild(script);

    return () => {
      isMounted = false;

      try {
        if (window.EJS_emulator?.pause) {
          window.EJS_emulator.pause();
        }
      } catch (err) {
        console.warn("Error pausing emulator:", err);
      }

      try {
        if (window.EJS_emulator?.destroy) {
          window.EJS_emulator.destroy();
        }
      } catch (err) {
        console.warn("Error destroying emulator:", err);
      }

      const audioElements = containerRef.current?.querySelectorAll("audio") ?? [];
      audioElements.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });

      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }

      if (scriptRef.current?.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
        scriptRef.current = null;
      }

      window.EJS_emulator = null;
      delete window.EJS_browserMode;
    };
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
