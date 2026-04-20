'use client'
import React, { useEffect, useRef, useState } from "react"

export default function GameEmulator({ game, romUrl }) {
  const scriptRef = useRef(null);
  const [isCompactViewport, setIsCompactViewport] = useState(false);

  useEffect(() => {
    const updateViewportMode = () => {
      const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
      const narrowScreen = window.matchMedia("(max-width: 767px)").matches;
      const touchDevice = typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;

      setIsCompactViewport(Boolean((coarsePointer || touchDevice) && narrowScreen));
    };

    updateViewportMode();
    window.addEventListener("resize", updateViewportMode);
    window.addEventListener("orientationchange", updateViewportMode);

    return () => {
      window.removeEventListener("resize", updateViewportMode);
      window.removeEventListener("orientationchange", updateViewportMode);
    };
  }, []);

  useEffect(() => {
    // Resolve game URL - use romUrl if provided, otherwise use game.game_url
    const gameUrl = romUrl || (game?.game_url ? `/${game.game_url}` : null);
    const core = game?.categories?.[0]?.core;

    if (!gameUrl || !core) {
      console.error("GameEmulator: Missing gameUrl or core");
      return;
    }

    window.EJS_player = "#game";
    window.EJS_gameUrl = gameUrl;
    window.EJS_core = String(core);
    window.EJS_pathtodata = "https://cdn.emulatorjs.org/stable/data/";
    if (isCompactViewport) {
      window.EJS_browserMode = "mobile";
    } else {
      delete window.EJS_browserMode;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.emulatorjs.org/stable/data/loader.js";
    script.async = true;
    scriptRef.current = script;
    document.body.appendChild(script);

    // Cleanup function
    return () => {
      try {
        // Pause the emulator first if it exists
        if (window.EJS_emulator?.pause) {
          window.EJS_emulator.pause();
        }
      } catch (err) {
        console.warn("Error pausing emulator:", err);
      }

      try {
        // Try to stop all audio contexts
        if (window.EJS_emulator?.canvas) {
          window.EJS_emulator.canvas = null;
        }
      } catch (err) {
        console.warn("Error clearing canvas:", err);
      }

      try {
        // Destroy the emulator instance
        if (window.EJS_emulator?.destroy) {
          window.EJS_emulator.destroy();
        }
      } catch (err) {
        console.warn("Error destroying emulator:", err);
      }

      // Stop all audio elements to ensure no background sound
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });

      // Remove the script tag from the DOM
      if (scriptRef.current?.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
        scriptRef.current = null;
      }

      // Clear the emulator from window
      window.EJS_emulator = null;
      delete window.EJS_browserMode;
    };
  }, [game, romUrl, isCompactViewport]);


  return (
    <div className="bg-main flex justify-center overflow-hidden rounded-xl">
      <div
        className="w-full"
        style={{
          maxWidth: isCompactViewport ? "360px" : "640px",
          aspectRatio: "4 / 3",
        }}
      >
        <div id="game" className="h-full w-full"></div>
      </div>
    </div>
  );
}
