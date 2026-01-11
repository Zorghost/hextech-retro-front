const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  // If you inserted explicit IDs into SERIAL columns (common when seeding),
  // Postgres sequences can fall behind and cause:
  // "Unique constraint failed on the fields: (id)"

  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('"Game"', 'id'),
      COALESCE((SELECT MAX(id) FROM "Game"), 0) + 1,
      false
    );
  `);

  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('"Category"', 'id'),
      COALESCE((SELECT MAX(id) FROM "Category"), 0) + 1,
      false
    );
  `);

  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('"User"', 'id'),
      COALESCE((SELECT MAX(id) FROM "User"), 0) + 1,
      false
    );
  `);

  console.log("Resynced sequences for Game, Category, User");
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
