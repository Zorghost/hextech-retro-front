import { getGameBySlug, getRelatedGames } from "@/lib/gameQueries";
import LazyGameEmulator from "@/components/LazyGameEmulator";
import LazyDisqus from "@/components/LazyDisqus";
import { getGameThumbnailUrl, getRomUrlWithBase } from "@/lib/assetUrls";
import { getSiteUrl } from "@/lib/siteUrl";
import { safeJsonLdStringify } from "@/lib/jsonLd";
import { notFound } from "next/navigation";
import {
  ArrowsPointingOutIcon,
  CommandLineIcon,
  CpuChipIcon,
  DevicePhoneMobileIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";

const isProxyImageSource = (process.env.NEXT_PUBLIC_IMAGE_SOURCE ?? "").toLowerCase() === "proxy";

const CORE_LABELS = {
  arcade: "Arcade",
  atari: "Atari",
  gameboy: "Game Boy",
  "gameboy-advance": "Game Boy Advance",
  "gameboy-color": "Game Boy Color",
  "mame-2003": "MAME 2003",
  "nintendo-64": "Nintendo 64",
  "nintendo-ds": "Nintendo DS",
  "neo-geo": "Neo Geo",
  nes: "NES",
  psp: "PSP",
  playstation: "PlayStation",
  "sega-mega-drive": "Sega Mega Drive",
  "sega-saturn": "Sega Saturn",
  snes: "SNES",
};

function formatCoreLabel(core) {
  if (!core) {
    return null;
  }

  return CORE_LABELS[core] ?? core.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function getKeyboardTips(platformLabel) {
  return [
    `Arrow keys or D-pad to move; Z / X / A / S are the main action buttons for most ${platformLabel ?? "retro"} games.`,
    "Enter → Start, Shift → Select. Use the in-player menu to remap any button.",
  ];
}

function buildBrokenRomHref(game, canonical, supportEmail) {
  if (!supportEmail) {
    return `${canonical}#comments`;
  }

  const subject = encodeURIComponent(`Broken ROM report: ${game.title}`);
  const body = encodeURIComponent(
    [
      `Game: ${game.title}`,
      `Page: ${canonical}`,
      "Issue:",
      "",
      "Device / browser:",
      "",
      "What happened after pressing Load & Play:",
    ].join("\n")
  );

  return `mailto:${supportEmail}?subject=${subject}&body=${body}`;
}

function DetailCard({ icon: Icon, title, children }) {
  return (
    <section className="rounded-2xl border border-accent-secondary bg-main/90 p-5">
      <div className="mb-3 flex items-center gap-3">
        {Icon ? (
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent-secondary bg-accent-secondary/70 text-slate-100">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        ) : null}
        <h2 className="font-display text-lg">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export async function generateMetadata({ params }) {
  const game = await getGameBySlug(params.slug);
  const siteUrl = getSiteUrl();
  const defaultDescription =
    "Play classic retro games online for free — browse our Atari, SNES, Sega and Nintendo collections.";

  if (!game) {
    return {
      title: "Game not found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = game.title || "Retro game";
  const description = game.description || defaultDescription;

  const canonical = `${siteUrl}/game/${game.slug}`;
  const rawImageUrl = game.image ? getGameThumbnailUrl(game.image) : undefined;
  const imageUrl = rawImageUrl
    ? rawImageUrl.startsWith("http")
      ? rawImageUrl
      : `${siteUrl}${rawImageUrl}`
    : undefined;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "article",
      url: canonical,
      title,
      description,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function Page({ params }) {
  const game = await getGameBySlug(params.slug);

  if (!game) notFound();

  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}/game/${game.slug}`;
  const primaryCategory = game?.categories?.[0];
  const categoryIds = game?.categories?.map((category) => category.id) ?? [];
  const relatedGames = await getRelatedGames(game.id, categoryIds, 4);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      ...(primaryCategory
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: primaryCategory.title,
              item: `${siteUrl}/category/${primaryCategory.slug}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: primaryCategory ? 3 : 2,
        name: game.title,
        item: canonical,
      },
    ],
  };

  const romBaseUrl = process.env.NEXT_PUBLIC_ROM_BASE_URL;
  const romUrl = game?.game_url ? getRomUrlWithBase(game.game_url, romBaseUrl) : null;
  const supportEmail =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL ||
    process.env.NEXT_SUPPORT_EMAIL ||
    process.env.SUPPORT_EMAIL ||
    "";
  const platformLabel = primaryCategory?.title ?? "Retro system";
  const emulatorCore = formatCoreLabel(primaryCategory?.core);
  const romFilename = game?.game_url?.split("/").pop() ?? null;
  const addedDate = game?.created_at
    ? new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(game.created_at))
    : null;
  const controlTips = getKeyboardTips(platformLabel);
  const reportHref = buildBrokenRomHref(game, canonical, supportEmail);
  const reportCtaLabel = supportEmail ? "Email a broken-ROM report" : "Report it in comments";
  const categories = Array.isArray(game.categories) ? game.categories : [];

  return (
    <div className="space-y-8">
      <Script
        id="breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(breadcrumbLd) }}
      />

      <nav className="rounded-md w-full">
        <ol className="list-reset flex">
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <span className="text-gray-500 mx-2">/</span>
          </li>
          <li>
            {primaryCategory ? (
              <Link href={`/category/${primaryCategory.slug}`}>{primaryCategory.title}</Link>
            ) : (
              <span className="text-gray-500">Category</span>
            )}
          </li>
          <li>
            <span className="text-gray-500 mx-2">/</span>
          </li>
          <li>
            <span className="text-gray-500">{game?.title}</span>
          </li>
        </ol>
      </nav>

      <section className="rounded-[28px] border border-accent-secondary bg-[radial-gradient(circle_at_top,_rgba(68,97,113,0.35),_rgba(3,19,34,0.96)_55%)] p-4 sm:p-6 md:p-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="rounded-full border border-accent px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-200 transition hover:border-slate-200 hover:text-white"
                >
                  {category.title}
                </Link>
              ))}
            </div>
            <h1 className="font-display text-3xl md:text-4xl">{game.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
              {game.description || "Load the ROM, try the emulator in fullscreen, and keep a few nearby alternatives ready if you want another run after this one."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm text-slate-200 sm:w-fit">
            <div className="rounded-2xl border border-accent-secondary bg-main/70 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.2em] text-accent">Platform</div>
              <div className="mt-1 font-medium">{platformLabel}</div>
            </div>
            <div className="rounded-2xl border border-accent-secondary bg-main/70 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.2em] text-accent">Core</div>
              <div className="mt-1 font-medium">{emulatorCore ?? "Auto-detected"}</div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <LazyGameEmulator game={game} romUrl={romUrl} />
            <div className="md:hidden flex items-start gap-3 rounded-2xl border border-accent-secondary bg-main/70 px-4 py-3 text-sm text-slate-300">
              <DevicePhoneMobileIcon className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
              <span>
                Rotate to <strong className="text-slate-100">landscape</strong> and tap{" "}
                <strong className="text-slate-100">Load &amp; Play</strong> — touch controls appear on screen automatically.
              </span>
            </div>
            <div className="hidden md:block rounded-2xl border border-accent-secondary bg-main/70 px-4 py-3 text-sm text-slate-300">
              Tip: let the emulator finish loading before entering fullscreen, especially on lower-powered devices.
            </div>
          </div>

          <aside className="space-y-4">
            <DetailCard icon={CpuChipIcon} title="Platform info">
              <dl className="space-y-3 text-sm text-slate-300">
                <div className="flex items-start justify-between gap-4 border-b border-accent-secondary/80 pb-3">
                  <dt className="text-accent">System</dt>
                  <dd className="text-right font-medium text-slate-100">{platformLabel}</dd>
                </div>
                <div className="flex items-start justify-between gap-4 border-b border-accent-secondary/80 pb-3">
                  <dt className="text-accent">Emulator core</dt>
                  <dd className="text-right font-medium text-slate-100">{emulatorCore ?? "Auto-detected"}</dd>
                </div>
                <div className="flex items-start justify-between gap-4 border-b border-accent-secondary/80 pb-3">
                  <dt className="text-accent">Added</dt>
                  <dd className="text-right font-medium text-slate-100">{addedDate ?? "Recently"}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-accent">ROM file</dt>
                  <dd className="max-w-[13rem] truncate text-right font-medium text-slate-100" title={romFilename ?? undefined}>
                    {romFilename ?? "Managed by storage"}
                  </dd>
                </div>
              </dl>
            </DetailCard>

            <DetailCard icon={CommandLineIcon} title="Controls">
              <div className="space-y-4 text-sm leading-6 text-slate-300">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.18em] text-accent">Touch / mobile</p>
                  <ul className="space-y-2">
                    <li>A virtual gamepad overlay appears automatically once the ROM loads — no extra setup needed.</li>
                    <li>Tap the screen once if the overlay disappears. Use the emulator settings to reposition it.</li>
                  </ul>
                </div>
                <div className="border-t border-accent-secondary/60 pt-4">
                  <p className="mb-2 text-xs uppercase tracking-[0.18em] text-accent">Keyboard</p>
                  <ul className="space-y-2">
                    {controlTips.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </DetailCard>

            <DetailCard icon={ArrowsPointingOutIcon} title="Fullscreen tips">
              <ul className="space-y-2 text-sm leading-6 text-slate-300">
                <li>Tap the <strong className="text-slate-100">Fullscreen</strong> button below the player to fill your screen — works on Android and iOS alike.</li>
                <li>On phones, rotate to <strong className="text-slate-100">landscape</strong> first for the best fit, then tap Fullscreen.</li>
                <li>If video or audio glitches after resizing, tap <strong className="text-slate-100">Exit fullscreen</strong> once and reload the player.</li>
              </ul>
            </DetailCard>

            <DetailCard icon={ExclamationTriangleIcon} title="Broken ROM reporting">
              <p className="text-sm leading-6 text-slate-300">
                If the ROM hangs, shows a blank screen, or boots with missing audio, include your device, browser, and what happened right after loading.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row xl:flex-col">
                <a
                  href={reportHref}
                  className="inline-flex items-center justify-center rounded-xl border border-yellow-400 bg-accent-gradient px-4 py-3 text-sm font-medium uppercase tracking-[0.15em] text-slate-950"
                >
                  {reportCtaLabel}
                </a>
                <a
                  href="#comments"
                  className="inline-flex items-center justify-center rounded-xl border border-accent px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-slate-200 hover:text-white"
                >
                  Open comments
                </a>
              </div>
            </DetailCard>

            {relatedGames.length ? (
              <DetailCard title="Related games">
                <div className="space-y-3">
                  {relatedGames.map((relatedGame) => (
                    <Link
                      key={relatedGame.id}
                      href={`/game/${relatedGame.slug}`}
                      className="group flex items-center gap-3 rounded-2xl border border-accent-secondary bg-accent-secondary/35 p-3 transition hover:border-accent hover:bg-accent-secondary/70"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-accent-secondary">
                        <Image
                          src={getGameThumbnailUrl(relatedGame.image)}
                          alt={relatedGame.title}
                          fill
                          sizes="64px"
                          unoptimized={isProxyImageSource}
                          quality={70}
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="min-w-0">
                        {relatedGame.categoryTitle ? (
                          <p className="text-xs uppercase tracking-[0.18em] text-accent">{relatedGame.categoryTitle}</p>
                        ) : null}
                        <p className="truncate text-sm font-medium text-slate-100">{relatedGame.title}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </DetailCard>
            ) : null}
          </aside>
        </div>
      </section>

      <div id="comments" className="scroll-mt-24">
        <LazyDisqus url={canonical} identifier={game?.id} title={game?.title} />
      </div>
    </div>
  );
}
