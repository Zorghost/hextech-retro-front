import { prisma } from "@/lib/prisma";

const getAllGames = async () => {
  const games = await prisma.game.findMany();
  return games;
};

export default async function Page() {
  const games = await getAllGames();

  return (
    <div>
      <h1>Test Page</h1>
        <pre>{JSON.stringify(games, null, 2)}</pre>
    </div>
  );
}