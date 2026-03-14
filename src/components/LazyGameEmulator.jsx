"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";

function EmulatorLoading() {
  return (
    <div className="rounded-xl border border-accent-secondary bg-main p-4">
      <div className="w-full max-w-[640px] mx-auto">
        <div className="w-full aspect-[4/3] rounded-lg overflow-hidden">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}

const GameEmulator = dynamic(() => import("@/components/GameEmulator"), {
  ssr: false,
  loading: () => <EmulatorLoading />,
});

export default function LazyGameEmulator({ game, romUrl }) {
  const [enabled, setEnabled] = useState(false);
  const containerRef = useRef(null);

  async function requestMobileFullscreenExperience() {
    if (typeof window === "undefined") return;

    const prefersMobileViewport = window.matchMedia?.("(max-width: 768px)")?.matches;
    const usesCoarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches;
    const isMobile = Boolean(prefersMobileViewport || usesCoarsePointer);

    if (!isMobile) return;

    const target = containerRef.current;
    if (!target) return;

    try {
      if (!document.fullscreenElement && typeof target.requestFullscreen === "function") {
        await target.requestFullscreen();
      }
    } catch {
      // Ignore if browser blocks fullscreen request.
    }

    try {
      if (window.screen?.orientation?.lock) {
        await window.screen.orientation.lock("landscape");
      }
    } catch {
      // Ignore unsupported orientation lock APIs.
    }
  }

  async function handleLoadAndPlay() {
    await requestMobileFullscreenExperience();
    setEnabled(true);
  }

  return (
    <div ref={containerRef}>
      {enabled ? (
        <GameEmulator game={game} romUrl={romUrl} />
      ) : (
        <div className="rounded-xl border border-accent-secondary bg-main p-4">
          <div className="w-full max-w-[640px] mx-auto">
            <div className="w-full aspect-[4/3] rounded-lg overflow-hidden relative">
              <Skeleton className="h-full w-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleLoadAndPlay}
                  className="text-sm bg-accent-gradient py-3 px-6 rounded-xl border border-yellow-400 uppercase touch-manipulation"
                >
                  Load &amp; Play
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Emulator loads on demand to improve performance.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
