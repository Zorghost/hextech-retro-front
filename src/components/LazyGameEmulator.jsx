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
  const [lowMemoryWarning, setLowMemoryWarning] = useState(false);
  const containerRef = useRef(null);
  const loadTimeoutRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersMobileViewport = window.matchMedia?.("(max-width: 768px)")?.matches;
    const usesCoarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches;
    const isMobile = Boolean(prefersMobileViewport || usesCoarsePointer);
    setIsMobileDevice(isMobile);

    // Check device memory on mobile
    if (isMobile && navigator.deviceMemory) {
      const deviceMemory = navigator.deviceMemory; // In GB
      setLowMemoryWarning(deviceMemory < 4);
      console.log("Device memory:", deviceMemory, "GB");
    }

    const fullscreenTarget = containerRef.current;
    const canRequestFullscreen = Boolean(
      fullscreenTarget && typeof fullscreenTarget.requestFullscreen === "function"
    );

    setShowMobileFullscreenButton(isMobile && canRequestFullscreen);

    // Cleanup timeout on unmount
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, []);

  async function requestMobileFullscreenExperience() {
    if (typeof window === "undefined") return;

    const target = containerRef.current;
    if (!target) return;

    try {
      // Only attempt fullscreen if not already in fullscreen
      if (!document.fullscreenElement && typeof target.requestFullscreen === "function") {
        await target.requestFullscreen().catch((error) => {
          console.warn("Fullscreen request denied:", error?.message);
          // Fullscreen might be denied on some browsers, but that's ok
        });
      }
    } catch (error) {
      console.warn("Fullscreen error:", error?.message);
    }

    // Orientation lock - Android specific
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

    // iOS specific: Disable auto-zoom on input (helps prevent unwanted zoom during gameplay)
    try {
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport && /iphone|ipad|ipod/i.test(navigator.userAgent)) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
      }
    } catch (e) {
      console.warn("Could not update viewport:", e);
    }
  }

  async function handleLoadAndPlay() {
    try {
      setEnabled(true); // Enable emulator first
      
      // Request fullscreen experience for mobile with a small delay to ensure DOM is ready
      if (isMobileDevice) {
        await new Promise(resolve => setTimeout(resolve, 500));
        await requestMobileFullscreenExperience();
      }
    } catch (error) {
      console.error("Error preparing fullscreen:", error);
      // Still enable the emulator even if fullscreen/orientation lock fails
      setEnabled(true);
    }
  }

  function handleEmulatorError(errorMessage) {
    console.error("LazyGameEmulator: Emulator error:", errorMessage);
    // Error is displayed in GameEmulator component
  }

  return (
    <div ref={containerRef}>
      {lowMemoryWarning && !enabled && (
        <div className="mb-3 p-2 bg-yellow-900/30 border border-yellow-600 rounded-lg text-xs text-yellow-200">
          ⚠️ Your device has limited memory. Close other apps for better performance.
        </div>
      )}
      {enabled && showMobileFullscreenButton ? (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={requestMobileFullscreenExperience}
            className="text-xs bg-accent-gradient py-2 px-3 rounded-lg border border-yellow-400 uppercase touch-manipulation hover:opacity-90 transition-opacity"
            aria-label="Toggle fullscreen"
          >
            Fullscreen
          </button>
        </div>
      ) : null}
      {enabled && isMobileDevice && !showMobileFullscreenButton ? (
        <p className="mb-3 text-xs text-gray-400 text-right">
          Fullscreen is not supported on this browser. Rotate your device for better gameplay.
        </p>
      ) : null}
      {enabled ? (
        <GameEmulator game={game} romUrl={romUrl} onError={handleEmulatorError} />
      ) : (
        <div className="w-full max-w-full overflow-hidden rounded-xl border border-accent-secondary bg-main p-4">
          <div className="mx-auto w-full max-w-[640px] overflow-hidden">
            <div className="relative w-full aspect-[4/3] overflow-hidden rounded-lg">
              <Skeleton className="h-full w-full" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadAndPlay}
                  className="text-sm bg-accent-gradient py-3 px-6 rounded-xl border border-yellow-400 uppercase touch-manipulation hover:opacity-90 transition-opacity font-bold"
                >
                  Load &amp; Play
                </button>
                {isMobileDevice && (
                  <p className="text-xs text-gray-400 text-center px-2">
                    Rotate to landscape for best experience
                  </p>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              {isMobileDevice 
                ? "Emulator loads on demand. Best on WiFi with other apps closed."
                : "Emulator loads on demand to improve performance."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
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
