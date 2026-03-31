'use client'
import React, { useEffect, useRef, useState } from "react";

const EMULATOR_LOADER_SRC = "https://cdn.emulatorjs.org/stable/data/loader.js";
const EMULATOR_LOADER_BACKUP = "https://cdn.jsdelivr.net/npm/emulatorjs@latest/dist/loader.js";
const scrollKeys = new Set(["ArrowUp", "ArrowDown", "Space"]);

// Mobile detection
function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  const prefersMobileViewport = window.matchMedia?.("(max-width: 768px)")?.matches;
  const usesCoarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches;
  return Boolean(prefersMobileViewport || usesCoarsePointer);
}

// Check available memory (returns in MB)
function getAvailableMemory() {
  if (typeof window === 'undefined' || !navigator.deviceMemory) return null;
  const totalMemory = navigator.deviceMemory; // in GB (4, 6, 8, etc.)
  return totalMemory * 1024; // Convert to MB
}

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
  const [loadingState, setLoadingState] = useState("initializing"); // initializing, loading, loaded, error

  // Main emulator initialization effect
  useEffect(() => {
    const gameUrl = resolveGameUrl(game, romUrl);
    const core = game?.categories?.[0]?.core;
    const isMobile = isMobileDevice();

    if (!gameUrl || !core) {
      console.log("GameEmulator: Missing gameUrl or core", { gameUrl, core });
      return;
    }

    // Reset error state
    setHasError(false);
    setErrorMsg("");
    setLoadingState("loading");

    // Check memory availability on mobile
    if (isMobile) {
      const availableMemory = getAvailableMemory();
      if (availableMemory && availableMemory < 1024) { // Less than 1GB
        console.warn("GameEmulator: Low device memory detected", { availableMemory });
      }
    }

    // Clean up any previous script and emulator
    const cleanup = () => {
      if (scriptRef.current?.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
        scriptRef.current = null;
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

    cleanup();

    // Set up emulator configuration with mobile optimizations
    window.EJS_player = "#game";
    window.EJS_gameUrl = gameUrl;
    window.EJS_core = String(core);
    window.EJS_pathtodata = "https://cdn.emulatorjs.org/stable/data/";
    window.EJS_language = "en";
    window.EJS_Buttons = {
      fullscreen: true,
    };

    // Mobile-specific configuration
    if (isMobile) {
      window.EJS_mobileControls = true;
      window.EJS_buttons = ["start", "save", "load", "restart"];
    }

    // Create and load the script with fallback
    const script = document.createElement("script");
    script.async = true;
    scriptRef.current = script;

    let scriptSrc = EMULATOR_LOADER_SRC;
    let retryCount = 0;
    const maxRetries = 1;

    const handleScriptLoad = () => {
      console.log("GameEmulator: Script loaded, waiting for EJS_emulator to be created...");
      setLoadingState("loaded");
      
      // Poll for emulator creation with extended timeout for mobile
      let pollCount = 0;
      const timeoutMs = isMobile ? 10000 : 5000; // 10 seconds for mobile, 5 for desktop
      const maxPolls = Math.ceil(timeoutMs / 100);
      
      const pollInterval = setInterval(() => {
        pollCount++;
        
        if (window.EJS_emulator && !emulatorCreatedRef.current) {
          emulatorCreatedRef.current = true;
          clearInterval(pollInterval);
          console.log("GameEmulator: Emulator instance created successfully");
          setLoadingState("running");
          return;
        }

        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          console.error("GameEmulator: Timeout waiting for emulator instance", { 
            pollCount, 
            maxPolls,
            hasEJSEmulator: !!window.EJS_emulator,
            isMobile
          });
          setHasError(true);
          setErrorMsg("Game emulator took too long to load. Reloading...");
          onError?.("Emulator initialization timeout");
          
          // Auto-reload for mobile after a short delay
          if (isMobile) {
            setTimeout(() => window.location.reload(), 2000);
          }
        }
      }, 100);
    };

    const handleScriptError = () => {
      console.error("GameEmulator: Script failed to load from", scriptSrc);
      
      // Try fallback CDN on first error
      if (retryCount < maxRetries && scriptSrc === EMULATOR_LOADER_SRC) {
        retryCount++;
        console.log("GameEmulator: Attempting fallback CDN...");
        script.removeEventListener("load", handleScriptLoad);
        script.removeEventListener("error", handleScriptError);
        script.src = EMULATOR_LOADER_BACKUP;
        scriptSrc = EMULATOR_LOADER_BACKUP;
        script.addEventListener("load", handleScriptLoad);
        script.addEventListener("error", handleScriptError);
        document.body.appendChild(script);
        return;
      }

      setHasError(true);
      setErrorMsg(
        isMobile 
          ? "Failed to load emulator. Try: 1) Reload page, 2) Clear browser cache, 3) Use WiFi instead of mobile data"
          : "Failed to load emulator from CDN. Check your internet connection."
      );
      onError?.("Failed to load emulator script");
    };

    script.addEventListener("load", handleScriptLoad);
    script.addEventListener("error", handleScriptError);

    document.body.appendChild(script);

    // Add memory pressure listener for mobile devices
    const handleMemoryPressure = () => {
      console.warn("GameEmulator: Memory pressure detected");
      if (window.EJS_emulator?.pause) {
        try {
          window.EJS_emulator.pause();
        } catch (e) {
          console.warn("Could not pause emulator:", e);
        }
      }
    };

    if ('onstorage' in window && isMobile) {
      // Some browsers fire storage events under memory pressure
      window.addEventListener('storage', handleMemoryPressure);
    }

    // Cleanup function
    return () => {
      clearTimeout && clearTimeout(0); // Clear any pending timeouts
      
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
      
      if ('onstorage' in window && isMobile) {
        window.removeEventListener('storage', handleMemoryPressure);
      }
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
    const isMobile = isMobileDevice();
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
                {isMobile ? (
                  <>
                    <li>✓ Close other browser tabs/apps</li>
                    <li>✓ Kill other background apps</li>
                    <li>✓ Clear browser cache (Settings → Storage)</li>
                    <li>✓ Use WiFi (faster & more stable)</li>
                    <li>✓ Try portrait mode</li>
                    <li>✓ Restart your phone</li>
                    <li className="mt-2">If still failing:</li>
                    <li>✓ Try Safari or Firefox (if using Chrome)</li>
                    <li>✓ Reduce video quality if available</li>
                  </>
                ) : (
                  <>
                    <li>✓ Close other browser tabs</li>
                    <li>✓ Clear browser cache</li>
                    <li>✓ Check internet connection</li>
                    <li>✓ Try a different browser</li>
                  </>
                )}
              </ul>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 bg-accent-gradient text-white px-4 py-2 rounded uppercase text-xs font-bold hover:opacity-90 transition-opacity"
              >
                Reload Page
              </button>
              <p className="text-xs text-gray-500 mt-4">
                Check the browser console (F12) for detailed error logs.
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
