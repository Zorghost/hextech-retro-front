import { prisma } from "@/lib/prisma";

const discoverGameSelect = {
  id: true,
  title: true,
  slug: true,
  image: true,
  categories: {
    select: {
      title: true,
    },
    take: 1,
  },
};

function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildRandomIdBatch(minId, maxId, count, excludedIds) {
  const rangeSize = maxId - minId + 1;
  const available = Math.max(0, rangeSize - excludedIds.size);
  const targetCount = Math.min(count, available);

  if (targetCount === 0) {
    return [];
  }

  const ids = [];
  const localExcludedIds = new Set(excludedIds);
  let attemptsRemaining = Math.max(targetCount * 6, 24);

  while (ids.length < targetCount && attemptsRemaining > 0) {
    const candidateId = getRandomIntInclusive(minId, maxId);

    if (!localExcludedIds.has(candidateId)) {
      localExcludedIds.add(candidateId);
      ids.push(candidateId);
    }

    attemptsRemaining -= 1;
  }

  return ids;
}

function normalizeDiscoverGames(games) {
  return games.map((game) => ({
    ...game,
    categoryTitle: game.categories?.[0]?.title ?? null,
  }));
}

export async function getAllGames() {
  return await prisma.game.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      image: true,
      game_url: true,
      published: true,
      created_at: true,
    },
  });
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

  const [games, totalCount] = await Promise.all([
    prisma.game.findMany({
      where: {
        categories: {
          some: {
            slug: categorySlug,
          },
        },
      },
      skip,
      take: ITEMS_PER_PAGE,
      select: {
        id: true,
        title: true,
        slug: true,
        image: true,
      },
    }),
    prisma.game.count({
      where: {
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
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      image: true,
      game_url: true,
      published: true,
      created_at: true,
      categories: {
        select: {
          id: true,
          title: true,
          slug: true,
          core: true,
        },
      },
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
        select: {
          id: true,
          title: true,
          slug: true,
          image: true,
        },
      },
    },
  });
}

export async function getRandomPublishedGames(limit = 8) {
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(50, limit)) : 8;

  const publishedStats = await prisma.game.aggregate({
    where: {
      published: true,
    },
    _count: {
      _all: true,
    },
    _min: {
      id: true,
    },
    _max: {
      id: true,
    },
  });

  const publishedCount = publishedStats._count._all;
  const minId = publishedStats._min.id;
  const maxId = publishedStats._max.id;

  if (publishedCount === 0 || minId === null || maxId === null) {
    return {
      title: "Discover",
      games: [],
    };
  }

  const targetCount = Math.min(safeLimit, publishedCount);
  const rangeSize = maxId - minId + 1;
  const publishedDensity = publishedCount / rangeSize;
  const sampledIds = new Set();
  const selectedIds = new Set();
  const selectedGames = [];

  for (let attempt = 0; attempt < 4 && selectedGames.length < targetCount; attempt += 1) {
    const remaining = targetCount - selectedGames.length;
    const estimatedBatchSize = Math.ceil((remaining / Math.max(publishedDensity, 0.1)) * 1.5);
    const batchSize = Math.min(rangeSize, Math.max(remaining * 2, Math.min(estimatedBatchSize, 250)));
    const candidateIds = buildRandomIdBatch(minId, maxId, batchSize, sampledIds);

    if (candidateIds.length === 0) {
      break;
    }

    for (const candidateId of candidateIds) {
      sampledIds.add(candidateId);
    }

    const games = await prisma.game.findMany({
      where: {
        published: true,
        id: {
          in: candidateIds,
        },
      },
      select: discoverGameSelect,
    });

    const gamesById = new Map(games.map((game) => [game.id, game]));

    for (const candidateId of candidateIds) {
      const game = gamesById.get(candidateId);

      if (game && !selectedIds.has(game.id)) {
        selectedIds.add(game.id);
        selectedGames.push(game);
      }

      if (selectedGames.length >= targetCount) {
        break;
      }
    }
  }

  if (selectedGames.length < targetCount) {
    const pivotId = getRandomIntInclusive(minId, maxId);
    const remaining = targetCount - selectedGames.length;
    const selectedIdList = Array.from(selectedIds);

    const forwardGames = await prisma.game.findMany({
      where: {
        published: true,
        id: {
          gte: pivotId,
          notIn: selectedIdList,
        },
      },
      orderBy: {
        id: "asc",
      },
      take: remaining,
      select: discoverGameSelect,
    });

    selectedGames.push(...forwardGames);
    for (const game of forwardGames) {
      selectedIds.add(game.id);
    }

    if (selectedGames.length < targetCount) {
      const wraparoundGames = await prisma.game.findMany({
        where: {
          published: true,
          id: {
            lt: pivotId,
            notIn: Array.from(selectedIds),
          },
        },
        orderBy: {
          id: "asc",
        },
        take: targetCount - selectedGames.length,
        select: discoverGameSelect,
      });

      selectedGames.push(...wraparoundGames);
    }
  }

  return {
    title: "Discover",
    games: normalizeDiscoverGames(selectedGames),
  };
}

export async function getGameCategories(limit) {
  const take = Number.isInteger(limit) && limit > 0 ? limit : undefined;

  return await prisma.category.findMany({
    take,
    select: {
      id: true,
      title: true,
      slug: true,
      core: true,
      image: true,
    },
    orderBy: {
      id: "asc",
    },
  });
}

export async function getCategoryMenu() {
  return await prisma.category.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      _count: {
        select: {
          games: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });
}

export async function getSearchResults(params) {
  return await prisma.game.findMany({
    where: {
      published: true,
      title: {
        contains: params,
        mode: "insensitive",
      },
    },
    take: 100,
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      image: true,
    },
  });
}

export async function getLatestPublishedGames(limit = 10) {
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(50, limit)) : 10;

  return await prisma.game.findMany({
    where: {
      published: true,
    },
    orderBy: {
      id: "desc",
    },
    take: safeLimit,
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      image: true,
      created_at: true,
    },
  });
}
