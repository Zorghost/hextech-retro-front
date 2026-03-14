'use client'
import React, { useEffect, useMemo, useRef } from "react";

const EMULATORJS_DATA_PATH = "https://cdn.emulatorjs.org/stable/data/";
const EMULATORJS_SCRIPT_ID = "emulatorjs-runtime";
const EMULATORJS_CSS_ID = "emulatorjs-runtime-css";

let emulatorJsLoadPromise;
let audioTrackingInstalled = false;
const trackedAudioContexts = new Set();

function trackAudioContext(context) {
  if (!context) return context;

  trackedAudioContexts.add(context);

  const forget = () => {
    trackedAudioContexts.delete(context);
  };

  try {
    if (typeof context.addEventListener === "function") {
      context.addEventListener("statechange", () => {
        if (context.state === "closed") {
          forget();
        }
      });
    }
  } catch {
    // ignore
  }

  try {
    if (typeof context.close === "function") {
      const originalClose = context.close.bind(context);
      context.close = (...args) => {
        forget();
        return originalClose(...args);
      };
    }
  } catch {
    // ignore
  }

  return context;
}

function installAudioContextTracking() {
  if (typeof window === "undefined" || audioTrackingInstalled) return;

  const wrapConstructor = (key) => {
    const OriginalCtor = window[key];
    if (typeof OriginalCtor !== "function") return;
    if (OriginalCtor.__ejsTrackedWrapper) return;

    const WrappedCtor = function WrappedAudioContext(...args) {
      return trackAudioContext(new OriginalCtor(...args));
    };

    WrappedCtor.prototype = OriginalCtor.prototype;
    Object.setPrototypeOf(WrappedCtor, OriginalCtor);
    WrappedCtor.__ejsTrackedWrapper = true;
    WrappedCtor.__ejsOriginal = OriginalCtor;

    window[key] = WrappedCtor;
  };

  wrapConstructor("AudioContext");
  wrapConstructor("webkitAudioContext");
  audioTrackingInstalled = true;
}

function resumeTrackedAudioContexts() {
  trackedAudioContexts.forEach((context) => {
    if (context?.state === "suspended" && typeof context.resume === "function") {
      Promise.resolve(context.resume()).catch(() => {});
    }
  });
}

function tryResumeEmulatorAudioContexts(emulatorInstance) {
  try {
    resumeTrackedAudioContexts();

    const base = emulatorInstance || window?.EJS_emulator;
    const currentContext = base?.Module?.AL?.currentCtx;
    if (currentContext?.state === "suspended" && typeof currentContext.resume === "function") {
      Promise.resolve(currentContext.resume()).catch(() => {});
    }

    const sources = currentContext?.sources;
    if (Array.isArray(sources)) {
      sources.forEach((source) => {
        const context = source?.gain?.context;
        if (context?.state === "suspended" && typeof context.resume === "function") {
          Promise.resolve(context.resume()).catch(() => {});
        }
      });
    }

    if (currentContext?.state === "running") {
      return true;
    }

    if (Array.isArray(sources)) {
      return sources.some((source) => source?.gain?.context?.state === "running");
    }
  } catch {
    // ignore
  }

  return false;
}

function patchEmulatorJsMobileSafariResumeFlow() {
  if (typeof window === "undefined") return;

  const EmulatorCtor = window.EmulatorJS;
  const proto = EmulatorCtor?.prototype;
  if (!proto || proto.__hextechMobileSafariPatched) return;

  const originalCheckStarted = proto.checkStarted;

  proto.checkStarted = function patchedCheckStarted(...args) {
    if (!this?.isSafari || !this?.isMobile) {
      if (typeof originalCheckStarted === "function") {
        return originalCheckStarted.apply(this, args);
      }
      return;
    }

    const tryResume = () => {
      const resumed = tryResumeEmulatorAudioContexts(this);
      if (resumed) {
        if (typeof this.closePopup === "function") {
          this.closePopup();
        }
        return true;
      }

      return false;
    };

    let attempts = 0;
    const maxAttempts = 120;

    const tick = () => {
      if (tryResume()) return;

      attempts += 1;
      if (attempts < maxAttempts) {
        setTimeout(tick, 100);
      }
    };

    setTimeout(tick, 50);
  };

  proto.__hextechMobileSafariPatched = true;
}

function unlockAudioContextForGesture() {
  if (typeof window === "undefined") return;

  installAudioContextTracking();

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    Promise.resolve(ctx.resume())
      .catch(() => {})
      .finally(() => {
        Promise.resolve(ctx.close?.()).catch(() => {});
      });
  } catch {
    // ignore
  }

  tryResumeEmulatorAudioContexts();
}

function ensureEmulatorJsLoaded() {
  if (typeof window === "undefined") return Promise.resolve();
  installAudioContextTracking();
  if (typeof window.EmulatorJS === "function") {
    patchEmulatorJsMobileSafariResumeFlow();
    return Promise.resolve();
  }

  if (emulatorJsLoadPromise) return emulatorJsLoadPromise;

  emulatorJsLoadPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(EMULATORJS_SCRIPT_ID);
    if (existingScript) {
      const waitForRuntime = () => {
        if (typeof window.EmulatorJS === "function") {
          patchEmulatorJsMobileSafariResumeFlow();
          resolve();
        }
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
    script.onload = () => {
      patchEmulatorJsMobileSafariResumeFlow();
      resolve();
    };
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

    const handleGesture = () => {
      unlockAudioContextForGesture();
    };

    document.addEventListener("touchstart", handleGesture, true);
    document.addEventListener("pointerdown", handleGesture, true);
    document.addEventListener("click", handleGesture, true);

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
        startOnLoad: true,
        softLoad: 0,
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
      document.removeEventListener("touchstart", handleGesture, true);
      document.removeEventListener("pointerdown", handleGesture, true);
      document.removeEventListener("click", handleGesture, true);
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
      <div className="mx-auto w-full max-w-[640px]">
        <div className="w-full aspect-[4/3]">
          <div id="game" ref={containerRef} className="w-full h-full touch-none" />
        </div>
      </div>
    </div>
  );
}