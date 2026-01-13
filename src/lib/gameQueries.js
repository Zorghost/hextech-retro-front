import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

const _getAllGames = unstable_cache(
  async () => prisma.game.findMany({}),
  ["games:all"],
  { revalidate: 60 * 60, tags: ["games"] },
);

export async function getAllGames() {
  return _getAllGames();
}

const _getPublishedGamesForSitemap = unstable_cache(
  async () =>
    prisma.game.findMany({
      where: {
        published: true,
      },
      select: {
        slug: true,
        created_at: true,
      },
    }),
  ["sitemap:games"],
  { revalidate: 60 * 60 * 12, tags: ["sitemap", "games"] },
);

export async function getPublishedGamesForSitemap() {
  return _getPublishedGamesForSitemap();
}

const _getGamesByCategory = unstable_cache(
  async (categorySlug, page = 1) => {
    const ITEMS_PER_PAGE = 20;
    const skip = (page - 1) * ITEMS_PER_PAGE;

    const [games, totalCount] = await Promise.all([
      prisma.game.findMany({
        where: {
          published: true,
          categories: {
            some: {
              slug: categorySlug,
            },
          },
        },
        skip,
        take: ITEMS_PER_PAGE,
      }),
      prisma.game.count({
        where: {
          published: true,
          categories: {
            some: {
              slug: categorySlug,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    return { games, totalPages, currentPage: page };
  },
  ["category:games"],
  { revalidate: 60 * 10, tags: ["games", "categories"] },
);

export async function getGamesByCategory(categorySlug, page = 1) {
  return _getGamesByCategory(categorySlug, page);
}

const _getGameBySlug = unstable_cache(
  async (slug) =>
    prisma.game.findUnique({
      where: {
        slug,
      },
      include: {
        categories: true,
      },
    }),
  ["game:bySlug"],
  { revalidate: 60 * 60, tags: ["games", "categories"] },
);

export async function getGameBySlug(slug) {
  return _getGameBySlug(slug);
}

const _getCategoryBySlug = unstable_cache(
  async (slug) =>
    prisma.category.findFirst({
      where: {
        slug,
      },
      orderBy: {
        id: "asc",
      },
      select: {
        title: true,
        slug: true,
        image: true,
        core: true,
      },
    }),
  ["category:bySlug"],
  { revalidate: 60 * 60, tags: ["categories"] },
);

export async function getCategoryBySlug(slug) {
  return _getCategoryBySlug(slug);
}

const _getGamesBySelectedCategories = unstable_cache(
  async (categoryIds) =>
    prisma.category.findMany({
      where: {
        id: {
          in: categoryIds,
        },
        games: {
          some: {
            published: true,
          },
        },
      },
      select: {
        title: true,
        slug: true,
        games: {
          where: {
            published: true,
          },
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            image: true,
            game_url: true,
            created_at: true,
          },
        },
      },
    }),
  ["categories:selected"],
  { revalidate: 60 * 10, tags: ["games", "categories"] },
);

export async function getGamesBySelectedCategories(categoryIds) {
  return _getGamesBySelectedCategories(categoryIds);
}

const _getGamesByCategoryId = unstable_cache(
  async (categoryId) =>
    prisma.category.findUnique({
      where: {
        id: categoryId,
      },
      select: {
        title: true,
        slug: true,
        games: {
          where: {
            published: true,
          },
          take: 8,
        },
      },
    }),
  ["category:byId"],
  { revalidate: 60 * 10, tags: ["games", "categories"] },
);

export async function getGamesByCategoryId(categoryId) {
  return _getGamesByCategoryId(categoryId);
}

const _getGameCategories = unstable_cache(
  async () => prisma.category.findMany({}),
  ["categories:all"],
  { revalidate: 60 * 60, tags: ["categories"] },
);

export async function getGameCategories() {
  return _getGameCategories();
}

const _getCategoryMenu = unstable_cache(
  async () =>
    prisma.category.findMany({
      include: {
        games: {
          where: {
            published: true,
          },
          select: { id: true },
        },
      },
    }),
  ["categories:menu"],
  { revalidate: 60 * 60, tags: ["categories"] },
);

export async function getCategoryMenu() {
  return _getCategoryMenu();
}

export async function getSearchResults(params) {
  // Search tends to be user-specific and high cardinality; keep uncached.
  return prisma.game.findMany({
    where: {
      published: true,
      title: {
        contains: params,
        mode: "insensitive",
      },
    },
    take: 100,
  });
}
