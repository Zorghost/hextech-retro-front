import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function getAllGames() {
  return await prisma.game.findMany({});
}

export async function getPublishedGamesForSitemap() {
  return await prisma.game.findMany({
    where: {
      published: true,
    },
    select: {
      slug: true,
      created_at: true,
    },
  });
}

export async function getGamesByCategory(categorySlug, page = 1) {
  const ITEMS_PER_PAGE = 20;
  const skip = (page - 1) * ITEMS_PER_PAGE;

  // Sorting for public listings.
  // NOTE: There is no "popularity" field in the schema currently.
  const sort = arguments.length >= 3 ? arguments[2] : "newest";
  const orderBy =
    sort === "az"
      ? { title: "asc" }
      : sort === "za"
        ? { title: "desc" }
        : { created_at: "desc" };

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
      orderBy,
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
}

export async function getGameBySlug(slug) {
  return await prisma.game.findUnique({
    where: {
      slug: slug,
    },
    include: {
      categories: true,
    },
  });
}

export async function getCategoryBySlug(slug) {
  return await prisma.category.findFirst({
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
  });
}

export async function getGamesBySelectedCategories(categoryIds) {
  return await prisma.category.findMany({
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
  });
}

export async function getGamesByCategoryId(categoryId) {
  return await prisma.category.findUnique({
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
  });
}

export async function getGameCategories() {
  return await prisma.category.findMany({});
}

export async function getCategoryMenu() {
  return await prisma.category.findMany({
    include: {
      games: true,
    },
  });
}

export async function getSearchResults(params) {
  return await prisma.game.findMany({
    where: {
      published: true,
      title: {
        contains: params,
      },
    },
    take: 100,
  });
}
