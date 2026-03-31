'use client'
import React, { useEffect, useRef, useState } from "react";

const EMULATOR_LOADER_SRC = "https://cdn.emulatorjs.org/stable/data/loader.js";
const scrollKeys = new Set(["ArrowUp", "ArrowDown", "Space"]);
const ONE_MINUTE = 60000;

function resolveGameUrl(game, romUrl) {
  if (romUrl) return romUrl;
  if (!game?.game_url) return null;
  if (/^https?:\/\//i.test(game.game_url)) return game.game_url;
  return `/${game.game_url}`;
}

function isMobileDevice() {
  if (typeof window === "undefined") return false;
  const prefersMobileViewport = window.matchMedia?.("(max-width: 768px)")?.matches;
  const usesCoarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches;
  return Boolean(prefersMobileViewport || usesCoarsePointer);
}

export default function GameEmulator({ game, romUrl, onError }) {
  const loaderLoadedRef = useRef(false);
  const containerRef = useRef(null);
  const timeoutIdRef = useRef(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useRef(false);

  useEffect(() => {
    isMobile.current = isMobileDevice();
  }, []);

  useEffect(() => {
    const gameUrl = resolveGameUrl(game, romUrl);
    const core = game?.categories?.[0]?.core;

    if (!gameUrl || !core) return;

    setHasError(false);
    setIsLoading(true);

    // Configure EmulatorJS before loading the script with mobile optimizations
    window.EJS_player = "#game";
    window.EJS_gameUrl = gameUrl;
    window.EJS_core = String(core);
    window.EJS_pathtodata = "https://cdn.emulatorjs.org/stable/data/";
    window.EJS_language = "en";
    window.EJS_Buttons = {
      fullscreen: !isMobile.current, // Disable fullscreen button on mobile (use requestFullscreen API instead)
    };

    // Mobile-specific optimizations to reduce memory usage
    if (isMobile.current) {
      window.EJS_audioContextType = "webkit";
      window.EJS_gamePadOptions = {
        autoconnect: false,
      };
    }

    // Only load the script once to prevent duplicate declarations
    if (!loaderLoadedRef.current && !document.querySelector(`script[src="${EMULATOR_LOADER_SRC}"]`)) {
      loaderLoadedRef.current = true;
      const script = document.createElement("script");
      script.src = EMULATOR_LOADER_SRC;
      script.async = true;

      // Set a timeout to detect if emulator fails to load on mobile
      const timeoutId = setTimeout(() => {
        if (isLoading && isMobile.current && !window.EJS_emulator) {
          console.error("Emulator failed to load within timeout on mobile device");
          setIsLoading(false);
          setHasError(true);
          onError?.("Emulator loading timeout on mobile. Try closing other tabs and restarting.");
        }
      }, ONE_MINUTE);
      timeoutIdRef.current = timeoutId;

      script.onload = () => {
        clearTimeout(timeoutIdRef.current);
        setIsLoading(false);
        
        // Monitor if emulator actually created successfully
        const checkEmulatorReady = setInterval(() => {
          if (window.EJS_emulator) {
            clearInterval(checkEmulatorReady);
          }
        }, 100);

        setTimeout(() => clearInterval(checkEmulatorReady), 5000);
      };

      script.onerror = () => {
        clearTimeout(timeoutIdRef.current);
        loaderLoadedRef.current = false;
        setIsLoading(false);
        setHasError(true);
        onError?.("Failed to load emulator. Please check your connection.");
      };

      document.body.appendChild(script);
    }

    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }

      try {
        if (window.EJS_emulator && typeof window.EJS_emulator.destroy === "function") {
          window.EJS_emulator.destroy();
        }
      } catch {
        // ignore
      }

      // Force cleanup to help with memory management on mobile
      if (window.EJS_emulator) {
        try {
          if (window.EJS_emulator.canvas) {
            window.EJS_emulator.canvas = null;
          }
          if (window.EJS_emulator.context) {
            window.EJS_emulator.context = null;
          }
        } catch {
          // ignore
        }
        window.EJS_emulator = null;
      }

      loaderLoadedRef.current = false;
    };
  }, [game, romUrl, onError]);

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
          <div className="w-full aspect-[4/3] overflow-hidden rounded-lg bg-gray-900 flex items-center justify-center">
            <div className="text-center text-white px-4">
              <p className="text-sm mb-3">⚠️ Emulator Error</p>
              <p className="text-xs text-gray-300 mb-4">
                The emulator failed to load. This may be due to:
              </p>
              <ul className="text-xs text-gray-400 text-left mb-4 space-y-1">
                <li>• Low device memory</li>
                <li>• Network connectivity issues</li>
                <li>• Browser limitations</li>
              </ul>
              <p className="text-xs text-gray-500">
                Try closing other tabs and refreshing the page.
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
