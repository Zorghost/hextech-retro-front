"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";

function EmulatorLoading() {
  return (
    <div className="w-full max-w-full overflow-hidden rounded-xl border border-accent-secondary bg-main p-4">
      <div className="mx-auto w-full max-w-[640px] overflow-hidden">
        <div className="w-full aspect-[4/3] overflow-hidden rounded-lg">
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
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [showMobileFullscreenButton, setShowMobileFullscreenButton] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersMobileViewport = window.matchMedia?.("(max-width: 768px)")?.matches;
    const usesCoarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches;
    const isMobile = Boolean(prefersMobileViewport || usesCoarsePointer);
    setIsMobileDevice(isMobile);

    const fullscreenTarget = containerRef.current;
    const canRequestFullscreen = Boolean(
      fullscreenTarget && typeof fullscreenTarget.requestFullscreen === "function"
    );

    setShowMobileFullscreenButton(isMobile && canRequestFullscreen);
  }, []);

  async function requestMobileFullscreenExperience() {
    if (typeof window === "undefined") return;

    const target = containerRef.current;
    if (!target) return;

    try {
      if (!document.fullscreenElement && typeof target.requestFullscreen === "function") {
        await target.requestFullscreen().catch((error) => {
          console.warn("Fullscreen request denied:", error?.message);
        });
      }
    } catch (error) {
      console.warn("Fullscreen error:", error?.message);
    }

    // Only attempt orientation lock on Android
    try {
      if (
        window.screen?.orientation?.lock &&
        /android/i.test(navigator.userAgent)
      ) {
        await window.screen.orientation.lock("landscape").catch(() => {
          // Silently fail if orientation lock is not supported
        });
      }
    } catch {
      // Ignore unsupported orientation lock APIs
    }
  }

  async function handleLoadAndPlay() {
    try {
      await requestMobileFullscreenExperience();
    } catch (error) {
      console.error("Error preparing fullscreen:", error);
    }
    setEnabled(true);
  }

  function handleEmulatorError(errorMessage) {
    console.error("LazyGameEmulator: Emulator error:", errorMessage);
    // Error is displayed in GameEmulator component
  }

  return (
    <div ref={containerRef}>
      {enabled && showMobileFullscreenButton ? (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={requestMobileFullscreenExperience}
            className="text-xs bg-accent-gradient py-2 px-3 rounded-lg border border-yellow-400 uppercase touch-manipulation"
            aria-label="Toggle fullscreen"
          >
            Fullscreen
          </button>
        </div>
      ) : null}
      {enabled && isMobileDevice && !showMobileFullscreenButton ? (
        <p className="mb-3 text-xs text-gray-400 text-right">
          Fullscreen is not supported on this browser.
        </p>
      ) : null}
      {enabled ? (
        <GameEmulator game={game} romUrl={romUrl} onError={handleEmulatorError} />
      ) : (
        <div className="w-full max-w-full overflow-hidden rounded-xl border border-accent-secondary bg-main p-4">
          <div className="mx-auto w-full max-w-[640px] overflow-hidden">
            <div className="relative w-full aspect-[4/3] overflow-hidden rounded-lg">
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
