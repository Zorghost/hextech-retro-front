'use client'
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowsPointingOutIcon, XMarkIcon } from "@heroicons/react/24/outline";

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
  const wrapperRef = useRef(null);
  const fullscreenAreaRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [overlayHeight, setOverlayHeight] = useState(null);
  const [overlayBounds, setOverlayBounds] = useState(null);

  const core = useMemo(() => {
    const categoryCore = game?.categories?.[0]?.core;
    return categoryCore ? String(categoryCore) : undefined;
  }, [game]);

  const gameUrl = useMemo(() => romUrl || game?.game_url, [romUrl, game]);

  const fullscreenFrameStyle = useMemo(() => {
    if (!expanded || !overlayBounds?.width || !overlayBounds?.height) {
      return undefined;
    }

    let width = overlayBounds.width;
    let height = Math.floor((width * 3) / 4);

    if (height > overlayBounds.height) {
      height = overlayBounds.height;
      width = Math.floor((height * 4) / 3);
    }

    return {
      width: `${width}px`,
      height: `${height}px`,
    };
  }, [expanded, overlayBounds]);

  const updateOverlayMetrics = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const visualViewport = window.visualViewport;
    const nextHeight = visualViewport ? Math.round(visualViewport.height) : window.innerHeight;
    const areaEl = fullscreenAreaRef.current;

    setOverlayHeight(nextHeight);
    setOverlayBounds(
      areaEl
        ? {
            width: Math.round(areaEl.clientWidth),
            height: Math.round(areaEl.clientHeight),
          }
        : null
    );
  }, []);

  // Attempt native fullscreen; silently fall through to CSS overlay on iOS / unsupported browsers.
  const enterFullscreen = useCallback(() => {
    const el = wrapperRef.current;
    if (el) {
      const req = el.requestFullscreen ?? el.webkitRequestFullscreen?.bind(el);
      req?.().catch(() => {});
    }
    // Always activate the CSS overlay too — harmless on Android where native FS
    // overrides layout anyway, and necessary on iOS where the API is absent.
    setExpanded(true);
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      const exit = document.exitFullscreen ?? document.webkitExitFullscreen?.bind(document);
      exit?.();
    }
    setExpanded(false);
  }, []);

  // Sync state when the user exits native fullscreen via Esc / browser back button.
  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        setExpanded(false);
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, []);

  useEffect(() => {
    if (!expanded) {
      setOverlayHeight(null);
      setOverlayBounds(null);
      return;
    }

    updateOverlayMetrics();

    const visualViewport = window.visualViewport;
    window.addEventListener("resize", updateOverlayMetrics);
    window.addEventListener("orientationchange", updateOverlayMetrics);
    visualViewport?.addEventListener("resize", updateOverlayMetrics);
    visualViewport?.addEventListener("scroll", updateOverlayMetrics);

    return () => {
      window.removeEventListener("resize", updateOverlayMetrics);
      window.removeEventListener("orientationchange", updateOverlayMetrics);
      visualViewport?.removeEventListener("resize", updateOverlayMetrics);
      visualViewport?.removeEventListener("scroll", updateOverlayMetrics);
    };
  }, [expanded, updateOverlayMetrics]);

  useEffect(() => {
    if (!expanded || typeof document === "undefined") {
      return;
    }

    const htmlStyle = document.documentElement.style;
    const bodyStyle = document.body.style;
    const previousHtmlOverflow = htmlStyle.overflow;
    const previousBodyOverflow = bodyStyle.overflow;
    const previousBodyOverscroll = bodyStyle.overscrollBehavior;

    htmlStyle.overflow = "hidden";
    bodyStyle.overflow = "hidden";
    bodyStyle.overscrollBehavior = "contain";

    return () => {
      htmlStyle.overflow = previousHtmlOverflow;
      bodyStyle.overflow = previousBodyOverflow;
      bodyStyle.overscrollBehavior = previousBodyOverscroll;
    };
  }, [expanded]);

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

      // PSP requires threads to function (SharedArrayBuffer + COOP/COEP headers).
      // EmulatorJS supports setting threads via option; provide it in config and on the global as a fallback.
      const shouldUseThreads = core === "psp";
      config.threads = shouldUseThreads;
      try {
        window.EJS_threads = shouldUseThreads;
      } catch {
        // ignore
      }

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
    // wrapperRef is the fullscreen target. When `expanded`, it becomes a fixed overlay
    // that covers the full viewport — this is the CSS fallback for iOS Safari which
    // does not implement the Fullscreen API.
    <div
      ref={wrapperRef}
      className={
        expanded
          ? "fixed inset-0 z-[9999] overflow-hidden bg-black"
          : "rounded-xl border border-accent-secondary bg-main p-4"
      }
      style={
        expanded
          ? {
              height: overlayHeight ? `${overlayHeight}px` : undefined,
              paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)",
              paddingRight: "calc(env(safe-area-inset-right, 0px) + 12px)",
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
              paddingLeft: "calc(env(safe-area-inset-left, 0px) + 12px)",
            }
          : undefined
      }
    >
      {/* Keep #game at the same depth in the tree in both branches so React never
          unmounts / remounts it, which would reset the emulator. */}
      <div
        ref={fullscreenAreaRef}
        className={expanded ? "flex h-full w-full items-center justify-center" : "w-full max-w-[640px] mx-auto"}
      >
        <div
          className={expanded ? "relative overflow-hidden rounded-xl bg-black" : "w-full aspect-[4/3]"}
          style={expanded ? fullscreenFrameStyle : undefined}
        >
          <div id="game" ref={containerRef} className="w-full h-full touch-none" />
        </div>
      </div>

      {/* Exit button floats over the emulator so it never pushes the game area out of view */}
      {expanded ? (
        <button
          type="button"
          onClick={exitFullscreen}
          aria-label="Exit fullscreen"
          className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-xl border border-white/30 bg-black/60 px-3 py-2 text-sm text-white touch-manipulation backdrop-blur-sm hover:bg-black/80 transition"
        >
          <XMarkIcon className="h-4 w-4" aria-hidden="true" />
          Exit fullscreen
        </button>
      ) : (
        <div className="flex justify-end mt-3">
          <button
            type="button"
            onClick={enterFullscreen}
            aria-label="Enter fullscreen"
            className="flex items-center gap-1.5 rounded-xl border border-accent-secondary bg-main/80 px-3 py-2 text-sm text-slate-200 touch-manipulation hover:border-accent hover:text-slate-100 transition"
          >
            <ArrowsPointingOutIcon className="h-4 w-4" aria-hidden="true" />
            Fullscreen
          </button>
        </div>
      )}
    </div>
  );
}