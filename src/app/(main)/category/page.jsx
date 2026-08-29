import { getGameCategories } from "@/features/game/queries"
import EmptyState from "@/components/ui/EmptyState";
import Link from "next/link";
import { getSiteUrl } from "@/lib/siteUrl";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Script from "next/script";
import { buildBreadcrumbJsonLd, safeJsonLdStringify } from "@/features/game/seo";
import GameCard from "@/components/ui/GameCard";

export const revalidate = 3600; // 1 hour

export async function generateMetadata() {
  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}/category`;

  return {
    title: "Categories",
    description: "Browse retro game categories and jump into platform collections across SNES, Nintendo, Sega, Atari, and more.",
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      url: canonical,
      title: "Categories",
      description: "Browse retro game categories and jump into platform collections across SNES, Nintendo, Sega, Atari, and more.",
    },
    twitter: {
      card: "summary",
      title: "Categories",
      description: "Browse retro game categories and jump into platform collections across SNES, Nintendo, Sega, Atari, and more.",
    },
  };
}

export default async function Page() {
  const categories = await getGameCategories();
  const siteUrl = getSiteUrl();
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Home", href: "/" },
    { name: "Categories", href: "/category" },
  ], siteUrl);

  return(
    <div>
      <Script
        id="category-index-breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(breadcrumbLd) }}
      />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Categories" }]} />
      <h1 className="font-display text-3xl mb-4">Categories</h1>
      {categories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Once categories exist, they’ll show up here."
          action={
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-[24px] border border-accent px-5 py-3 text-base font-medium"
            >
              Go home
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-6">
        {categories.map((category) => (
          <GameCard
            key={category.id}
            game={category}
            href={`/category/${category.slug}`}
            showCategoryTitle={false}
            showDescription
          />
        ))}

        </div>
      )}
    </div>
  )
}