import { prisma } from "@/lib/prisma";

const railGameSelect = {
  id: true,
  title: true,
  slug: true,
  image: true,
  created_at: true,
  categories: {
    select: {
      id: true,
      title: true,
      slug: true,
    },
    take: 1,
  },
};

function getSafeLimit(limit, fallback = 8) {
  return Number.isFinite(limit) ? Math.max(1, Math.min(50, limit)) : fallback;
}

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

function normalizeRailGames(games) {
  return games.map((game) => ({
    ...game,
    categoryTitle: game.categories?.[0]?.title ?? null,
  }));
}

function getUtcWeekSeed(date = new Date()) {
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utcDate.getUTCDay() || 7;

  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);

  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((utcDate - yearStart) / 86400000) + 1) / 7);

  return Number(`${utcDate.getUTCFullYear()}${String(weekNumber).padStart(2, "0")}`);
}

function rotateGamesBySeed(games, seed) {
  if (games.length <= 1) {
    return games;
  }

  const offset = seed % games.length;

  return games.slice(offset).concat(games.slice(0, offset));
}

function dedupeSearchGames(games, limit) {
  const items = [];
  const seenIds = new Set();

  for (const game of games) {
    if (!game || seenIds.has(game.id)) {
      continue;
    }

    seenIds.add(game.id);
    items.push(game);

    if (items.length >= limit) {
      break;
    }
  }

  return items;
}

function dedupeSearchTerms(terms, limit) {
  const items = [];
  const seenTerms = new Set();

  for (const term of terms) {
    const normalizedTerm = typeof term === "string" ? term.trim().toLowerCase() : "";

    if (!normalizedTerm || seenTerms.has(normalizedTerm)) {
      continue;
    }

    seenTerms.add(normalizedTerm);
    items.push(term.trim());

    if (items.length >= limit) {
      break;
    }
  }

  return items;
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

export async function getRelatedGames(gameId, categoryIds = [], limit = 4) {
  const safeLimit = getSafeLimit(limit, 4);
  const normalizedCategoryIds = Array.isArray(categoryIds)
    ? categoryIds.filter((categoryId) => Number.isInteger(categoryId))
    : [];

  const relatedGames = normalizedCategoryIds.length
    ? await prisma.game.findMany({
        where: {
          published: true,
          id: {
            not: gameId,
          },
          categories: {
            some: {
              id: {
                in: normalizedCategoryIds,
              },
            },
          },
        },
        orderBy: [
          {
            created_at: "desc",
          },
          {
            id: "desc",
          },
        ],
        take: safeLimit,
        select: railGameSelect,
      })
    : [];

  if (relatedGames.length >= safeLimit) {
    return normalizeRailGames(relatedGames);
  }

  const fallbackGames = await prisma.game.findMany({
    where: {
      published: true,
      id: {
        notIn: [gameId, ...relatedGames.map((game) => game.id)],
      },
    },
    orderBy: [
      {
        created_at: "desc",
      },
      {
        id: "desc",
      },
    ],
    take: safeLimit - relatedGames.length,
    select: railGameSelect,
  });

  return normalizeRailGames([...relatedGames, ...fallbackGames]);
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
  const safeLimit = getSafeLimit(limit, 8);

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
      select: railGameSelect,
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
      select: railGameSelect,
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
        select: railGameSelect,
      });

      selectedGames.push(...wraparoundGames);
    }
  }

  return {
    title: "Discover",
    games: normalizeRailGames(selectedGames),
  };
}

export async function getHomepageRecentlyAdded(limit = 8) {
  const safeLimit = getSafeLimit(limit, 8);
  const games = await prisma.game.findMany({
    where: {
      published: true,
    },
    orderBy: [
      {
        created_at: "desc",
      },
      {
        id: "desc",
      },
    ],
    take: safeLimit,
    select: railGameSelect,
  });

  return {
    title: "Recently added",
    href: "/new-games",
    games: normalizeRailGames(games),
  };
}

export async function getHomepagePopularThisWeek(limit = 8) {
  const safeLimit = getSafeLimit(limit, 8);
  const recentWindowStart = new Date();

  recentWindowStart.setUTCDate(recentWindowStart.getUTCDate() - 21);

  let games = await prisma.game.findMany({
    where: {
      published: true,
      created_at: {
        gte: recentWindowStart,
      },
    },
    orderBy: [
      {
        created_at: "desc",
      },
      {
        id: "desc",
      },
    ],
    take: Math.max(safeLimit * 3, 12),
    select: railGameSelect,
  });

  if (games.length < safeLimit) {
    games = await prisma.game.findMany({
      where: {
        published: true,
      },
      orderBy: [
        {
          created_at: "desc",
        },
        {
          id: "desc",
        },
      ],
      take: Math.max(safeLimit * 3, 12),
      select: railGameSelect,
    });
  }

  return {
    title: "Popular this week",
    games: normalizeRailGames(rotateGamesBySeed(games, getUtcWeekSeed()).slice(0, safeLimit)),
  };
}

export async function getHomepagePlatformSpotlights(limit = 2, gamesPerCategory = 4) {
  const safeCategoryLimit = Number.isFinite(limit) ? Math.max(1, Math.min(4, limit)) : 2;
  const safeGamesLimit = getSafeLimit(gamesPerCategory, 4);
  const categories = await prisma.category.findMany({
    where: {
      games: {
        some: {
          published: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
    take: safeCategoryLimit,
    select: {
      id: true,
      title: true,
      slug: true,
      games: {
        where: {
          published: true,
        },
        orderBy: [
          {
            created_at: "desc",
          },
          {
            id: "desc",
          },
        ],
        take: safeGamesLimit,
        select: railGameSelect,
      },
    },
  });

  return categories.map((category) => ({
    title: `${category.title} spotlight`,
    slug: category.slug,
    games: category.games.map((game) => ({
      ...game,
      categoryTitle: category.title,
    })),
  }));
}

export async function getHomepageEditorPicks(limit = 8) {
  const safeLimit = getSafeLimit(limit, 8);
  const sourceCategories = await prisma.category.findMany({
    where: {
      games: {
        some: {
          published: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
    take: 4,
    select: {
      id: true,
      title: true,
      games: {
        where: {
          published: true,
        },
        orderBy: [
          {
            created_at: "desc",
          },
          {
            id: "desc",
          },
        ],
        take: 4,
        select: railGameSelect,
      },
    },
  });

  const picks = [];
  const seenIds = new Set();
  let roundIndex = 0;

  while (picks.length < safeLimit) {
    let addedInRound = false;

    for (const category of sourceCategories) {
      const game = category.games[roundIndex];

      if (!game || seenIds.has(game.id)) {
        continue;
      }

      seenIds.add(game.id);
      picks.push({
        ...game,
        categoryTitle: category.title,
      });
      addedInRound = true;

      if (picks.length >= safeLimit) {
        break;
      }
    }

    if (!addedInRound) {
      break;
    }

    roundIndex += 1;
  }

  return {
    title: "Editor picks",
    games: picks,
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

export async function getSearchDiscoveryData(options = {}) {
  const suggestionLimit = getSafeLimit(options.suggestionLimit, 12);
  const platformLimit = getSafeLimit(options.platformLimit, 8);
  const featuredLimit = getSafeLimit(options.featuredLimit, 6);

  const [autocompleteGames, popularThisWeek, latestGames, categories] = await Promise.all([
    prisma.game.findMany({
      where: {
        published: true,
      },
      orderBy: [
        {
          title: "asc",
        },
        {
          id: "asc",
        },
      ],
      take: Math.max(suggestionLimit * 4, 40),
      select: {
        id: true,
        title: true,
        slug: true,
      },
    }),
    getHomepagePopularThisWeek(suggestionLimit),
    getLatestPublishedGames(suggestionLimit),
    getGameCategories(platformLimit),
  ]);

  const featuredGames = dedupeSearchGames(
    [...(popularThisWeek?.games ?? []), ...latestGames],
    featuredLimit,
  );

  return {
    autocompleteGames: autocompleteGames.slice(0, Math.max(suggestionLimit * 4, 40)),
    trendingSearches: dedupeSearchTerms(
      [
        ...(popularThisWeek?.games ?? []).map((game) => game.title),
        ...latestGames.map((game) => game.title),
      ],
      suggestionLimit,
    ),
    platformChips: categories.map((category) => ({
      id: category.id,
      title: category.title,
      slug: category.slug,
    })),
    featuredGames: featuredGames.map((game) => ({
      id: game.id,
      title: game.title,
      slug: game.slug,
      image: game.image,
      categoryTitle: game.categoryTitle ?? null,
    })),
  };
}

export async function getLatestPublishedGames(limit = 10) {
  const safeLimit = getSafeLimit(limit, 10);

  return await prisma.game.findMany({
    where: {
      published: true,
    },
    orderBy: [
      {
        created_at: "desc",
      },
      {
        id: "desc",
      },
    ],
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
