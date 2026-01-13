import { prisma } from "@/lib/prisma";

export async function getAllGames() {
  return await prisma.game.findMany({
    select: {
      id: true,
      title: true,
      image: true,
    },
    orderBy: {
      id: "desc",
    },
  });
}

function buildGamesWhere({ query, categoryId, published }) {
  const trimmedQuery = typeof query === "string" ? query.trim() : "";
  const parsedCategoryId =
    typeof categoryId === "string" && categoryId.length > 0 ? parseInt(categoryId, 10) : undefined;

  const where = {
    AND: [
      trimmedQuery.length
        ? {
            OR: [
              { title: { contains: trimmedQuery, mode: "insensitive" } },
              { slug: { contains: trimmedQuery, mode: "insensitive" } },
            ],
          }
        : undefined,
      Number.isFinite(parsedCategoryId)
        ? { categories: { some: { id: parsedCategoryId } } }
        : undefined,
      published === "true" ? { published: true } : undefined,
      published === "false" ? { published: false } : undefined,
    ].filter(Boolean),
  };

  return where;
}

export async function getTotalGamesCount() {
  return await prisma.game.count();
}

export async function getGamesPage({ page = 1, pageSize = 24, query, categoryId, published } = {}) {
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 24;

  const where = buildGamesWhere({ query, categoryId, published });

  const total = await prisma.game.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const clampedPage = Math.min(safePage, totalPages);
  const skip = (clampedPage - 1) * safePageSize;

  const games = await prisma.game.findMany({
    where,
    select: {
      id: true,
      title: true,
      slug: true,
      image: true,
      published: true,
      categories: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      id: "desc",
    },
    skip,
    take: safePageSize,
  });

  return {
    games,
    total,
    page: clampedPage,
    pageSize: safePageSize,
    totalPages,
  };
}

export async function getGameCategories() {
  return await prisma.category.findMany({
    select: {
      id: true,
      title: true,
    },
    orderBy: {
      id: "asc",
    },
  });
}

export async function getGameById(id) {
  return await prisma.game.findUnique({
    where: {
      id: id
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      image: true,
      game_url: true,
      published: true,
      categories: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
}



