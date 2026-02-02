import { ChevronRightIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { getCategoryImageUrl } from "@/lib/assetUrls";

const isProxyImageSource = (process.env.NEXT_PUBLIC_IMAGE_SOURCE ?? "").toLowerCase() === "proxy";

export default function CategorySlider({ categories }) {
  if (!Array.isArray(categories) || categories.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex justify-between gap-4">
        <h2 className="font-display mb-4 items-center">Categories</h2>
        <a
          href="/category"
          className="text-sm font-medium hover:underline underline-offset-4"
        >
          View All{" "}
          <ChevronRightIcon className="h-4 w-4 inline-block text-accent" />
        </a>
      </div>

      <div
        className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory"
        aria-label="Game categories"
      >
        {categories.map((item) => (
          <a
            key={item?.id ?? item?.slug}
            href={`/category/${item.slug}`}
            className="group flex-none w-28 sm:w-32 md:w-36 snap-start"
          >
            <div className="relative w-full aspect-square overflow-hidden rounded-lg border-accent-secondary border mb-2 bg-main">
              <Image
                src={getCategoryImageUrl(item.image)}
                alt={item.title}
                fill
                sizes="(max-width: 640px) 30vw, (max-width: 768px) 22vw, 160px"
                unoptimized={isProxyImageSource}
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <h3 className="font-medium leading-snug">{item.title}</h3>
          </a>
        ))}
      </div>
    </div>
  );
}
