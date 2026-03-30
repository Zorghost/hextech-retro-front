'use client'
import React, { useEffect, useRef } from "react";

const EMULATOR_LOADER_SRC = "https://cdn.emulatorjs.org/stable/data/loader.js";

function resolveGameUrl(game, romUrl) {
  if (romUrl) return romUrl;
  if (!game?.game_url) return null;
  if (/^https?:\/\//i.test(game.game_url)) return game.game_url;
  return `/${game.game_url}`;
}

export default function GameEmulator({ game, romUrl }) {
  const containerRef = useRef(null);
  const loaderLoadedRef = useRef(false);

  useEffect(() => {
    const gameUrl = resolveGameUrl(game, romUrl);
    const core = game?.categories?.[0]?.core;

    if (!gameUrl || !core) return;

    // Configure EmulatorJS before loading the script
    window.EJS_player = "#game";
    window.EJS_gameUrl = gameUrl;
    window.EJS_core = String(core);
    window.EJS_pathtodata = "https://cdn.emulatorjs.org/stable/data/";
    window.EJS_language = "en"; // Set fallback language to prevent en-GB errors
    window.EJS_Buttons = {
      fullscreen: true,
    };

    // Only load the script once to prevent duplicate declarations
    if (!loaderLoadedRef.current && !document.querySelector(`script[src="${EMULATOR_LOADER_SRC}"]`)) {
      loaderLoadedRef.current = true;
      const script = document.createElement("script");
      script.src = EMULATOR_LOADER_SRC;
      script.async = true;
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

    const scrollKeys = new Set([
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      " ",
      "PageUp",
      "PageDown",
      "Home",
      "End",
    ]);

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
      className="rounded-xl border border-accent-secondary bg-main p-4 focus:outline-none"
      aria-label="Game emulator"
    >
      <div className="mx-auto w-full max-w-[640px]">
        <div className="w-full aspect-[4/3]">
          <div id="game" className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}
