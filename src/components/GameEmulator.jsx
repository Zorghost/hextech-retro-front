'use client'
import React, { useEffect, useRef, useState } from "react";

const EMULATOR_SCRIPT_SRC = "https://cdn.emulatorjs.org/stable/data/loader.js";
const EMULATOR_TIMEOUT_MS = 20000;

function detectMobileEnvironment() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return Boolean(
    navigator.maxTouchPoints > 0 ||
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
  );
}

function detectLegacyBrowser() {
  if (typeof navigator === "undefined") {
    return false;
  }

  const ua = navigator.userAgent;
  return /MSIE|Trident|SamsungBrowser/i.test(ua) || !window?.matchMedia?.("(prefers-reduced-motion: no-preference)");
}

export default function GameEmulator({ game, romUrl }) {
  const core = game?.categories?.[0]?.core;
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isLegacyBrowser, setIsLegacyBrowser] = useState(false);
  const timeoutRef = useRef(null);
  const scriptRef = useRef(null);
  const statusRef = useRef("idle");

  const clearTimeoutRef = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    setIsMobile(detectMobileEnvironment());
    setIsLegacyBrowser(detectLegacyBrowser());
  }, []);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (!romUrl) {
      setStatus("error");
      setErrorMessage("This ROM could not be loaded. The file may be missing or unavailable.");
      clearTimeoutRef();
      return undefined;
    }

    const loadEmulator = () => {
      clearTimeoutRef();
      setErrorMessage("");
      setStatus("loading");

      if (typeof window === "undefined") {
        return;
      }

      const gameElement = document.getElementById("game");
      if (gameElement) {
        gameElement.innerHTML = "";
      }

      const pollUntilReady = () => {
        const container = document.getElementById("game");
        const hasEmulatorContent = !!container?.querySelector("canvas, iframe, video, .ejs_screen");

        if (hasEmulatorContent) {
          setStatus("ready");
          statusRef.current = "ready";
          clearTimeoutRef();
          return;
        }

        if (statusRef.current === "loading") {
          timeoutRef.current = window.setTimeout(pollUntilReady, 250);
        }
      };

      window.EJS_player = "#game";
      window.EJS_gameUrl = romUrl;
      window.EJS_core = core ? String(core) : "";
      window.EJS_pathtodata = "https://cdn.emulatorjs.org/stable/data/";

      if (scriptRef.current) {
        scriptRef.current.remove();
        scriptRef.current = null;
      }

      const script = document.createElement("script");
      script.src = EMULATOR_SCRIPT_SRC;
      script.async = true;
      script.onload = () => {
        timeoutRef.current = window.setTimeout(() => {
          if (statusRef.current === "loading") {
            setStatus("error");
            statusRef.current = "error";
            setErrorMessage("The emulator took too long to start this ROM. Please retry or try another browser.");
          }
        }, EMULATOR_TIMEOUT_MS);

        pollUntilReady();
      };
      script.onerror = () => {
        setStatus("error");
        statusRef.current = "error";
        setErrorMessage("The emulator script failed to load. This is usually caused by a temporary network issue or an unsupported ROM format.");
        clearTimeoutRef();
      };

      scriptRef.current = script;
      document.body.appendChild(script);
    };

    loadEmulator();

    return () => {
      clearTimeoutRef();
      if (scriptRef.current) {
        scriptRef.current.remove();
        scriptRef.current = null;
      }
    };
  }, [core, romUrl]);

  const handleRetry = () => {
    setStatus("idle");
    statusRef.current = "idle";
    setErrorMessage("");
    clearTimeoutRef();

    if (romUrl) {
      const script = document.createElement("script");
      script.src = EMULATOR_SCRIPT_SRC;
      script.async = true;
      script.onload = () => {
        const gameElement = document.getElementById("game");
        if (gameElement) {
          gameElement.innerHTML = "";
        }
        setStatus("loading");
        statusRef.current = "loading";
        window.EJS_player = "#game";
        window.EJS_gameUrl = romUrl;
        window.EJS_core = core ? String(core) : "";
        window.EJS_pathtodata = "https://cdn.emulatorjs.org/stable/data/";

        timeoutRef.current = window.setTimeout(() => {
          if (statusRef.current === "loading") {
            setStatus("error");
            statusRef.current = "error";
            setErrorMessage("The emulator took too long to start this ROM. Please retry or try another browser.");
          }
        }, EMULATOR_TIMEOUT_MS);
      };
      script.onerror = () => {
        setStatus("error");
        statusRef.current = "error";
        setErrorMessage("The emulator script failed to load. This is usually caused by a temporary network issue or an unsupported ROM format.");
      };

      if (scriptRef.current) {
        scriptRef.current.remove();
      }
      scriptRef.current = script;
      document.body.appendChild(script);
    }
  };

  const showWarning = isMobile || isLegacyBrowser;

  return (
    <div className="bg-main flex justify-center rounded-xl">
      <div className="relative w-full max-w-[640px] overflow-hidden rounded-xl border border-accent-secondary bg-primary/70" style={{ height: "480px" }}>
        {status === "loading" && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 text-center text-slate-200">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent-secondary border-t-accent" aria-label="Loading emulator" />
              <div className="space-y-1">
                <p className="text-base font-medium text-slate-100">Loading emulator…</p>
                <p className="text-sm text-slate-300">Preparing your game and controller mapping.</p>
              </div>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/90 p-6 text-center">
            <div className="max-w-md space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-300">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Game could not start</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{errorMessage || "The ROM file may be missing, blocked, or incompatible with the current emulator setup."}</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex items-center justify-center rounded-full border border-accent bg-accent-secondary px-4 py-2 text-sm font-medium text-white transition hover:border-accent hover:bg-primary"
                >
                  Retry load
                </button>
              </div>
            </div>
          </div>
        )}

        {showWarning && !errorMessage && status !== "ready" && (
          <div className="absolute right-3 top-3 z-10 max-w-[220px] rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-left text-[11px] leading-5 text-amber-100">
            {isMobile
              ? "Touch controls appear automatically on mobile. Rotate to landscape for the best experience."
              : "Some older browsers may have trouble with emulator audio and input. Try a modern Chromium or Safari build."}
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30" style={{ zIndex: status === "loading" ? 1 : 0 }}>
          <div id="game" className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}
