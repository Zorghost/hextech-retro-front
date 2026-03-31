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
  const [emulatorError, setEmulatorError] = useState(null);
  const containerRef = useRef(null);
  const isLoadingRef = useRef(false);

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

    const prefersMobileViewport = window.matchMedia?.("(max-width: 768px)")?.matches;
    const usesCoarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches;
    const isMobile = Boolean(prefersMobileViewport || usesCoarsePointer);

    if (!isMobile) return;

    const target = containerRef.current;
    if (!target) return;

    try {
      if (!document.fullscreenElement && typeof target.requestFullscreen === "function") {
        await target.requestFullscreen().catch((error) => {
          // Some browsers may deny fullscreen request silently or throw
          console.warn("Fullscreen request denied:", error?.message);
        });
      }
    } catch (error) {
      // Ignore if browser blocks fullscreen request
      console.warn("Fullscreen error:", error?.message);
    }

    // Only attempt orientation lock on browsers that explicitly support it
    // Don't force orientation lock as it can cause issues on some iOS devices
    try {
      if (
        window.screen?.orientation?.lock &&
        /android/i.test(navigator.userAgent) // Only lock on Android where it's more reliable
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
    if (isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    setEmulatorError(null);
    
    try {
      await requestMobileFullscreenExperience();
    } catch (error) {
      console.error("Error preparing fullscreen:", error);
    } finally {
      setEnabled(true);
      isLoadingRef.current = false;
    }
  }

  function handleEmulatorError(errorMessage) {
    console.error("Emulator error:", errorMessage);
    setEmulatorError(errorMessage);
    setEnabled(false);
    isLoadingRef.current = false;
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
      {emulatorError ? (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-600 rounded-lg">
          <p className="text-xs text-red-200 mb-2">
            <strong>Error:</strong> {emulatorError}
          </p>
          <button
            type="button"
            onClick={() => {
              setEmulatorError(null);
              setEnabled(false);
            }}
            className="text-xs text-red-300 hover:text-red-100 underline"
          >
            Try again
          </button>
        </div>
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
                  disabled={isLoadingRef.current}
                  className="text-sm bg-accent-gradient py-3 px-6 rounded-xl border border-yellow-400 uppercase touch-manipulation disabled:opacity-50"
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
