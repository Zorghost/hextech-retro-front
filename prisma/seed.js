const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");

async function main() {
  const categories = [
    {
      id: 1,
      title: "Atari",
      slug: "atari",
      image: "atari.jpg",
      core: "atari2600",
    },
    {
      id: 2,
      title: "MAME 2003",
      slug: "mame-2003",
      image: "mame.jpg",
      core: "mame2003",
    },
    {
      id: 3,
      title: "SNES",
      slug: "snes",
      image: "super-nintendo.jpg",
      core: "snes",
    },
    {
      id: 4,
      title: "Nintendo 64",
      slug: "nintendo-64",
      image: "n64.jpg",
      core: "n64",
    },
    {
      id: 5,
      title: "PlayStation",
      slug: "playstation",
      image: "playstation.jpg",
      core: "psx",
    },
    {
      id: 6,
      title: "Sega Mega Drive",
      slug: "sega-mega-drive",
      image: "sega.jpg",
      core: "segaMD",
    },
    {
      id: 7,
      title: "Nintendo (NES)",
      slug: "nes",
      image: "placeholder.jpg",
      core: "nes",
    },
    {
      id: 8,
      title: "Game Boy",
      slug: "gameboy",
      image: "placeholder.jpg",
      core: "gb",
    },
    {
      id: 9,
      title: "Game Boy Color",
      slug: "gameboy-color",
      image: "placeholder.jpg",
      core: "gb",
    },
    {
      id: 10,
      title: "Game Boy Advance",
      slug: "gameboy-advance",
      image: "placeholder.jpg",
      core: "gba",
    },
    {
      id: 11,
      title: "Nintendo DS",
      slug: "nintendo-ds",
      image: "placeholder.jpg",
      core: "desmume",
    },
    {
      id: 12,
      title: "PlayStation Portable (PSP)",
      slug: "psp",
      image: "placeholder.jpg",
      core: "psp",
    },
    {
      id: 13,
      title: "Sega Saturn",
      slug: "sega-saturn",
      image: "placeholder.jpg",
      core: "segaSaturn",
    },
    {
      id: 14,
      title: "SNK Neo Geo",
      slug: "neo-geo",
      image: "placeholder.jpg",
      core: "arcade",
    },
  ];

  const games = [];

  for (const category of categories) {
    const existingCategory = await prisma.category.findFirst({
      where: {
        slug: category.slug,
      },
    });

    if (existingCategory) {
      await prisma.category.update({
        where: {
          id: existingCategory.id,
        },
        data: {
          title: category.title,
          image: category.image,
          core: category.core,
          slug: category.slug,
        },
      });
      continue;
    }

    await prisma.category.create({
      data: {
        title: category.title,
        image: category.image,
        core: category.core,
        slug: category.slug,
      },
    });
  }

  for (const game of games) {
    await prisma.game.upsert({
      where: {
        id: game.id,
      },
      update: {
        title: game.title,
        slug: game.slug,
        image: game.image,
        description: game.description,
        game_url: game.game_url,
        published: game.published,
        categories: {
          set: game.categories.map((categoryId) => ({ id: categoryId })),
        },
      },
      create: {
        id: game.id,
        title: game.title,
        slug: game.slug,
        image: game.image,
        description: game.description,
        game_url: game.game_url,
        published: game.published,
        categories: {
          connect: game.categories.map((categoryId) => ({ id: categoryId })),
        },
      },
    });
  }


  const password = await bcrypt.hash("password", 12);
  const email = "admin@admin.com"

  const user = await prisma.user.upsert({
    where: { email: email },
    update: {
      name: "Admin",
      password: password,
      role: "admin",
    },
    create: {
      name: "Admin",
      email: email,
      password: password,
      role: "admin"
    }
  })

  // Re-sync SERIAL sequences in case we inserted explicit IDs above.
  // Without this, Postgres may reuse an existing ID and fail with:
  // "Unique constraint failed on the fields: (`id`)".
  await prisma.$executeRaw`
    SELECT setval(
      pg_get_serial_sequence('"Game"', 'id'),
      COALESCE((SELECT MAX(id) FROM "Game"), 0) + 1,
      false
    );
  `;
  await prisma.$executeRaw`
    SELECT setval(
      pg_get_serial_sequence('"Category"', 'id'),
      COALESCE((SELECT MAX(id) FROM "Category"), 0) + 1,
      false
    );
  `;
  await prisma.$executeRaw`
    SELECT setval(
      pg_get_serial_sequence('"User"', 'id'),
      COALESCE((SELECT MAX(id) FROM "User"), 0) + 1,
      false
    );
  `;
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })