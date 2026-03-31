'use client'
import React, { useEffect, useRef, useState } from "react";

const EMULATOR_LOADER_SRC = "https://cdn.emulatorjs.org/stable/data/loader.js";
const scrollKeys = new Set(["ArrowUp", "ArrowDown", "Space"]);

function resolveGameUrl(game, romUrl) {
  if (romUrl) return romUrl;
  if (!game?.game_url) return null;
  if (/^https?:\/\//i.test(game.game_url)) return game.game_url;
  return `/${game.game_url}`;
}

export default function GameEmulator({ game, romUrl, onError }) {
  const containerRef = useRef(null);
  const scriptRef = useRef(null);
  const emulatorCreatedRef = useRef(false);
  const [hasError, setHasError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Main emulator initialization effect
  useEffect(() => {
    const gameUrl = resolveGameUrl(game, romUrl);
    const core = game?.categories?.[0]?.core;

    if (!gameUrl || !core) {
      console.log("GameEmulator: Missing gameUrl or core", { gameUrl, core });
      return;
    }

    // Reset error state
    setHasError(false);
    setErrorMsg("");

    // Clean up any previous script
    if (scriptRef.current?.parentNode) {
      scriptRef.current.parentNode.removeChild(scriptRef.current);
      scriptRef.current = null;
    }

    // Destroy previous emulator instance
    try {
      if (window.EJS_emulator?.destroy) {
        window.EJS_emulator.destroy();
      }
    } catch (err) {
      console.warn("Error destroying previous emulator:", err);
    }
    window.EJS_emulator = null;
    emulatorCreatedRef.current = false;

    // Set up emulator configuration
    window.EJS_player = "#game";
    window.EJS_gameUrl = gameUrl;
    window.EJS_core = String(core);
    window.EJS_pathtodata = "https://cdn.emulatorjs.org/stable/data/";
    window.EJS_language = "en";
    window.EJS_Buttons = {
      fullscreen: true,
    };

    // Create and load the script
    const script = document.createElement("script");
    script.src = EMULATOR_LOADER_SRC;
    script.async = true;
    scriptRef.current = script;

    const handleScriptLoad = () => {
      console.log("GameEmulator: Script loaded, waiting for EJS_emulator to be created...");
      
      // Poll for emulator creation with timeout
      let pollCount = 0;
      const maxPolls = 50; // 5 seconds at 100ms intervals
      
      const pollInterval = setInterval(() => {
        pollCount++;
        
        if (window.EJS_emulator && !emulatorCreatedRef.current) {
          emulatorCreatedRef.current = true;
          clearInterval(pollInterval);
          console.log("GameEmulator: Emulator instance created successfully");
          return;
        }

        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          console.error("GameEmulator: Timeout waiting for emulator instance");
          setHasError(true);
          setErrorMsg("Emulator instance failed to initialize. Try reloading the page.");
          onError?.("Emulator instance failed to initialize");
        }
      }, 100);
    };

    const handleScriptError = () => {
      console.error("GameEmulator: Script failed to load from CDN");
      setHasError(true);
      setErrorMsg("Failed to load emulator from CDN. Check your internet connection.");
      onError?.("Failed to load emulator script");
    };

    script.addEventListener("load", handleScriptLoad);
    script.addEventListener("error", handleScriptError);

    document.body.appendChild(script);

    // Cleanup function
    return () => {
      if (scriptRef.current?.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
      }
      
      try {
        if (window.EJS_emulator?.canvas) {
          window.EJS_emulator.canvas = null;
        }
      } catch {}

      try {
        if (window.EJS_emulator?.destroy) {
          window.EJS_emulator.destroy();
        }
      } catch {}

      window.EJS_emulator = null;
      emulatorCreatedRef.current = false;
    };
  }, [game, romUrl, onError]);

  // Keyboard event handling
  useEffect(() => {
    const container = containerRef.current;
    if (!container || hasError) return;

    const isEmulatorActive = () => {
      const active = document.activeElement;
      if (active && (active === container || container.contains(active))) {
        return true;
      }

      const fullscreenEl = document.fullscreenElement;
      if (fullscreenEl && (container.contains(fullscreenEl) || fullscreenEl.contains(container))) {
        return true;
      }

      return false;
    };

    const handleKeyDown = (event) => {
      if (!scrollKeys.has(event.key)) return;
      if (isEmulatorActive()) {
        event.preventDefault();
      }
    };

    const focusContainer = () => {
      if (document.activeElement !== container) {
        container.focus({ preventScroll: true });
      }
    };

    container.addEventListener("pointerdown", focusContainer);
    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      container.removeEventListener("pointerdown", focusContainer);
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [hasError]);

  if (hasError) {
    return (
      <div
        className="w-full max-w-full overflow-hidden rounded-xl border border-accent-secondary bg-main p-4"
        aria-label="Game emulator error"
      >
        <div className="mx-auto w-full max-w-[640px] overflow-hidden">
          <div className="w-full aspect-[4/3] overflow-hidden rounded-lg bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="text-center text-white">
              <p className="text-sm mb-3 font-semibold">⚠️ Emulator Error</p>
              <p className="text-xs text-gray-200 mb-3">{errorMsg}</p>
              <p className="text-xs text-gray-400 mb-4">
                Troubleshooting steps:
              </p>
              <ul className="text-xs text-gray-400 text-left mb-4 space-y-1 inline-block">
                <li>✓ Close other browser tabs</li>
                <li>✓ Clear browser cache</li>
                <li>✓ Check internet connection</li>
                <li>✓ Try a different browser</li>
              </ul>
              <p className="text-xs text-gray-500 mt-4">
                Still not working? Check the browser console (F12) for errors.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="w-full max-w-full overflow-hidden rounded-xl border border-accent-secondary bg-main p-4 focus:outline-none"
      aria-label="Game emulator"
    >
      <div className="mx-auto w-full max-w-[640px] overflow-hidden">
        <div className="w-full aspect-[4/3] overflow-hidden rounded-lg">
          <div id="game" className="h-full w-full max-w-full overflow-hidden" />
        </div>
      </div>
    </div>
  );
}
