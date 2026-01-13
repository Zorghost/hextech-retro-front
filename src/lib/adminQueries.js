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



