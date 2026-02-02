import { prisma } from "@/lib/prisma";

export const metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

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