"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Scrollbar, A11y, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import Image from "next/image";
import { getPublicAssetUrl } from "@/lib/assetUrls";

export default function HeroSliderClient() {
  return (
    <div>
      <Swiper
        modules={[Navigation, Pagination, Scrollbar, A11y, Autoplay]}
        spaceBetween={50}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        scrollbar={{ draggable: true }}
        autoplay={{ delay: 6000, disableOnInteraction: false, pauseOnMouseEnter: true }}
        loop
        className="h-[340px] md:h-[480px] w-full mb-6 rounded-lg border border-accent-secondary bg-main"
        style={{
          "--swiper-pagination-color": "#FFBA08",
          "--swiper-pagination-bullet-incactive-color": "#999999",
          "--swiper-pagination-bullet-incactive-opacity": "1",
          "--swiper-pagination-bullet-size": "0.6em",
          "--swiper-pagination-bullet-horizontal-gap": "6px",
          "--swiper-theme-color": "#FFF",
          "--swiper-navigation-size": "24px",
          "--swiper-navigation-sides-offset": "30px",
        }}
      >
        <SwiperSlide
          className="relative overflow-hidden px-8 md:px-16 md:p-20 items-center"
          style={{ display: "flex" }}
        >
          <Image
            src={getPublicAssetUrl("/slide/slide-1.png")}
            alt="Retro games hero banner"
            fill
            priority
            sizes="100vw"
            className="object-cover object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/10 to-transparent" />

          <div className="relative z-10 max-w-3xl">
            <div className="text-accent text-sm mb-2 uppercase">Free Arcade Games</div>
            <h1 className="font-display text-2xl md:text-4xl lg:text-6xl mb-4">
              PLAY RETRO GAMES FOR FREE
            </h1>
            <p className="mb-6 max-w-[418px]">
              Relive the classics! Dive into our collection of retro games and enjoy them for free.
              Start playing now!
            </p>
            <a
              href="/search?q=mario"
              className="text-sm bg-accent-gradient py-3 px-6 rounded-xl border border-yellow-400 uppercase"
            >
              Play Mario
            </a>
          </div>
        </SwiperSlide>

        <SwiperSlide
          className="relative overflow-hidden px-8 md:p-20 items-center"
          style={{ display: "flex" }}
        >
          <Image
            src={getPublicAssetUrl("/slide/slide-1.png")}
            alt="Retro games hero banner"
            fill
            sizes="100vw"
            className="object-cover object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/10 to-transparent" />

          <div className="relative z-10 max-w-3xl">
            <div className="text-accent text-sm mb-2 uppercase">Just added</div>
            <h1 className="font-display text-4xl lg:text-6xl mb-4">DISCOVER NEW GAMES</h1>
            <p className="mb-6 max-w-[418px]">
              Check out the latest additions to the library — updated regularly as new games get
              published.
            </p>
            <a
              href="/new-games"
              className="text-sm bg-accent-gradient py-3 px-6 rounded-xl border border-yellow-400 uppercase"
            >
              View New Games
            </a>
          </div>
        </SwiperSlide>
      </Swiper>
    </div>
  );
}
