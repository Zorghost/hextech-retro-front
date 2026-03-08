"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { getPublicAssetUrl } from "@/lib/assetUrls";

function HeroSliderFallback() {
  return (
    <div className="h-[340px] md:h-[480px] w-full mb-6 rounded-lg border border-accent-secondary bg-main overflow-hidden">
      <div
        className="h-full bg-no-repeat bg-right px-8 md:px-16 lg:p-20 flex items-center"
        style={{ backgroundImage: `url(${getPublicAssetUrl("/slide/slide-1.png")})` }}
      >
          <div className="max-w-3xl">
            <div className="text-accent text-sm mb-2 uppercase">Free Arcade Games</div>
            <h1 className="font-display text-2xl md:text-4xl lg:text-6xl mb-4">
              PLAY RETRO GAMES FOR FREE
            </h1>
            <p className="mb-6 max-w-[418px]">
              Relive the classics! Dive into our collection of retro games and enjoy them for free.
              Start playing now!
            </p>
            <Link
              href="/search?q=mario"
              className="text-sm bg-accent-gradient py-3 px-6 rounded-xl border border-yellow-400 uppercase"
            >
              Play Mario
            </Link>
          </div>
      </div>
    </div>
  );
}

const HeroSliderClient = dynamic(() => import("./HeroSliderClient"), {
  ssr: false,
  loading: () => <HeroSliderFallback />,
});

export default function HeroSlider() {
  return <HeroSliderClient />;
}
