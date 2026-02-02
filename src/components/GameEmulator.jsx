'use client'
import React, { useEffect, useMemo, useRef } from "react";

const EMULATORJS_DATA_PATH = "https://cdn.emulatorjs.org/stable/data/";
const EMULATORJS_SCRIPT_ID = "emulatorjs-runtime";
const EMULATORJS_CSS_ID = "emulatorjs-runtime-css";

let emulatorJsLoadPromise;

function ensureEmulatorJsLoaded() {
  if (typeof window === "undefined") return Promise.resolve();
  if (typeof window.EmulatorJS === "function") return Promise.resolve();

  if (emulatorJsLoadPromise) return emulatorJsLoadPromise;

  emulatorJsLoadPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(EMULATORJS_SCRIPT_ID);
    if (existingScript) {
      const waitForRuntime = () => {
        if (typeof window.EmulatorJS === "function") resolve();
        else setTimeout(waitForRuntime, 25);
      };
      waitForRuntime();
      return;
    }

    if (!document.getElementById(EMULATORJS_CSS_ID)) {
      const link = document.createElement("link");
      link.id = EMULATORJS_CSS_ID;
      link.rel = "stylesheet";
      link.href = `${EMULATORJS_DATA_PATH}emulator.min.css`;
      document.head.appendChild(link);
    }

    const script = document.createElement("script");
    script.id = EMULATORJS_SCRIPT_ID;
    script.src = `${EMULATORJS_DATA_PATH}emulator.min.js`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load EmulatorJS runtime"));
    document.head.appendChild(script);
  });

  return emulatorJsLoadPromise;
}

function cleanupRuntimeIfRequested() {
  const script = document.getElementById(EMULATORJS_SCRIPT_ID);
  if (script) script.remove();

  const css = document.getElementById(EMULATORJS_CSS_ID);
  if (css) css.remove();

  emulatorJsLoadPromise = undefined;
}

export default function GameEmulator({ game, romUrl, cleanupScriptsOnUnmount = false }) {
  const containerRef = useRef(null);
  const emulatorRef = useRef(null);

  const core = useMemo(() => {
    const categoryCore = game?.categories?.[0]?.core;
    return categoryCore ? String(categoryCore) : undefined;
  }, [game]);

  const gameUrl = useMemo(() => romUrl || game?.game_url, [romUrl, game]);

  useEffect(() => {
    let cancelled = false;
    const containerEl = containerRef.current;

    const destroyExisting = () => {
      const emulator = emulatorRef.current;
      emulatorRef.current = null;

      if (emulator && typeof emulator.destroy === "function") {
        try {
          emulator.destroy();
        } catch {
          // Best-effort cleanup; EmulatorJS doesn't always expose destroy.
        }
      }
      if (containerEl) containerEl.innerHTML = "";
      if (window?.EJS_emulator) window.EJS_emulator = null;
    };

    const init = async () => {
      if (!containerEl) return;
      if (!gameUrl || !core) return;

      destroyExisting();

      try {
        await ensureEmulatorJsLoaded();
      } catch {
        return;
      }
      if (cancelled) return;

      if (typeof window.EmulatorJS !== "function") return;

      const config = {
        gameUrl,
        dataPath: EMULATORJS_DATA_PATH,
        system: core,
      };

      try {
        const emulator = new window.EmulatorJS("#game", config);
        emulatorRef.current = emulator;
        window.EJS_emulator = emulator;
      } catch {
        // If initialization fails, leave container empty.
      }
    };

    init();

    return () => {
      cancelled = true;
      try {
        if (emulatorRef.current && typeof emulatorRef.current.destroy === "function") {
          emulatorRef.current.destroy();
        }
      } catch {
        // ignore
      }
      emulatorRef.current = null;
      if (containerEl) containerEl.innerHTML = "";
      if (cleanupScriptsOnUnmount) cleanupRuntimeIfRequested();
    };
  }, [core, gameUrl, cleanupScriptsOnUnmount]);

  return (
    <div className="rounded-xl border border-accent-secondary bg-main p-4">
      <div className="w-full max-w-[640px] mx-auto">
        <div className="w-full aspect-[4/3]">
          <div id="game" ref={containerRef} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}