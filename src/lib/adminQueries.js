import { prisma } from "@/lib/prisma";

export async function getAllGames() {
  return await prisma.game.findMany({});
}

export async function getGameCategories() {
  return await prisma.category.findMany({});
}

export async function getGameById(id) {
  return await prisma.game.findUnique({
    where: {
      id: id
    },
    include: {
      categories: true
    }
  });
}



