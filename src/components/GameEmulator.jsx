'use client'
import React, { useEffect, useRef } from "react"

export default function GameEmulator({ game, romUrl }) {
  const scriptRef = useRef(null);

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
    window.EJS_fullscreenOnLoaded = true;

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
    };
  }, [game, romUrl]);


  return (
    <div className="bg-main flex justify-center rounded-xl">
      <div style={{ width: "640px", height: "480px", maxWidth: "100%" }}>
        <div id="game"></div>
      </div>
    </div>
  );
}
