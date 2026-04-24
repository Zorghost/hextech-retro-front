'use client'
import React, { useEffect, useRef, useState } from "react"

const EMULATOR_SCRIPT_SRC = "https://cdn.emulatorjs.org/stable/data/loader.js";
const TOUCH_DEVICE_QUERY = "(pointer: coarse), (max-width: 767px)";

function configureEmulator({ gameUrl, core, useMobileMode }) {
  window.EJS_player = "#game";
  window.EJS_gameUrl = gameUrl;
  window.EJS_core = String(core);
  window.EJS_pathtodata = "https://cdn.emulatorjs.org/stable/data/";
  window.EJS_startOnLoaded = useMobileMode;
  window.EJS_fullscreenOnLoaded = useMobileMode;
  window.EJS_noAutoFocus = useMobileMode;

  if (useMobileMode) {
    window.EJS_browserMode = "mobile";
  } else {
    delete window.EJS_browserMode;
  }
}

function clearEmulatorGlobals() {
  delete window.EJS_player;
  delete window.EJS_gameUrl;
  delete window.EJS_core;
  delete window.EJS_pathtodata;
  delete window.EJS_startOnLoaded;
  delete window.EJS_fullscreenOnLoaded;
  delete window.EJS_noAutoFocus;
  delete window.EJS_browserMode;
}

export default function GameEmulator({ game, romUrl }) {
  const shellRef = useRef(null);
  const scriptRef = useRef(null);
  const containerRef = useRef(null);
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [fullscreenError, setFullscreenError] = useState("");

  useEffect(() => {
    const updateViewportMode = () => {
      const compact = window.matchMedia("(max-width: 767px)").matches;
      setIsCompactViewport(compact);
      setIsTouchDevice(window.matchMedia(TOUCH_DEVICE_QUERY).matches || navigator.maxTouchPoints > 0);
    };

    updateViewportMode();
    window.addEventListener("resize", updateViewportMode);
    window.addEventListener("orientationchange", updateViewportMode);

    return () => {
      window.removeEventListener("resize", updateViewportMode);
      window.removeEventListener("orientationchange", updateViewportMode);
    };
  }, []);

  const useMobileMode = isTouchDevice || isCompactViewport;

  const handleFullscreen = async () => {
    const element = shellRef.current;

    if (!element) {
      return;
    }

    setFullscreenError("");

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      if (typeof element.requestFullscreen !== "function") {
        throw new Error("Fullscreen is not supported");
      }

      await element.requestFullscreen();

      if (window.screen?.orientation?.lock) {
        try {
          await window.screen.orientation.lock("landscape");
        } catch {
          // Ignore browsers that do not allow orientation locking.
        }
      }
    } catch (error) {
      console.warn("Failed to toggle fullscreen:", error);
      setFullscreenError("Fullscreen is not available on this device.");
    }
  };

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
    configureEmulator({ gameUrl, core, useMobileMode });

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
      clearEmulatorGlobals();

      if (document.fullscreenElement && shellRef.current?.contains(document.fullscreenElement)) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [game, romUrl, useMobileMode]);


  return (
    <div ref={shellRef} className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent-secondary bg-main/80 px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Player</p>
          <p className="text-sm text-slate-300">
            {useMobileMode
              ? "Touch mode is enabled. Fullscreen gives the best control layout on phones and tablets."
              : "Use fullscreen for a larger play area and less page chrome."
            }
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {useMobileMode ? (
            <span className="rounded-full border border-accent-secondary bg-primary px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-200">
              Landscape recommended
            </span>
          ) : null}
          <button
            type="button"
            onClick={handleFullscreen}
            className="inline-flex items-center justify-center rounded-full border border-accent px-4 py-2 text-sm font-medium text-white transition hover:border-slate-200 hover:bg-accent-secondary"
          >
            Fullscreen
          </button>
        </div>
      </div>

      {fullscreenError ? (
        <p className="text-sm text-slate-300" role="status" aria-live="polite">
          {fullscreenError}
        </p>
      ) : null}

      <div className="bg-main flex justify-center overflow-hidden rounded-xl touch-none overscroll-contain">
        <div
          className="w-full"
          style={{
            maxWidth: useMobileMode ? "100%" : "640px",
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
    </div>
  );
}
