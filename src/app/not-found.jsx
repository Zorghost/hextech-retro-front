import Image from "next/image";
import { getPublicAssetUrl } from "@/lib/assetUrls";

export default function NotFound() {
  return (
    <section className="relative flex items-center justify-center h-screen overflow-hidden">
      <Image
        src={getPublicAssetUrl("/page/not-found.jpg")}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 flex flex-col text-center">
        <h1 className="mb-4 text-4xl md:text-5xl lg:text-7xl lg:leading-tight font-extrabold">
          404
        </h1>
        <p className="mb-8 text-lg font-normal text-gray-200 lg:text-lg">Page Not Found.</p>
        <a
          href="/"
          className="inline-flex items-center justify-center px-5 py-3 text-base font-medium text-center rounded-[24px] bg-accent focus:right-4"
        >
          Go to homepage...
        </a>
      </div>
    </section>
  )
}