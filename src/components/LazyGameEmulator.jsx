"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
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

function unlockAudioContext() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    ctx.resume().then(() => ctx.close()).catch(() => {});
  } catch (_) {
    // ignore — some browsers don't support AudioContext
  }
}

export default function LazyGameEmulator({ game, romUrl }) {
  const [enabled, setEnabled] = useState(false);

  if (enabled) {
    return <GameEmulator game={game} romUrl={romUrl} />;
  }

  const handleLoad = () => {
    // Unlock AudioContext synchronously within the user-gesture tick so
    // iOS Safari allows EmulatorJS's AudioContext to resume later.
    unlockAudioContext();
    setEnabled(true);
  };

  return (
    <div className="rounded-xl border border-accent-secondary bg-main p-4">
      <div className="w-full max-w-[640px] mx-auto">
        <div className="w-full aspect-[4/3] rounded-lg overflow-hidden relative">
          <Skeleton className="h-full w-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              type="button"
              onClick={handleLoad}
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
  );
}
