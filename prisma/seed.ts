import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seed() {
  // cleanup the existing database
  await prisma.user
    .deleteMany({ where: { email: { startsWith: "player" } } })
    .catch(() => {
      // no worries if it doesn't exist yet
    });

  const hashedPassword = await bcrypt.hash("password", 10);

  const player1 = await prisma.user.create({
    data: {
      email: "player1@modiphy.net",
      name: "Neil",
      role: "SuperAdmin",
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  });

  const player2 = await prisma.user.create({
    data: {
      email: "player2@modiphy.net",
      name: "Marianne",
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  });

  const initialMovieId = "105"; // BTTF;

  const game = await prisma.game.create({
    data: {
      player1Id: player1.id,
      player2Id: player2.id,
      currentTurnUserId: player2.id,
    },
  });

  await prisma.turn.create({
    data: {
      gameId: game.id,
      userId: player2.id,
      movieId: initialMovieId,
    },
  });

  console.log(`Database has been seeded. 🌱`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
