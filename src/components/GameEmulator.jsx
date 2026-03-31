'use client'
import React, { useEffect, useRef } from "react";

const EMULATOR_LOADER_SRC = "https://cdn.emulatorjs.org/stable/data/loader.js";
const scrollKeys = new Set(["ArrowUp", "ArrowDown", "Space"]);

function resolveGameUrl(game, romUrl) {
  if (romUrl) return romUrl;
  if (!game?.game_url) return null;
  if (/^https?:\/\//i.test(game.game_url)) return game.game_url;
  return `/${game.game_url}`;
}

export default function GameEmulator({ game, romUrl }) {
  const loaderLoadedRef = useRef(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const gameUrl = resolveGameUrl(game, romUrl);
    const core = game?.categories?.[0]?.core;

    if (!gameUrl || !core) return;
    // Configure EmulatorJS before loading the script
    window.EJS_player = "#game";
    window.EJS_gameUrl = gameUrl;
    window.EJS_core = String(core);
    window.EJS_pathtodata = "https://cdn.emulatorjs.org/stable/data/";
    window.EJS_language = "en"; // Use base English to avoid en-GB, en-US localization 404 errors
    window.EJS_Buttons = {
      fullscreen: true,
    };

    // Only load the script once to prevent duplicate declarations
    if (!loaderLoadedRef.current && !document.querySelector(`script[src="${EMULATOR_LOADER_SRC}"]`)) {
      loaderLoadedRef.current = true;
      const script = document.createElement("script");
      script.src = EMULATOR_LOADER_SRC;
      script.async = true;
      // Suppress errors from missing CDN resources
      script.onerror = () => {
        loaderLoadedRef.current = false;
      };
      document.body.appendChild(script);
    }

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
      // Reset the loader ref when changing games to allow reinitializing
      loaderLoadedRef.current = false;
    };
  }, [game, romUrl]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

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
  }, []);

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
